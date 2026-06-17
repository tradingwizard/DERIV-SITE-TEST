import { useState } from 'react';
import { useEffect } from 'react';
import Cookies from 'js-cookie';
import RootStore from '@/stores/root-store';
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
    const accountsList = JSON.parse(localStorage.getItem('accountsList') ?? '{}');
    const isClientAccountsPopulated = Object.keys(accountsList).length > 0;
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
        const willEventuallySSO = loggedState === 'true' && !isClientAccountsPopulated;
        const willEventuallySLO = loggedState === 'false' && isClientAccountsPopulated;

        if (!isSilentLoginExcluded && (willEventuallySSO || willEventuallySLO)) {
            setIsSingleLoggingIn(true);
        } else {
            setIsSingleLoggingIn(false);
        }
    }, [isClientAccountsPopulated, loggedState, isSilentLoginExcluded]);

    const logoutHandler = async () => {
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
            // Clear all stored auth data (reloads the page to the logged-out view).
            clearAuthData();
        }
    };

    const retriggerOAuth2Login = async () => {
        try {
            await redirectToLogin();
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    };

    return { oAuthLogout: logoutHandler, retriggerOAuth2Login, isSingleLoggingIn, isOAuth2Enabled: true };
};
