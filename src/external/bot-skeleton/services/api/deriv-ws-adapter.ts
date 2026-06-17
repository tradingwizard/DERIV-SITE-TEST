/**
 * DerivAPIBasic-compatible adapter for the NEW Deriv API platform.
 *
 * The new platform differs from the legacy `@deriv/deriv-api`:
 *   - Authentication is done by connecting to an OTP-authenticated WebSocket
 *     URL (no `authorize` message). The OTP URL is obtained over REST.
 *   - Public (unauthenticated) market data uses a separate public WebSocket.
 *   - Several response/request fields were renamed.
 *
 * This adapter mimics the subset of the DerivAPIBasic surface used across the
 * app (`connection`, `send`, `onMessage`, `forget`, `forgetAll`, `authorize`,
 * `disconnect`, `getSelfExclusion`) and translates field names in both
 * directions so the trade engine, stores and services keep working unchanged.
 */
import { DERIV_WS_BASE, GTS_APP_ID } from '@/components/shared/utils/config/config';
import { fetchAccounts, fetchWebSocketUrl, isVirtualAccount, TDerivAccount } from './deriv-rest';

type TMessageCallback = (message: { data: any }) => void;

type TPending = {
    req_id: number;
    expect: string;
    is_subscribe: boolean;
    request: Record<string, any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    settled: boolean;
};

const META_KEYS = new Set([
    'subscribe',
    'req_id',
    'passthrough',
    'end',
    'count',
    'granularity',
    'style',
    'account',
    'adjust_start_time',
    'start',
]);

const MARKET_DISPLAY: Record<string, string> = {
    forex: 'Forex',
    synthetic_index: 'Derived',
    indices: 'Stock Indices',
    stocks: 'Stocks & indices',
    commodities: 'Commodities',
    cryptocurrency: 'Cryptocurrencies',
    basket_index: 'Baskets',
    derived: 'Derived',
};

const humanize = (key?: string): string => {
    if (!key) return '';
    if (MARKET_DISPLAY[key]) return MARKET_DISPLAY[key];
    return key
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

const coerce = (obj: Record<string, any>, keys: string[]) => {
    keys.forEach(key => {
        const value = obj[key];
        if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
            obj[key] = Number(value);
        }
    });
};

class ConnectionFacade {
    listeners: Record<string, Set<() => void>> = {};
    private getWs: () => WebSocket | null;

    constructor(getWs: () => WebSocket | null) {
        this.getWs = getWs;
    }

    get readyState(): number {
        const ws = this.getWs();
        return ws ? ws.readyState : WebSocket.CONNECTING;
    }

    addEventListener(type: string, cb: () => void) {
        (this.listeners[type] ||= new Set()).add(cb);
    }

    removeEventListener(type: string, cb: () => void) {
        this.listeners[type]?.delete(cb);
    }

    emit(type: string) {
        this.listeners[type]?.forEach(cb => {
            try {
                cb();
            } catch {
                /* noop */
            }
        });
    }
}

export class DerivWsAdapter {
    connection: ConnectionFacade;
    private ws: WebSocket | null = null;
    private connect_seq = 0;
    private req_id = 1;
    private pending = new Map<number, TPending>();
    private message_subscribers = new Set<TMessageCallback>();
    private queue: string[] = [];
    private bearer: string | null = null;
    private keep_alive: ReturnType<typeof setInterval> | null = null;
    private manually_closed = false;

    constructor() {
        this.connection = new ConnectionFacade(() => this.ws);
        // Connect to the public endpoint so logged-out users get market data.
        this.connectPublic();
    }

    private connectPublic() {
        const url = `${DERIV_WS_BASE}/public?app_id=${encodeURIComponent(GTS_APP_ID)}`;
        this.connect(url).catch(() => {
            /* public data optional; ignore */
        });
    }

