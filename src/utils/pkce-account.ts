import Cookies from 'js-cookie';
import { fetchAccounts, isVirtualAccount } from '@/external/bot-skeleton/services/api/deriv-rest';
import { exchangeCodeForToken } from '@/utils/pkce';

type CompletePkceLoginParams = {
    code: string;
    redirectUri: string;
    requestedAccount?: string | null;
};

const setLoggedStateCookie = (value: 'true' | 'false') => {
    try {
        Cookies.set('logged_state', value, {
            domain: window.location.hostname.split('.').slice(-2).join('.'),
            expires: 30,
            path: '/',
            secure: true,
        });
    } catch {
        /* noop */
    }
};

export const completePkceLogin = async ({ code, redirectUri, requestedAccount }: CompletePkceLoginParams) => {
    const access_token = await exchangeCodeForToken(code, redirectUri);
    const accounts = await fetchAccounts(access_token);

    if (!accounts.length) {
        throw new Error('No trading accounts were found for this login.');
    }

    const accountsList: Record<string, string> = {};
    const clientAccounts: Record<string, { loginid: string; token: string; currency: string; account_type: string }> =
        {};

    accounts.forEach(account => {
        clientAccounts[account.account_id] = {
            loginid: account.account_id,
            token: '',
            currency: account.currency,
            account_type: account.account_type,
        };
    });

    localStorage.setItem('accountsList', JSON.stringify(accountsList));
    localStorage.setItem('clientAccounts', JSON.stringify(clientAccounts));
    sessionStorage.setItem('deriv_accounts', JSON.stringify(accounts));

    const requested = requestedAccount || sessionStorage.getItem('query_param_currency') || '';
    let active = accounts[0];

    if (requested === 'demo') {
        active = accounts.find(isVirtualAccount) ?? accounts[0];
    } else if (requested) {
        active =
            accounts.find(a => a.currency?.toUpperCase() === requested.toUpperCase() && !isVirtualAccount(a)) ??
            accounts.find(a => !isVirtualAccount(a)) ??
            accounts[0];
    }

    localStorage.setItem('authToken', access_token);
    localStorage.setItem('active_loginid', active.account_id);
    localStorage.setItem('account_type', active.account_type);
    localStorage.removeItem('is_legacy_account');
    localStorage.setItem('tradq_account_v2', 'true');
    localStorage.setItem('mesoflix_account_v2', 'true');
    setLoggedStateCookie('true');

    return isVirtualAccount(active) ? 'demo' : active.currency || 'USD';
};

export const markPkceLoginFailed = () => {
    setLoggedStateCookie('false');
};
