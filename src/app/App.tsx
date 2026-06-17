import { initSurvicate } from '../public-path';
import { lazy, Suspense } from 'react';
import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import ChunkLoader from '@/components/loader/chunk-loader';
import RoutePromptDialog from '@/components/route-prompt-dialog';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { StoreProvider } from '@/hooks/useStore';
import CallbackPage from '@/pages/callback';
import Endpoint from '@/pages/endpoint';
import { initializeI18n, localize, TranslationProvider } from '@deriv-com/translations';
import CoreStoreProvider from './CoreStoreProvider';
import './app-root.scss';

const Layout = lazy(() => import('../components/layout'));
const AppRoot = lazy(() => import('./app-root'));
const FreeBots = lazy(() => import('../pages/free-bots'));
const AnalysisTool = lazy(() => import('../pages/analysis-tool'));
const PremiumTools = lazy(() => import('../pages/premium-tools'));
const Home = lazy(() => import('../pages/home'));

const { TRANSLATIONS_CDN_URL, R2_PROJECT_NAME, CROWDIN_BRANCH_NAME } = process.env;
const i18nInstance = initializeI18n({
    cdnUrl: `${TRANSLATIONS_CDN_URL}/${R2_PROJECT_NAME}/${CROWDIN_BRANCH_NAME}`,
});

// Simple Suspense wrapper without timeout that causes dark landing page
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => {
    const { isOnline } = useOfflineDetection();

    const getLoadingMessage = () => {
        if (!isOnline) return localize('Loading offline dashboard...');
        return localize('Please wait while we connect to the server...');
    };

    return <Suspense fallback={<ChunkLoader message={getLoadingMessage()} />}>{children}</Suspense>;
};

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
        <Route
            element={
                <SuspenseWrapper>
                    <TranslationProvider defaultLang='EN' i18nInstance={i18nInstance}>
                        <StoreProvider>
                            <RoutePromptDialog />
                            <CoreStoreProvider>
                                <Layout />
                            </CoreStoreProvider>
                        </StoreProvider>
                    </TranslationProvider>
                </SuspenseWrapper>
            }
        >
            {/* App routes wrapped in the trading Layout */}
            <Route path='dashboard' element={<AppRoot />} />
            <Route path='endpoint' element={<Endpoint />} />
            <Route path='callback' element={<CallbackPage />} />
            <Route path='free-bots' element={<FreeBots />} />
            <Route path='analysis-tool' element={<AnalysisTool />} />
            <Route path='premium-tools' element={<PremiumTools />} />
        </Route>
        <Route
            key='home'
            path='/'
            element={
                <SuspenseWrapper>
                    <Home />
                </SuspenseWrapper>
            }
        />
        </>
    )
);

function App() {
    React.useEffect(() => {
        // Use the invalid token handler hook to automatically retrigger OIDC authentication
        // when an invalid token is detected and the cookie logged state is true

        initSurvicate();
        window?.dataLayer?.push({ event: 'page_load' });
        return () => {
            // Clean up the invalid token handler when the component unmounts
            const survicate_box = document.getElementById('survicate-box');
            if (survicate_box) {
                survicate_box.style.display = 'none';
            }
        };
    }, []);

    React.useEffect(() => {
        const client_accounts = localStorage.getItem('clientAccounts');
        const url_params = new URLSearchParams(window.location.search);
        const account_currency = url_params.get('account');

        if (!client_accounts) return;

        // The new Deriv platform uses account_type ("demo"/"real") and IDs like
        // "DOT90004580" — not legacy VR/CR/VRTC loginid prefixes.
        const isVirtual = (account_type?: string, loginid?: string) =>
            /demo|virtual|vrt/i.test(`${account_type ?? ''} ${loginid ?? ''}`);

        try {
            const parsed_client_accounts = JSON.parse(client_accounts) as Record<
                string,
                { loginid: string; token: string; currency: string; account_type?: string }
            >;

            const updateLocalStorage = (token: string, loginid: string) => {
                localStorage.setItem('authToken', token);
                localStorage.setItem('active_loginid', loginid);
            };

            const entries = Object.entries(parsed_client_accounts);

            // Handle demo account
            if (account_currency?.toUpperCase() === 'DEMO') {
                const demo = entries.find(([loginid, account]) => isVirtual(account.account_type, loginid));
                if (demo) {
                    const [loginid, account] = demo;
                    updateLocalStorage(String(account.token), loginid);
                }
                return;
            }

            // Handle real account, preferring a currency match when requested.
            const real =
                entries.find(
                    ([loginid, account]) =>
                        !isVirtual(account.account_type, loginid) &&
                        (!account_currency ||
                            account.currency?.toUpperCase() === account_currency?.toUpperCase())
                ) ?? entries.find(([loginid, account]) => !isVirtual(account.account_type, loginid));

            if (real) {
                const [loginid, account] = real;
                updateLocalStorage(String(account.token), loginid);
            }
        } catch (e) {
            console.warn('Error', e); // eslint-disable-line no-console
        }
    }, []);

    return <RouterProvider router={router} />;
}

export default App;
