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
import { DERIV_WS_BASE } from '@/components/shared/utils/config/config';
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
    timeout: ReturnType<typeof setTimeout>;
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

const REMOVED_REQUEST_KEYS = new Set([
    'loginid',
    'account',
    'product_type',
    'barrier_range',
    'date_start',
    'trade_risk_profile',
    'trading_period_start',
    'landing_company',
    'landing_company_short',
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

const SUBMARKET_DISPLAY: Record<string, string> = {
    random_index: 'Continuous Indices',
    crash_index: 'Crash/Boom Indices',
    jump_index: 'Jump Indices',
    random_daily: 'Daily Reset Indices',
    step_index: 'Step Indices',
    range_break: 'Range Break Indices',
    forex_basket: 'Forex Basket',
    commodity_basket: 'Commodities Basket',
    commodities_basket: 'Commodities Basket',
    basket_commodities: 'Commodities Basket',
    basket_forex: 'Forex Basket',
};

const SUBMARKET_ALIASES: Record<string, string> = {
    random_index: 'random_index',
    random: 'random_index',
    continuous_index: 'random_index',
    continuous_indices: 'random_index',
    volatility: 'random_index',
    volatility_index: 'random_index',
    volatility_indices: 'random_index',
    crash_index: 'crash_index',
    crash_indices: 'crash_index',
    crashboom: 'crash_index',
    crash_boom: 'crash_index',
    crash_boom_index: 'crash_index',
    crash_boom_indices: 'crash_index',
    boom_crash: 'crash_index',
    boom_crash_index: 'crash_index',
    boom_crash_indices: 'crash_index',
    random_daily: 'random_daily',
    daily_reset_index: 'random_daily',
    daily_reset_indices: 'random_daily',
    jump_index: 'jump_index',
    jump_indices: 'jump_index',
    step_index: 'step_index',
    step_indices: 'step_index',
    commodity_basket: 'commodity_basket',
    commodities_basket: 'commodity_basket',
    basket_commodities: 'commodity_basket',
};

const normalizeLookupKey = (value?: string): string =>
    `${value || ''}`
        .trim()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

const humanize = (key?: string): string => {
    if (!key) return '';
    if (MARKET_DISPLAY[key]) return MARKET_DISPLAY[key];
    if (SUBMARKET_DISPLAY[key]) return SUBMARKET_DISPLAY[key];
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

const DIGIT_CONTRACT_CATEGORIES = new Set(['matchesdiffers', 'evenodd', 'overunder']);
const DIGIT_CONTRACT_TYPES = new Set(['DIGITMATCH', 'DIGITDIFF', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER']);

const isDebugDeriv = () =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug_deriv');

const debugDeriv = (label: string, payload: any) => {
    if (!isDebugDeriv()) return;
    // eslint-disable-next-line no-console
    console.info(`[debug_deriv] ${label}`, payload);
};

const normalizeMarket = (market?: string): string | undefined => {
    if (market === 'derived') return 'synthetic_index';
    return market;
};

const normalizeSubmarket = (submarket?: string): string | undefined => {
    if (!submarket) return submarket;
    return SUBMARKET_ALIASES[normalizeLookupKey(submarket)] ?? submarket;
};

const normalizeDuration = (duration: any): string | undefined => {
    if (duration == null) return undefined;
    if (typeof duration === 'number') return `${duration}s`;
    if (typeof duration === 'string') return duration;
    if (typeof duration === 'object') {
        const value = duration.value ?? duration.min ?? duration.max ?? duration.duration;
        const unit = duration.unit ?? duration.duration_unit ?? 's';
        if (value != null) return `${value}${unit}`;
    }
    return undefined;
};

const inferContractCategory = (contract: Record<string, any>): string | undefined => {
    const type = contract.contract_type;
    if (['DIGITMATCH', 'DIGITDIFF'].includes(type)) return 'matchesdiffers';
    if (['DIGITEVEN', 'DIGITODD'].includes(type)) return 'evenodd';
    if (['DIGITOVER', 'DIGITUNDER'].includes(type)) return 'overunder';
    if (type === 'ACCU') return 'accumulator';
    if (['CALL', 'PUT'].includes(type)) return 'callput';
    if (['CALLE', 'PUTE'].includes(type)) return 'callputequal';
    if (['ONETOUCH', 'NOTOUCH'].includes(type)) return 'touchnotouch';
    if (['EXPIRYRANGE', 'EXPIRYMISS'].includes(type)) return 'endsinout';
    if (['RANGE', 'UPORDOWN'].includes(type)) return 'staysinout';
    if (['ASIANU', 'ASIAND'].includes(type)) return 'asians';
    if (['RESETCALL', 'RESETPUT'].includes(type)) return 'reset';
    if (['TICKHIGH', 'TICKLOW'].includes(type)) return 'highlowticks';
    if (['RUNHIGH', 'RUNLOW'].includes(type)) return 'runs';
    return contract.contract_category;
};

const normalizeContractRow = (
    contract: Record<string, any>,
    symbol_meta?: { market?: string; submarket?: string; symbol?: string }
): Record<string, any> => {
    const c = { ...contract };

    if (c.underlying_symbol && !c.symbol) c.symbol = c.underlying_symbol;
    if (c.underlying_symbol_type && !c.submarket) c.submarket = c.underlying_symbol_type;
    if (!c.symbol && symbol_meta?.symbol) c.symbol = symbol_meta.symbol;
    if (!c.market && symbol_meta?.market) c.market = symbol_meta.market;
    if (!c.submarket && symbol_meta?.submarket) c.submarket = symbol_meta.submarket;
    if (c.market) c.market = normalizeMarket(c.market);
    if (c.submarket) c.submarket = normalizeSubmarket(c.submarket);
    if (c.min_duration && !c.min_contract_duration) c.min_contract_duration = c.min_duration;
    if (c.max_duration && !c.max_contract_duration) c.max_contract_duration = c.max_duration;
    c.min_contract_duration = normalizeDuration(c.min_contract_duration);
    c.max_contract_duration = normalizeDuration(c.max_contract_duration);
    if (!c.expiry_type && c.min_contract_duration) {
        c.expiry_type = `${c.min_contract_duration}`.endsWith('t') ? 'tick' : 'intraday';
    }
    if (DIGIT_CONTRACT_TYPES.has(c.contract_type) && (!c.barrier_category || c.barrier_category === 'digit')) {
        c.barrier_category = 'non_financial';
    }
    if (!c.contract_category || ['digit', 'digits'].includes(c.contract_category)) {
        c.contract_category = inferContractCategory(c);
    }
    if (DIGIT_CONTRACT_CATEGORIES.has(c.contract_category)) {
        c.trade_type_category = 'digits';
    }

    return c;
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
    private active_symbol_meta = new Map<string, { market?: string; submarket?: string; symbol?: string }>();

    constructor() {
        this.connection = new ConnectionFacade(() => this.ws);
        // Connect to the public endpoint so logged-out users get market data.
        this.connectPublic();
    }

    private connectPublic() {
        const url = `${DERIV_WS_BASE}/public`;
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
                debugDeriv('otp websocket attempt', { account_id: accountId, attempt: i + 1 });
                const ws_url = await fetchWebSocketUrl(token, accountId);
                await this.connect(ws_url);
                debugDeriv('otp websocket connected', { account_id: accountId, attempt: i + 1 });
                return;
            } catch (e) {
                last_error = e;
                debugDeriv('otp websocket failed', {
                    account_id: accountId,
                    attempt: i + 1,
                    message: (e as Error)?.message,
                });
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

    private stripLegacyKeys(obj: Record<string, any>) {
        REMOVED_REQUEST_KEYS.forEach(key => {
            delete obj[key];
        });
    }

    private normalizeTradeParameters(obj: Record<string, any>) {
        if (obj.symbol && !obj.underlying_symbol) {
            obj.underlying_symbol = obj.symbol;
        }
        delete obj.symbol;
        this.stripLegacyKeys(obj);
    }

    private translateRequest(request: Record<string, any>): Record<string, any> {
        const req = { ...request };
        this.stripLegacyKeys(req);

        if (req.parameters && typeof req.parameters === 'object') {
            req.parameters = { ...req.parameters };
            this.normalizeTradeParameters(req.parameters);
        }

        if ('proposal' in req) {
            this.normalizeTradeParameters(req);
        }

        if (req.__legacy_contracts_for) {
            delete req.__legacy_contracts_for;
        }
        if (typeof req.contracts_for === 'string') {
            req.underlying_symbol = req.contracts_for;
            req.contracts_for = 1;
        }

        if (req.contracts_for) {
            debugDeriv('contracts_for request', {
                contracts_for: req.contracts_for,
                underlying_symbol: req.underlying_symbol,
            });
        }

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
                if (s.market) s.market = normalizeMarket(s.market);
                if (!s.submarket && s.underlying_symbol_type) s.submarket = s.underlying_symbol_type;
                if (s.submarket) s.submarket = normalizeSubmarket(s.submarket);
                s.market_display_name = MARKET_DISPLAY[s.market] || humanize(s.market);
                s.submarket_display_name = SUBMARKET_DISPLAY[s.submarket] || humanize(s.submarket);
                if (s.symbol) {
                    this.active_symbol_meta.set(s.symbol, {
                        symbol: s.symbol,
                        market: s.market,
                        submarket: s.submarket,
                    });
                }
                return s;
            });
            debugDeriv('active_symbols response', {
                count: msg.active_symbols.length,
                first_synthetics: msg.active_symbols
                    .filter((s: any) => s.market === 'synthetic_index')
                    .slice(0, 8)
                    .map((s: any) => ({
                        symbol: s.symbol,
                        display_name: s.display_name,
                        market: s.market,
                        submarket: s.submarket,
                    })),
            });
        }

        if (msg.msg_type === 'contracts_for' && Array.isArray(msg.contracts_for?.available)) {
            const requested_symbol =
                msg.echo_req?.underlying_symbol ||
                (typeof msg.echo_req?.contracts_for === 'string' ? msg.echo_req.contracts_for : undefined) ||
                msg.contracts_for?.underlying_symbol;
            const requested_symbol_meta = requested_symbol ? this.active_symbol_meta.get(requested_symbol) : undefined;
            msg.contracts_for = {
                ...msg.contracts_for,
                available: msg.contracts_for.available.map((contract: any) =>
                    normalizeContractRow(
                        {
                            symbol: requested_symbol,
                            ...contract,
                        },
                        this.active_symbol_meta.get(contract.symbol || contract.underlying_symbol || requested_symbol) ||
                            requested_symbol_meta
                    )
                ),
            };
            debugDeriv('contracts_for response', {
                count: msg.contracts_for.available.length,
                sample: msg.contracts_for.available.slice(0, 12).map((c: any) => ({
                    contract_type: c.contract_type,
                    contract_category: c.contract_category,
                    barrier_category: c.barrier_category,
                    min_contract_duration: c.min_contract_duration,
                    max_contract_duration: c.max_contract_duration,
                    expiry_type: c.expiry_type,
                    market: c.market,
                    submarket: c.submarket,
                })),
            });
        }

        if (msg.msg_type === 'proposal' && msg.proposal) {
            coerce(msg.proposal, ['ask_price', 'payout', 'spot', 'display_value', 'commission']);
        }

        if (msg.msg_type === 'buy' && msg.buy) {
            coerce(msg.buy, ['buy_price', 'balance_after', 'payout', 'transaction_id', 'contract_id']);
            if (msg.buy.contract_id != null && msg.buy.transaction_id == null) {
                msg.buy.transaction_id = msg.buy.contract_id;
            }
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
        clearTimeout(target.timeout);
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

    private buildForgetResponse(request: Record<string, any>): Record<string, any> {
        const msg_type = request.forget_all != null ? 'forget_all' : 'forget';
        return {
            [msg_type]: request[msg_type],
            echo_req: request,
            msg_type,
        };
    }

    // --- public DerivAPIBasic-compatible surface ---------------------------

    send(request: Record<string, any>): Promise<any> {
        if (request.forget_all != null) {
            return Promise.resolve(this.buildForgetResponse(request));
        }

        const req_id = this.req_id++;
        const translated = this.translateRequest(request);
        translated.req_id = req_id;
        const is_subscribe = translated.subscribe === 1;

        const promise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                const p = this.pending.get(req_id);
                if (!p || p.settled) return;
                p.settled = true;
                this.pending.delete(req_id);
                reject(
                    this.buildErrorResponse(
                        { error: { code: 'Timeout', message: `No response received for ${p.expect}.` } },
                        request
                    )
                );
            }, is_subscribe ? 30000 : 15000);

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
                timeout,
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
                    clearTimeout(p.timeout);
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
        if (!id) {
            return Promise.resolve(this.buildForgetResponse({ forget: id }));
        }

        return this.send({ forget: id }).catch(() => this.buildForgetResponse({ forget: id }));
    }

    forgetAll(...types: string[]): Promise<any> {
        const value = types.length === 1 ? types[0] : types;
        return Promise.resolve(this.buildForgetResponse({ forget_all: value }));
    }

    getSelfExclusion(): Promise<any> {
        // The new platform doesn't expose a self-exclusion endpoint on the
        // per-account socket. Return the expected shape (empty) so callers can
        // read get_self_exclusion safely instead of throwing.
        return Promise.resolve({ get_self_exclusion: {} });
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
        // The new platform's public market-data socket does not implement
        // `website_status` (it replies `UnrecognisedRequest`). We still attempt
        // it so an authenticated socket that supports it keeps working, but we
        // degrade to a benign empty status instead of rejecting — otherwise the
        // unhandled rejection surfaces as a console error for logged-out users.
        return this.send({ website_status: 1 }).catch(() => ({ website_status: {} }));
    }

    getSettings(): Promise<any> {
        return this.send({ get_settings: 1 }).catch(() => ({ get_settings: {} }));
    }

    getAccountStatus(): Promise<any> {
        return this.send({ get_account_status: 1 }).catch(() => ({ get_account_status: { status: [] } }));
    }

    landingCompany(args?: Record<string, any>): Promise<any> {
        const request = { landing_company: 1, ...(args || {}) };
        return this.send(request).catch(() => ({ landing_company: {}, echo_req: request }));
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
        return this.send({ balance: 1, account: 'all' }).catch(() => ({ balance: { accounts: {} } }));
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
            debugDeriv('authorize start', { has_token: Boolean(token) });
            const accounts = await fetchAccounts(token);
            debugDeriv('authorize accounts', {
                count: accounts.length,
                account_ids: accounts.map(a => a.account_id),
            });
            if (!accounts.length) {
                return { error: { code: 'NoAccount', message: 'No options trading accounts were found.' } };
            }

            const stored = localStorage.getItem('active_loginid');
            const active = accounts.find(a => a.account_id === stored) ?? accounts[0];
            localStorage.setItem('active_loginid', active.account_id);

            this.manually_closed = false;
            await this.connectWithOtpRetry(token, active.account_id);

            debugDeriv('authorize complete', {
                active_account_id: active.account_id,
                is_virtual: isVirtualAccount(active),
                currency: active.currency,
            });
            return { authorize: this.buildAuthorizeResponse(accounts, active) };
        } catch (error: any) {
            debugDeriv('authorize failed', { code: error?.code, message: error?.message });
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
                clearTimeout(p.timeout);
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
