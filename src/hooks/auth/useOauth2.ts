import { useState } from 'react';
import { useEffect } from 'react';
import Cookies from 'js-cookie';
import RootStore from '@/stores/root-store';
import { debugAuth } from '@/utils/auth-debug';
import { getAuthSessionState } from '@/utils/auth-session';
import { clearAuthData } from '@/utils/auth-utils';
import { redirectToLogin } from '@/utils/pkce';
import { Analytics } from '@deriv-com/analytics';

/**
 * Provides an object with properties: `oAuthLogout`, `retriggerOAuth2Login`, and `isSingleLoggingIn`.
 *
 * `oAuthLogout` logs the user out (clears local auth data and redirects home).
 *
 * `retriggerOAuth2Login` retriggers the PKCE OAuth login flow to get a new token.
 *
 * `isSingleLoggingIn` indicates whether the user is currently logging in.
 *
 * @param {{ handleLogout?: () => Promise<void> }} [options] - An object with an optional `handleLogout` property.
 */
export const useOauth2 = ({
    handleLogout,
    client,
}: {
    handleLogout?: () => Promise<void>;
    client?: RootStore['client'];
} = {}) => {
    const [isSingleLoggingIn, setIsSingleLoggingIn] = useState(false);
    const { hasLegacySession, hasPkceSession, hasValidSession } = getAuthSessionState();
    const isSilentLoginExcluded =
        window.location.pathname.includes('callback') || window.location.pathname.includes('endpoint');

    const loggedState = Cookies.get('logged_state');

    useEffect(() => {
        window.addEventListener('unhandledrejection', event => {
            if (event?.reason?.error?.code === 'InvalidToken') {
                setIsSingleLoggingIn(false);
            }
        });
    }, []);

    useEffect(() => {
        const willEventuallySSO = loggedState === 'true' && !hasValidSession;
        const willEventuallySLO = loggedState === 'false' && hasValidSession;

        debugAuth('oauth2.login-state-check', {
            logged_state: loggedState || null,
            has_legacy_session: hasLegacySession,
            has_pkce_session: hasPkceSession,
            has_valid_session: hasValidSession,
            will_eventually_sso: willEventuallySSO,
            will_eventually_slo: willEventuallySLO,
            is_silent_login_excluded: isSilentLoginExcluded,
        });

        if (!isSilentLoginExcluded && (willEventuallySSO || willEventuallySLO)) {
            setIsSingleLoggingIn(true);
        } else {
            setIsSingleLoggingIn(false);
        }
    }, [hasValidSession, hasLegacySession, hasPkceSession, loggedState, isSilentLoginExcluded]);

    const logoutHandler = async () => {
        debugAuth('oauth2.logout-attempted', {
            source: 'useOauth2.logoutHandler',
            client_is_logged_in: client?.is_logged_in ?? null,
        });
        client?.setIsLoggingOut(true);
        try {
            await client?.logout?.().catch(err => {
                // eslint-disable-next-line no-console
                console.error('Error during logout:', err);
            });
            if (handleLogout) {
                await handleLogout().catch(() => undefined);
            }
            Analytics.reset();
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        } finally {
            // Mark the session as logged-out BEFORE clearing storage, otherwise
            // a lingering `logged_state=true` cookie can trigger an immediate
            // silent re-login loop once local storage is empty.
            try {
                Cookies.set('logged_state', 'false', {
                    domain: window.location.hostname.split('.').slice(-2).join('.'),
                    expires: 30,
                    path: '/',
                    secure: true,
                });
                Cookies.remove('logged_state', { path: '/' });
            } catch {
                /* noop */
            }
            // Clear all stored auth data (reloads the page to the logged-out view).
            clearAuthData(true, 'useOauth2.logoutHandler');
        }
    };

    const retriggerOAuth2Login = async () => {
        try {
            debugAuth('oauth2.redirect-to-login', { source: 'useOauth2.retriggerOAuth2Login' });
            await redirectToLogin();
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    };

    return { oAuthLogout: logoutHandler, retriggerOAuth2Login, isSingleLoggingIn, isOAuth2Enabled: true };
};
