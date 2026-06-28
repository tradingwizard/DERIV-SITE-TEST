import Cookies from 'js-cookie';
import CommonStore from '@/stores/common-store';
import { TAuthData } from '@/types/api-types';
import { clearAuthData } from '@/utils/auth-utils';
import { observer as globalObserver } from '../../utils/observer';
import { doUntilDone, socket_state } from '../tradeEngine/utils/helpers';
import {
    CONNECTION_STATUS,
    setAccountList,
    setAuthData,
    setConnectionStatus,
    setIsAuthorized,
    setIsAuthorizing,
} from './observables/connection-status-stream';
import ApiHelpers from './api-helpers';
import { generateDerivApiInstance, V2GetActiveClientId, V2GetActiveToken } from './appId';
import chart_api from './chart-api';

type CurrentSubscription = {
    id: string;
    unsubscribe: () => void;
};

type SubscriptionPromise = Promise<{
    subscription: CurrentSubscription;
}>;

type TApiBaseApi = {
    connection: {
        readyState: keyof typeof socket_state;
        addEventListener: (event: string, callback: () => void) => void;
        removeEventListener: (event: string, callback: () => void) => void;
    };
    send: (data: unknown) => Promise<any>;
    disconnect: () => void;
    authorize: (token: string) => Promise<{ authorize: TAuthData; error: any }>;
    getSelfExclusion: () => Promise<unknown>;
    time: () => Promise<any>;
    websiteStatus: () => Promise<any>;
    getSettings: () => Promise<any>;
    getAccountStatus: () => Promise<any>;
    landingCompany: (request: unknown) => Promise<any>;
    onMessage: () => {
        subscribe: (callback: (message: any) => void) => {
            unsubscribe: () => void;
        };
    };
};

class APIBase {
    api: TApiBaseApi | null = null;
    token: string = '';
    account_id: string = '';
    pip_sizes = {};
    account_info = {};
    is_running = false;
    subscriptions: CurrentSubscription[] = [];
    time_interval: ReturnType<typeof setInterval> | null = null;
    has_active_symbols = false;
    is_stopping = false;
    active_symbols = [];
    current_auth_subscriptions: SubscriptionPromise[] = [];
    is_authorized = false;
    active_symbols_promise: Promise<unknown[]> | null = null;
    common_store: CommonStore | undefined;
    landing_company: string | null = null;
    is_initializing = false;
    init_promise: Promise<void> | null = null;
    onsocketopenBound: (() => void) | null = null;
    onsocketcloseBound: (() => void) | null = null;

    constructor() {
        this.onsocketopenBound = this.onsocketopen.bind(this);
        this.onsocketcloseBound = this.onsocketclose.bind(this);
    }

    unsubscribeAllSubscriptions = () => {
        this.current_auth_subscriptions?.forEach(subscription_promise => {
            subscription_promise
                .then(({ subscription }) => {
                    if (subscription?.id) {
                        this.api
                            ?.send({
                                forget: subscription.id,
                            })
                            .catch(() => undefined);
                    }
                })
                .catch(() => undefined);
        });
        this.current_auth_subscriptions = [];
    };

    onsocketopen() {
        setConnectionStatus(CONNECTION_STATUS.OPENED);
    }

    onsocketclose() {
        setConnectionStatus(CONNECTION_STATUS.CLOSED);
        this.reconnectIfNotConnected();
    }

    async init(force_create_connection = false) {
        if (this.is_initializing && this.init_promise) return this.init_promise;

        this.is_initializing = true;
        this.init_promise = (async () => {
            this.toggleRunButton(true);

            if (this.api) {
                this.unsubscribeAllSubscriptions();
            }

            if (!this.api || this.api?.connection.readyState !== 1 || force_create_connection) {
                if (this.api?.connection) {
                    ApiHelpers.disposeInstance();
                    setConnectionStatus(CONNECTION_STATUS.CLOSED);
                    if (this.onsocketopenBound) {
                        this.api.connection.removeEventListener('open', this.onsocketopenBound);
                    }
                    if (this.onsocketcloseBound) {
                        this.api.connection.removeEventListener('close', this.onsocketcloseBound);
                    }
                    this.api.disconnect();
                }

                this.api = await generateDerivApiInstance(force_create_connection);
                if (this.onsocketopenBound) this.api?.connection.addEventListener('open', this.onsocketopenBound);
                if (this.onsocketcloseBound) this.api?.connection.addEventListener('close', this.onsocketcloseBound);

                if (this.api?.connection?.readyState === 1) {
                    this.onsocketopen();
                }
            }

            if (!this.has_active_symbols && !V2GetActiveToken()) {
                this.active_symbols_promise = this.getActiveSymbols();
            }

            this.initEventListeners();

            if (this.time_interval) clearInterval(this.time_interval);
            this.time_interval = null;

            if (V2GetActiveToken()) {
                setIsAuthorizing(true);
                await this.authorizeAndSubscribe();
            }

            chart_api.init(force_create_connection);
        })();

        try {
            return await this.init_promise;
        } finally {
            this.is_initializing = false;
            this.init_promise = null;
        }
    }

