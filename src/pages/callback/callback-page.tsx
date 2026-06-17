import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { fetchAccounts, isVirtualAccount } from '@/external/bot-skeleton/services/api/deriv-rest';
import { clearAuthData } from '@/utils/auth-utils';
import { exchangeCodeForToken, getStoredState } from '@/utils/pkce';
import { Button } from '@deriv-com/ui';

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

const CallbackPage = () => {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const run = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const state = params.get('state');
            const oauth_error = params.get('error');

            if (oauth_error) {
                setError(params.get('error_description') || oauth_error);
                return;
            }

            if (!code) {
                setError('Missing authorization code.');
                return;
            }

            // Strict CSRF check: a stored state must exist and exactly match the
            // returned state. Anything else (missing/mismatched) is rejected.
            const expected_state = getStoredState();
            if (!expected_state || !state || expected_state !== state) {
                clearAuthData(false);
                setError('Login verification failed. Please try again.');
                return;
            }

            try {
                const access_token = await exchangeCodeForToken(code);
                const accounts = await fetchAccounts(access_token);

                if (!accounts.length) {
                    throw new Error('No trading accounts were found for this login.');
                }

                const accountsList: Record<string, string> = {};
                const clientAccounts: Record<string, { loginid: string; token: string; currency: string }> = {};
                accounts.forEach(account => {
                    accountsList[account.account_id] = access_token;
                    clientAccounts[account.account_id] = {
                        loginid: account.account_id,
                        token: access_token,
                        currency: account.currency,
                    };
                });

                localStorage.setItem('accountsList', JSON.stringify(accountsList));
                localStorage.setItem('clientAccounts', JSON.stringify(clientAccounts));

                // Choose the active account based on the requested currency (if any).
                const requested = params.get('account') || sessionStorage.getItem('query_param_currency') || '';
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
                setLoggedStateCookie('true');

                const selected_currency = isVirtualAccount(active) ? 'demo' : active.currency || 'USD';
                // Land back inside the bot app (the trading route is /dashboard),
                // not the marketing home page at /.
                window.location.replace(`${window.location.origin}/dashboard?account=${selected_currency}`);
            } catch (err: any) {
                clearAuthData(false);
                setLoggedStateCookie('false');
                setError(err?.message || 'Something went wrong while signing you in.');
            }
        };

        run();
    }, []);

    return (
        <div className='callback-page' style={{ padding: '2rem', textAlign: 'center' }}>
            {error ? (
                <>
                    <p>{error}</p>
                    <Button
                        className='callback-return-button'
                        onClick={() => {
                            window.location.href = '/';
                        }}
                    >
                        {'Return to Bot'}
                    </Button>
                </>
            ) : (
                <p>{'Signing you in...'}</p>
            )}
        </div>
    );
};

export default CallbackPage;
