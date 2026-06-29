import { useEffect, useState } from 'react';
import { clearAuthData } from '@/utils/auth-utils';
import { completePkceLogin, markPkceLoginFailed } from '@/utils/pkce-account';
import { getOAuthCallbackRedirectUri, getStoredState } from '@/utils/pkce';
import { Button } from '@deriv-com/ui';

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
                const selected_currency = await completePkceLogin({
                    code,
                    redirectUri: getOAuthCallbackRedirectUri(),
                    requestedAccount: params.get('account'),
                });
                // Land back inside the bot app (the trading route is /dashboard),
                // not the marketing home page at /.
                window.location.replace(`${window.location.origin}/dashboard?account=${selected_currency}`);
            } catch (err: any) {
                clearAuthData(false);
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
