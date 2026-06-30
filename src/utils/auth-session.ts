import Cookies from 'js-cookie';

const safeParse = <T,>(value: string | null, fallback: T): T => {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
};

export const getAuthSessionState = () => {
    const accountsList = safeParse<Record<string, string>>(localStorage.getItem('accountsList'), {});
    const clientAccounts = safeParse<Record<string, unknown>>(localStorage.getItem('clientAccounts'), {});
    const loggedState = Cookies.get('logged_state');
    const hasLegacySession = Object.values(accountsList).some(token => Boolean(token));
    const hasPkceSession =
        loggedState === 'true' &&
        Boolean(localStorage.getItem('authToken')) &&
        Boolean(localStorage.getItem('active_loginid')) &&
        Object.keys(clientAccounts).length > 0;

    return {
        accountsList,
        clientAccounts,
        hasLegacySession,
        hasPkceSession,
        hasValidSession: hasLegacySession || hasPkceSession,
        loggedState,
    };
};
