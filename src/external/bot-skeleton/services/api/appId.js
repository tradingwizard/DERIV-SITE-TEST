import DerivWsAdapter from './deriv-ws-adapter';

/**
 * Returns a DerivAPIBasic-compatible adapter wired to the new Deriv API
 * platform. The adapter starts on the public WebSocket and swaps to an
 * OTP-authenticated socket once `authorize(access_token)` is called.
 */
export const generateDerivApiInstance = () => {
    return new DerivWsAdapter();
};

export const getLoginId = () => {
    const login_id = localStorage.getItem('active_loginid');
    if (login_id && login_id !== 'null') return login_id;
    return null;
};

export const V2GetActiveToken = () => {
    const token = localStorage.getItem('authToken');
    if (token && token !== 'null') return token;
    return null;
};

export const V2GetActiveClientId = () => {
    // On the new platform there is a single OAuth access token shared across
    // accounts, so the active account is simply the stored active_loginid.
    if (!V2GetActiveToken()) return null;
    return getLoginId();
};

export const getToken = () => {
    return {
        token: V2GetActiveToken() ?? undefined,
        account_id: getLoginId() ?? undefined,
    };
};
