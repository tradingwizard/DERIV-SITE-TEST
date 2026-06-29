import { useEffect, useState } from 'react';
import { debugAuth, persistAuthDebugFlag } from '@/utils/auth-debug';
import { clearAuthData } from '@/utils/auth-utils';
import { completePkceLogin, markPkceLoginFailed } from '@/utils/pkce-account';
import { getOAuthCallbackRedirectUri, getStoredState } from '@/utils/pkce';
import { Button } from '@deriv-com/ui';

const CallbackPage = () => {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const run = async () => {
            persistAuthDebugFlag();
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const state = params.get('state');
            const oauth_error = params.get('error');

            debugAuth('callback-page.detected', {
                has_code: Boolean(code),
                has_state: Boolean(state),
                has_error: Boolean(oauth_error),
            });

            if (oauth_error) {
                debugAuth('callback-page.oauth-error', { error: oauth_error });
                setError(params.get('error_description') || oauth_error);
                return;
            }

            if (!code) {
                debugAuth('callback-page.missing-code');
                setError('Missing authorization code.');
                return;
            }

            // Strict CSRF check: a stored state must exist and exactly match the
            // returned state. Anything else (missing/mismatched) is rejected.
            const expected_state = getStoredState();
            if (!expected_state || !state || expected_state !== state) {
                debugAuth('callback-page.state-mismatch', {
                    has_expected_state: Boolean(expected_state),
                    has_returned_state: Boolean(state),
                });
                clearAuthData(false, 'CallbackPage.stateMismatch');
                setError('Login verification failed. Please try again.');
                return;
            }

            try {
                const selected_currency = await completePkceLogin({
                    code,
                    redirectUri: getOAuthCallbackRedirectUri(),
                    requestedAccount: params.get('account'),
                });
                debugAuth('callback-page.completed', { selected_currency });
                // Land back inside the bot app (the trading route is /dashboard),
                // not the marketing home page at /.
                window.location.replace(`${window.location.origin}/dashboard?account=${selected_currency}`);
            } catch (err: any) {
                debugAuth('callback-page.failed', { message: err?.message || String(err) });
                clearAuthData(false, 'CallbackPage.failed');
                markPkceLoginFailed();
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