    private connect(url: string): Promise<void> {
        // Each connect attempt gets a monotonically increasing sequence number.
        // Only the most recently initiated connection is allowed to become the
        // active socket. This prevents a late-opening public socket from
        // replacing (and closing) a freshly authenticated socket — the auth
        // connect always has a higher sequence than the constructor's public one.
        const seq = ++this.connect_seq;
        return new Promise((resolve, reject) => {
            let ws: WebSocket;
            try {
                ws = new WebSocket(url);
            } catch (e) {
                reject(e);
                return;
            }

            let opened = false;
            let settled = false;
            const settle = (fn: () => void) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                fn();
            };

            // If the socket never opens, fail fast so the authorize flow can
            // retry / surface an error instead of hanging forever.
            const timeout = setTimeout(() => {
                if (opened) return;
                try {
                    ws.close();
                } catch {
                    /* noop */
                }
                settle(() => reject(new Error('WebSocket connection timed out.')));
            }, 15000);

            const onOpen = () => {
                opened = true;
                // A newer connection was started after this one — discard this
                // socket so it can never clobber the active (newer) socket.
                if (seq !== this.connect_seq) {
                    try {
                        ws.close();
                    } catch {
                        /* noop */
                    }
                    settle(resolve);
                    return;
                }
                const previous = this.ws;
                this.ws = ws;
                if (previous && previous !== ws) {
                    try {
                        previous.close();
                    } catch {
                        /* noop */
                    }
                }
                this.flushQueue();
                this.startKeepAlive();
                this.connection.emit('open');
                settle(resolve);
            };

            ws.addEventListener('open', onOpen, { once: true });
            ws.addEventListener('message', (evt: MessageEvent) => {
                if (ws !== this.ws) return; // ignore messages from stale sockets
                this.handleMessage(evt.data);
            });
            ws.addEventListener('close', () => {
                // Closed before it ever opened: the attempt failed (e.g. an
                // invalid/expired OTP). Reject so callers don't hang.
                if (!opened) {
                    settle(() => reject(new Error('WebSocket closed before opening.')));
                    return;
                }
                if (ws !== this.ws) return; // an old (swapped-out) socket closed
                this.stopKeepAlive();
                if (!this.manually_closed) this.connection.emit('close');
            });
            ws.addEventListener('error', e => {
                // Only matters while the attempt has not yet opened.
                if (!opened) {
                    settle(() => reject(e instanceof Error ? e : new Error('WebSocket connection error.')));
                }
            });
        });
    }

    /**
     * Fetches a fresh OTP and opens the authenticated socket, retrying on
     * transient OTP (500) or WebSocket failures. OTPs are single-use and
     * short-lived, so a new one is requested before each attempt.
     */
    private async connectWithOtpRetry(token: string, accountId: string, attempts = 3): Promise<void> {
        let last_error: any;
        for (let i = 0; i < attempts; i++) {
            try {
                const ws_url = await fetchWebSocketUrl(token, accountId);
                await this.connect(ws_url);
                return;
            } catch (e) {
                last_error = e;
                if (i < attempts - 1) {
                    await new Promise(r => setTimeout(r, 600 * (i + 1)));
                }
            }
        }
        throw last_error ?? new Error('Failed to establish a trading connection.');
    }

    private startKeepAlive() {
        this.stopKeepAlive();
        this.keep_alive = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.sendRaw({ ping: 1 });
            }
        }, 30000);
    }

    private stopKeepAlive() {
        if (this.keep_alive) clearInterval(this.keep_alive);
        this.keep_alive = null;
    }

    private sendRaw(payload: Record<string, any>) {
        try {
            this.ws?.send(JSON.stringify(payload));
        } catch {
            /* noop */
        }
    }

    private flushQueue() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const queued = this.queue;
        this.queue = [];
        queued.forEach(raw => {
            try {
                this.ws?.send(raw);
            } catch {
                /* noop */
            }
        });
    }

    // --- field translation -------------------------------------------------

    private translateRequest(request: Record<string, any>): Record<string, any> {
        const req = { ...request };
        delete req.loginid;
        if ('proposal' in req && req.symbol) {
            req.underlying_symbol = req.symbol;
            delete req.symbol;
        }
        if ('balance' in req) delete req.account;
        return req;
    }

    private translateResponse(message: any): any {
        if (!message || typeof message !== 'object') return message;
        const msg = message;

        if (msg.msg_type === 'active_symbols' && Array.isArray(msg.active_symbols)) {
            msg.active_symbols = msg.active_symbols.map((item: any) => {
                const s = { ...item };
                if (s.underlying_symbol && !s.symbol) s.symbol = s.underlying_symbol;
                if (s.pip_size != null && s.pip == null) s.pip = s.pip_size;
                if (s.underlying_symbol_name && !s.display_name) s.display_name = s.underlying_symbol_name;
                if (s.underlying_symbol_type && !s.symbol_type) s.symbol_type = s.underlying_symbol_type;
                if (!s.market_display_name) s.market_display_name = humanize(s.market);
                if (!s.submarket_display_name) s.submarket_display_name = humanize(s.submarket);
                return s;
            });
        }

        if (msg.msg_type === 'proposal' && msg.proposal) {
            coerce(msg.proposal, ['ask_price', 'payout', 'spot', 'display_value', 'commission']);
        }

        if (msg.msg_type === 'buy' && msg.buy) {
            coerce(msg.buy, ['buy_price', 'balance_after', 'payout', 'transaction_id', 'contract_id']);
        }

        if (msg.msg_type === 'proposal_open_contract' && msg.proposal_open_contract) {
            const poc = msg.proposal_open_contract;
            coerce(poc, ['bid_price', 'buy_price', 'current_spot', 'profit', 'payout', 'sell_price', 'entry_tick']);
            if (poc.exit_spot != null && poc.sell_spot == null) {
                poc.sell_spot = Number(poc.exit_spot);
                poc.sell_spot_time = poc.exit_spot_time;
            }
        }

        if (msg.msg_type === 'balance' && msg.balance) {
            coerce(msg.balance, ['balance']);
        }

        return msg;
    }

    private commandKey(request: Record<string, any>): string {
        return Object.keys(request).find(k => !META_KEYS.has(k)) ?? '';
    }

    private expectedMsgType(request: Record<string, any>): string {
        const cmd = this.commandKey(request);
        if (cmd === 'ticks_history') {
            return request.style === 'candles' ? 'candles' : 'history';
        }
        if (cmd === 'ticks') return 'tick';
        return cmd;
    }

    private handleMessage(raw: string) {
        let message: any;
        try {
            message = JSON.parse(raw);
        } catch {
            return;
        }

        const translated = this.translateResponse(message);

        // Broadcast every message to onMessage subscribers (streams, etc.).
        this.message_subscribers.forEach(cb => {
            try {
                cb({ data: translated });
            } catch {
                /* noop */
            }
        });

        // Correlate to a pending request promise.
        const req_id = translated.req_id;
        let target: TPending | undefined;
        if (req_id != null && this.pending.has(req_id)) {
            target = this.pending.get(req_id);
        } else if (translated.msg_type) {
            for (const p of this.pending.values()) {
                if (!p.settled && p.expect === translated.msg_type) {
                    target = p;
                    break;
                }
            }
        }

        if (!target || target.settled) return;
        target.settled = true;
        this.pending.delete(target.req_id);

        if (translated.error) {
            target.reject(this.buildErrorResponse(translated, target.request));
        } else {
            // Guarantee an echo_req on success too, since some callers read it
            // and the new platform does not always echo the request back.
            if (translated.echo_req == null) translated.echo_req = target.request;
            target.resolve(translated);
        }
    }

    /**
     * Re-shape an error into the legacy DerivAPIBasic rejection contract that the
     * trade engine relies on: `{ error: { code, message, echo_req, ... }, echo_req,
     * msg_type, req_id }`. The trade engine reads `error.error.code`,
     * `error.error.echo_req` and `error.echo_req` (e.g. in Proposal/helpers), so all
     * of these must be present even though the new API may omit `echo_req`.
     */
    private buildErrorResponse(response: Record<string, any>, request: Record<string, any>): Record<string, any> {
        const echo_req = response.echo_req ?? request ?? {};
        const inner = { ...(response.error || {}) };
        if (inner.echo_req == null) inner.echo_req = echo_req;
        return {
            ...response,
            error: inner,
            echo_req,
        };
    }

    // --- public DerivAPIBasic-compatible surface ---------------------------

    send(request: Record<string, any>): Promise<any> {
        const req_id = this.req_id++;
        const translated = this.translateRequest(request);
        translated.req_id = req_id;
        const is_subscribe = translated.subscribe === 1;

        const promise = new Promise((resolve, reject) => {
            this.pending.set(req_id, {
                req_id,
                expect: this.expectedMsgType(translated),
                is_subscribe,
                // Keep the caller's original request so we can synthesize an
                // `echo_req` on the response (the new API may not echo it back).
                request,
                resolve,
                reject,
                settled: false,
            });
        });

        const raw = JSON.stringify(translated);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(raw);
            } catch (e) {
                const p = this.pending.get(req_id);
                if (p && !p.settled) {
                    p.settled = true;
                    this.pending.delete(req_id);
                    p.reject(
                        this.buildErrorResponse(
                            { error: { code: 'CallError', message: (e as Error)?.message || 'Send failed.' } },
                            request
                        )
                    );
                }
            }
        } else {
            this.queue.push(raw);
        }

        return promise;
    }

    onMessage() {
        return {
            subscribe: (callback: TMessageCallback) => {
                this.message_subscribers.add(callback);
                return {
                    unsubscribe: () => this.message_subscribers.delete(callback),
                };
            },
        };
    }

    forget(id: string): Promise<any> {
        return this.send({ forget: id });
    }

    forgetAll(...types: string[]): Promise<any> {
        const value = types.length === 1 ? types[0] : types;
        return this.send({ forget_all: value });
    }

    getSelfExclusion(): Promise<any> {
        return Promise.resolve({});
    }

    // --- DerivAPIBasic convenience methods --------------------------------
    // The legacy `@deriv/deriv-api` auto-generated a method per API call that
    // simply wrapped `send`. App code (CoreStoreProvider, stores, services)
    // calls these directly, so the adapter must keep them. Each maps to the
    // equivalent request object and resolves the full (translated) response.

    time(): Promise<any> {
        return this.send({ time: 1 });
    }

    websiteStatus(): Promise<any> {
        return this.send({ website_status: 1 });
    }

    getSettings(): Promise<any> {
        return this.send({ get_settings: 1 });
    }

    getAccountStatus(): Promise<any> {
        return this.send({ get_account_status: 1 });
    }

    landingCompany(args?: Record<string, any>): Promise<any> {
        return this.send({ landing_company: 1, ...(args || {}) });
    }

    activeSymbols(args?: Record<string, any>): Promise<any> {
        return this.send({ active_symbols: args?.active_symbols ?? 'brief', ...(args || {}) });
    }

    tradingTimes(args?: Record<string, any>): Promise<any> {
        return this.send({ trading_times: args?.trading_times ?? 'today', ...(args || {}) });
    }

    contractsFor(args?: Record<string, any>): Promise<any> {
        return this.send({ contracts_for: 1, ...(args || {}) });
    }

    balanceAll(): Promise<any> {
        return this.send({ balance: 1, account: 'all' });
    }

    /**
     * Legacy `logout()` invalidated the session server-side then closed the
     * socket. On the new platform the OTP socket just needs to be torn down. We
     * fire a best-effort logout frame (not awaited, so it can never hang) and
     * always resolve so the caller's navigation/cleanup proceeds.
     */
    logout(): Promise<any> {
        try {
            this.sendRaw({ logout: 1 });
        } catch {
            /* noop */
        }
        this.disconnect();
        return Promise.resolve({ logout: 1 });
    }

    async authorize(token: string): Promise<{ authorize?: any; error?: any }> {
        this.bearer = token;
        try {
            const accounts = await fetchAccounts(token);
            if (!accounts.length) {
                return { error: { code: 'NoAccount', message: 'No options trading accounts were found.' } };
            }

            const stored = localStorage.getItem('active_loginid');
            const active = accounts.find(a => a.account_id === stored) ?? accounts[0];
            localStorage.setItem('active_loginid', active.account_id);

            this.manually_closed = false;
            await this.connectWithOtpRetry(token, active.account_id);

            return { authorize: this.buildAuthorizeResponse(accounts, active) };
        } catch (error: any) {
            return { error: { code: error?.code || 'AuthError', message: error?.message || 'Authorization failed.' } };
        }
    }

    private buildAuthorizeResponse(accounts: TDerivAccount[], active: TDerivAccount) {
        return {
            account_list: accounts.map(a => ({
                loginid: a.account_id,
                currency: a.currency,
                is_virtual: isVirtualAccount(a) ? 1 : 0,
                is_disabled: a.status && a.status !== 'active' ? 1 : 0,
                landing_company_name: a.group || 'svg',
                account_type: a.account_type || 'trading',
                account_category: 'trading',
                balance: a.balance,
            })),
            balance: active.balance,
            currency: active.currency,
            loginid: active.account_id,
            is_virtual: isVirtualAccount(active) ? 1 : 0,
            landing_company_name: active.group || 'svg',
            country: '',
            fullname: active.name || '',
            email: '',
            scopes: ['read', 'trade', 'trading_information', 'payments', 'admin'],
        };
    }

    disconnect() {
        this.manually_closed = true;
        this.stopKeepAlive();
        this.pending.forEach(p => {
            if (!p.settled) {
                p.settled = true;
                p.reject(
                    this.buildErrorResponse(
                        { error: { code: 'DisconnectError', message: 'Connection closed.' } },
                        p.request
                    )
                );
            }
        });
        this.pending.clear();
        try {
            this.ws?.close();
        } catch {
            /* noop */
        }
        this.ws = null;
    }
}

export default DerivWsAdapter;
