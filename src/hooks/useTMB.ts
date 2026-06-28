import { useCallback, useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { removeCookies } from '@/components/shared/utils/storage/storage';

declare global {
    interface Window {
        is_tmb_enabled?: boolean;
    }
}

type UseTMBReturn = {
    handleLogout: () => void;
    isOAuth2Enabled: boolean;
    is_tmb_enabled: boolean;
    onRenderTMBCheck: (fromLoginButton?: boolean, setIsAuthenticating?: (value: boolean) => void) => Promise<void>;
    isTmbEnabled: () => Promise<boolean>;
    isInitialized: boolean;
    isTmbCheckComplete: boolean;
};

const isDebugDeriv = () =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug_deriv');

const debugDeriv = (label: string, payload: Record<string, unknown>) => {
    if (!isDebugDeriv()) return;
    // eslint-disable-next-line no-console
    console.info(`[debug_deriv] ${label}`, payload);
};

const useTMB = (): UseTMBReturn => {
    const domains = useMemo(
        () => ['deriv.com', 'deriv.dev', 'binary.sx', 'pages.dev', 'localhost', 'deriv.be', 'deriv.me'],
        []
    );
    const currentDomain = useMemo(() => window.location.hostname.split('.').slice(-2).join('.'), []);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isTmbCheckComplete, setIsTmbCheckComplete] = useState(false);

    const disableTMB = useCallback(() => {
        window.is_tmb_enabled = false;
        debugDeriv('tmb disabled', {
            reason: 'GTS Empire uses PKCE OAuth only',
            hostname: window.location.hostname,
        });
        return false;
    }, []);

    const isTmbEnabled = useCallback(async () => disableTMB(), [disableTMB]);

    useEffect(() => {
        disableTMB();
        setIsInitialized(true);
        setIsTmbCheckComplete(true);
    }, [disableTMB]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('active_loginid');
        localStorage.removeItem('clientAccounts');
        localStorage.removeItem('accountsList');
        removeCookies('affiliate_token', 'affiliate_tracking', 'utm_data', 'onfido_token', 'gclid');

        if (domains.includes(currentDomain)) {
            Cookies.set('logged_state', 'false', {
                domain: currentDomain,
                expires: 30,
                path: '/',
                secure: true,
            });
        }

        window.location.reload();
    }, [currentDomain, domains]);

    const onRenderTMBCheck = useCallback(
        async (_fromLoginButton = false, setIsAuthenticating?: (value: boolean) => void) => {
            disableTMB();
            setIsAuthenticating?.(false);
        },
        [disableTMB]
    );

    return useMemo(
        () => ({
            handleLogout,
            isOAuth2Enabled: true,
            is_tmb_enabled: false,
            onRenderTMBCheck,
            isTmbEnabled,
            isInitialized,
            isTmbCheckComplete,
        }),
        [handleLogout, isInitialized, isTmbCheckComplete, isTmbEnabled, onRenderTMBCheck]
    );
};

export default useTMB;
