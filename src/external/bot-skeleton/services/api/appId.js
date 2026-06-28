import { getSocketURL } from '@/components/shared';
import DerivAPIBasic from '@deriv/deriv-api/dist/DerivAPIBasic';
import APIMiddleware from './api-middleware';

let derivApiInstance = null;
let derivApiPromise = null;
let currentWebSocketBaseURL = null;

const buildForgetResponse = request => {
    const msg_type = request?.forget_all != null ? 'forget_all' : 'forget';
    return {
        [msg_type]: request?.[msg_type],
        echo_req: request,
        msg_type,
    };
};

const installCleanupCompatibility = api => {
    if (!api || api.__gts_cleanup_compat_installed) return api;

    const originalSend = api.send?.bind(api);
    const originalForget = api.forget?.bind(api);

    api.send = request => {
        if (request?.forget_all != null) {
            return Promise.resolve(buildForgetResponse(request));
        }

        if (!originalSend) {
            return Promise.reject(new Error('API send is not available.'));
        }

        return originalSend(request).catch(error => {
            if (request?.forget != null || request?.forget_all != null) {
                return buildForgetResponse(request);
            }
            throw error;
        });
    };

    api.forget = id => {
        const request = { forget: id };
        if (!id) return Promise.resolve(buildForgetResponse(request));

        if (originalForget) {
            return originalForget(id).catch(() => buildForgetResponse(request));
        }

        return api.send(request).catch(() => buildForgetResponse(request));
    };

    api.forgetAll = (...types) => {
        const value = types.length === 1 ? types[0] : types;
        return Promise.resolve(buildForgetResponse({ forget_all: value }));
    };

    api.__gts_cleanup_compat_installed = true;
    return api;
};

export const clearDerivApiInstance = () => {
    if (derivApiInstance?.connection) {
        try {
            derivApiInstance.connection.close();
        } catch {
            /* noop */
        }
    }
    derivApiInstance = null;
    derivApiPromise = null;
    currentWebSocketBaseURL = null;
};

export const generateDerivApiInstance = async (forceNew = false) => {
    if (forceNew) clearDerivApiInstance();

    const state = derivApiInstance?.connection?.readyState;
    if (state === WebSocket.OPEN) return derivApiInstance;
    if (state === WebSocket.CONNECTING && derivApiPromise) return derivApiPromise;
    if (state === WebSocket.CLOSING || state === WebSocket.CLOSED) clearDerivApiInstance();
    if (derivApiPromise) return derivApiPromise;

    derivApiPromise = (async () => {
        const wsURL = await getSocketURL();
        const nextBaseURL = `${wsURL}`.split('?')[0];

        if (currentWebSocketBaseURL && currentWebSocketBaseURL !== nextBaseURL) {
            clearDerivApiInstance();
            return generateDerivApiInstance(true);
        }

        currentWebSocketBaseURL = nextBaseURL;
        const socket = new WebSocket(wsURL);
        const api = new DerivAPIBasic({
            connection: socket,
            middleware: new APIMiddleware({}),
        });

        derivApiInstance = installCleanupCompatibility(api);

        return new Promise((resolve, reject) => {
            const cleanup = () => {
                clearTimeout(timeout);
                socket.removeEventListener('open', handleOpen);
                socket.removeEventListener('error', handleError);
            };
            const handleOpen = () => {
                cleanup();
                resolve(api);
            };
            const handleError = event => {
                cleanup();
                clearDerivApiInstance();
                reject(event);
            };
            const timeout = setTimeout(() => {
                cleanup();
                clearDerivApiInstance();
                reject(new Error('Deriv WebSocket connection timeout'));
            }, 15000);

            socket.addEventListener('open', handleOpen);
            socket.addEventListener('error', handleError);
        });
    })().finally(() => {
        derivApiPromise = null;
    });

    return derivApiPromise;
};

export const getLoginId = () => {
    const login_id = localStorage.getItem('active_loginid');
    if (login_id && login_id !== 'null') return login_id;
    return null;
};

const safeParse = (value, fallback = {}) => {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
};

export const getOAuthAccessToken = () => {
    const token = localStorage.getItem('authToken');
    if (token && token !== 'null') return token;
    return null;
};

const isLegacyAuthorizeToken = token => {
    if (!token || typeof token !== 'string') return false;

    const oauth_token = getOAuthAccessToken();
    if (oauth_token && token === oauth_token) return false;

    // OAuth/Ory/JWT-style access tokens must never be passed to legacy authorize.
    return !token.includes('.');
};

export const getLegacyAuthorizeToken = () => {
    const active_loginid = getLoginId();
    if (!active_loginid) return null;

    const accounts_list = safeParse(localStorage.getItem('accountsList'));
    const token = accounts_list?.[active_loginid];

    return isLegacyAuthorizeToken(token) ? token : null;
};

export const V2GetActiveToken = () => getLegacyAuthorizeToken();

export const V2GetActiveClientId = () => {
    return getLoginId();
};

export const getToken = () => {
    return {
        token: getLegacyAuthorizeToken() ?? undefined,
        account_id: getLoginId() ?? undefined,
    };
};