    getConnectionStatus() {
        if (this.api?.connection) {
            const ready_state = this.api.connection.readyState;
            return socket_state[ready_state as keyof typeof socket_state] || 'Unknown';
        }
        return 'Socket not initialized';
    }

    terminate() {
        // eslint-disable-next-line no-console
        if (this.api) this.api.disconnect();
    }

    initEventListeners() {
        if (window) {
            window.addEventListener('online', this.reconnectIfNotConnected);
            window.addEventListener('focus', this.reconnectIfNotConnected);
        }
    }

    async createNewInstance(account_id: string) {
        if (this.account_id !== account_id) {
            await this.init();
        }
    }

    reconnectIfNotConnected = () => {
        if (this.is_initializing) return;
        if (this.api?.connection?.readyState && this.api?.connection?.readyState > 1) {
            // eslint-disable-next-line no-console
            console.log('Info: Connection to the server was closed, trying to reconnect.');
            this.init(true);
        }
    };

    async authorizeAndSubscribe() {
        const token = V2GetActiveToken();
        if (!token || !this.api) return;
        const next_account_id = V2GetActiveClientId() ?? '';
        if (this.is_authorized && this.token === token && this.account_id === next_account_id) return;
        this.token = token;
        this.account_id = next_account_id;
        setIsAuthorizing(true);
        setIsAuthorized(false);

        try {
            const { authorize, error } = await this.api.authorize(this.token);
            if (error) {
                if (error.code === 'InvalidToken') {
                    const is_tmb_enabled = window.is_tmb_enabled === true;
                    if (Cookies.get('logged_state') === 'true' && !is_tmb_enabled) {
                        globalObserver.emit('InvalidToken', { error });
                    } else {
                        clearAuthData();
                    }
                } else {
                    console.error('Authorization error:', error);
                }
                setIsAuthorizing(false);
                return error;
            }

            this.account_info = authorize;
            setAccountList(authorize?.account_list || []);
            setAuthData(authorize);
            setIsAuthorized(true);
            this.is_authorized = true;
            localStorage.setItem('client_account_details', JSON.stringify(authorize?.account_list));
            localStorage.setItem('client.country', authorize?.country);

            if (this.has_active_symbols) {
                this.toggleRunButton(false);
            } else {
                this.active_symbols_promise = this.getActiveSymbols();
            }
            this.subscribe().catch(() => undefined);
            // this.getSelfExclusion(); commented this so we dont call it from two places
        } catch (e) {
            console.error('Authorization failed:', e);
            this.is_authorized = false;
            const error_code = (e as any)?.code || (e as any)?.error?.code;
            if (error_code === 'InvalidToken') {
                clearAuthData();
            }
            setIsAuthorized(false);
            globalObserver.emit('Error', e);
        } finally {
            setIsAuthorizing(false);
        }
    }

    async getSelfExclusion() {
        if (!this.api || !this.is_authorized) return;
        await this.api.getSelfExclusion();
        // TODO: fix self exclusion
    }

    async subscribe() {
        const subscribeToStream = (streamName: string) => {
            return doUntilDone(
                () => {
                    const subscription = this.api?.send({
                        [streamName]: 1,
                        subscribe: 1,
                    });
                    if (subscription) {
                        this.current_auth_subscriptions.push(subscription);
                    }
                    return subscription;
                },
                [],
                this
            );
        };

        const streamsToSubscribe = ['balance', 'transaction', 'proposal_open_contract'];

        await Promise.allSettled(streamsToSubscribe.map(subscribeToStream));
    }

    getActiveSymbols = async () => {
        return doUntilDone(() => this.api?.send({ active_symbols: 'brief' }), [], this).then(
            ({ active_symbols = [] }) => {
                const pip_sizes = {};
                if (active_symbols.length) this.has_active_symbols = true;
                active_symbols.forEach(
                    ({
                        symbol,
                        underlying_symbol,
                        pip,
                        pip_size,
                    }: {
                        symbol: string;
                        underlying_symbol?: string;
                        pip?: string;
                        pip_size?: string;
                    }) => {
                        const symbol_code = underlying_symbol || symbol;
                        const pip_value = pip ?? pip_size;
                        if (symbol_code && pip_value) {
                            (pip_sizes as Record<string, number>)[symbol_code] = +(+pip_value).toExponential().substring(3);
                        }
                    }
                );
                this.pip_sizes = pip_sizes as Record<string, number>;
                this.toggleRunButton(false);
                this.active_symbols = active_symbols;
                return Array.isArray(active_symbols) ? active_symbols : [];
            }
        );
    };

    toggleRunButton = (toggle: boolean) => {
        const run_button = document.querySelector('#db-animation__run-button');
        if (!run_button) return;
        (run_button as HTMLButtonElement).disabled = toggle;
    };

    setIsRunning(toggle = false) {
        this.is_running = toggle;
    }

    pushSubscription(subscription: CurrentSubscription) {
        this.subscriptions.push(subscription);
    }

    clearSubscriptions() {
        this.subscriptions.forEach(s => s.unsubscribe());
        this.subscriptions = [];

        // Resetting timeout resolvers
        const global_timeouts = globalObserver.getState('global_timeouts') ?? [];

        global_timeouts.forEach((_: unknown, i: number) => {
            clearTimeout(i);
        });
    }
}

export const api_base = new APIBase();
