import Cookies from 'js-cookie';

const DEBUG_KEY = 'debug_auth';
const BUILD_MARKER = process.env.COMMIT_REF || process.env.REF_NAME || 'local-auth-trace-20260629';

const safeParse = <T,>(value: string | null, fallback: T): T => {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
};

export const persistAuthDebugFlag = () => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get(DEBUG_KEY) === '1') {
        sessionStorage.setItem(DEBUG_KEY, '1');
    }
};

export const isAuthDebugEnabled = () => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get(DEBUG_KEY) === '1') return true;
    return sessionStorage.getItem(DEBUG_KEY) === '1';
};

export const getAuthDebugSnapshot = (extra: Record<string, unknown> = {}) => {
    if (typeof window === 'undefined') return extra;

    const client_accounts = safeParse<Record<string, unknown>>(localStorage.getItem('clientAccounts'), {});
    const accounts_list = safeParse<Record<string, unknown>>(localStorage.getItem('accountsList'), {});

    return {
        build_marker: BUILD_MARKER,
        route: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        logged_state_cookie: Cookies.get('logged_state') ?? null,
        auth_token_exists: Boolean(localStorage.getItem('authToken')),
        active_loginid_exists: Boolean(localStorage.getItem('active_loginid')),
        active_loginid: localStorage.getItem('active_loginid') || null,
        account_type: localStorage.getItem('account_type') || null,
        client_accounts_count: Object.keys(client_accounts).length,
        accounts_list_count: Object.keys(accounts_list).length,
        ...extra,
    };
};

export const debugAuth = (event: string, details: Record<string, unknown> = {}) => {
    persistAuthDebugFlag();
    if (!isAuthDebugEnabled()) return;
    // eslint-disable-next-line no-console
    console.info(`[debug_auth] ${event}`, getAuthDebugSnapshot(details));
};
