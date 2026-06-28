import { useCallback, useEffect, useMemo, useRef } from 'react';
import Cookies from 'js-cookie';
import { observer } from 'mobx-react-lite';
import { getDecimalPlaces, toMoment } from '@/components/shared';
import { FORM_ERROR_MESSAGES } from '@/components/shared/constants/form-error-messages';
import { initFormErrorMessages } from '@/components/shared/utils/validation/declarative-validation-rules';
import { api_base } from '@/external/bot-skeleton';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { useOauth2 } from '@/hooks/auth/useOauth2';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import useTMB from '@/hooks/useTMB';
import { TLandingCompany, TSocketResponseData } from '@/types/api-types';
import type { Balance } from '@deriv/api-types';
import { localize, useTranslations } from '@deriv-com/translations';

type TClientInformation = {
    loginid?: string;
    email?: string;
    currency?: string;
    residence?: string | null;
    first_name?: string;
    last_name?: string;
    preferred_language?: string | null;
    user_id?: number | string;
    landing_company_shortcode?: string;
};
const CoreStoreProvider: React.FC<{ children: React.ReactNode }> = observer(({ children }) => {
    const currentDomain = useMemo(() => '.' + window.location.hostname.split('.').slice(-2).join('.'), []);
    const { isAuthorizing, isAuthorized, connectionStatus, accountList, activeLoginid } = useApiBase();

    const appInitialization = useRef(false);
    const accountInitialization = useRef(false);
    const authAttempted = useRef(false);
    const timeInterval = useRef<NodeJS.Timeout | null>(null);
    const msg_listener = useRef<{ unsubscribe: () => void } | null>(null);
    const { client, common } = useStore() ?? {};

    const { currentLang } = useTranslations();

    const { oAuthLogout } = useOauth2({ handleLogout: async () => client.logout(), client });

    const { is_tmb_enabled: tmb_enabled_from_hook } = useTMB();

    const is_tmb_enabled = useMemo(
        () => window.is_tmb_enabled === true || tmb_enabled_from_hook,
        [tmb_enabled_from_hook]
    );

    const isLoggedOutCookie = Cookies.get('logged_state') === 'false' && !is_tmb_enabled;

    useEffect(() => {
        if (isLoggedOutCookie && client?.is_logged_in) {
            oAuthLogout();
        }
    }, [isLoggedOutCookie, oAuthLogout, client?.is_logged_in]);

    const activeAccount = useMemo(
        () => accountList?.find(account => account.loginid === activeLoginid),
        [activeLoginid, accountList]
    );

    // Keep the all-accounts balance map in sync with the latest account list.
    // The new Deriv platform's authenticated socket is per-account and only emits
    // live balance updates for the *active* account, so the non-active accounts
    // would otherwise keep showing their stale login-time balance. The account
    // list is refreshed from REST on every authorize (login, account switch, and
    // reconnect) with up-to-date balances, so we mirror those values into the map
    // here. This refreshes the non-active accounts and re-seeds the active one;
    // the live balance stream (handled below) then keeps the active account
    // current after this runs. This effect only runs when the account list /
    // active account changes (never on a live balance tick), so it can never
    // clobber a fresher live balance with stale data.
    useEffect(() => {
        if (!client || !accountList?.length) return;

        const existing_accounts = client.all_accounts_balance?.accounts ?? {};
        const accounts: NonNullable<Balance['accounts']> = { ...existing_accounts };
        let has_changes = false;

        accountList.forEach(account => {
            const account_loginid = account?.loginid;
            if (!account_loginid) return;
            const account_balance = Number((account as { balance?: number })?.balance ?? 0);
            const account_currency = account?.currency ?? '';
            const existing = accounts[account_loginid];

            // Skip accounts whose balance and currency already match the latest
            // account list to avoid needless re-renders.
            if (existing && existing.balance === account_balance && existing.currency === account_currency) {
                return;
            }

            accounts[account_loginid] = {
                ...existing,
                balance: account_balance,
                converted_amount: account_balance,
                currency: account_currency,
                demo_account: account?.is_virtual ? 1 : 0,
                status: 1,
                type: 'deriv',
            };
            has_changes = true;
        });

        if (has_changes) {
            const active_entry = accounts[activeLoginid ?? ''];
            client.setAllAccountsBalance({
                ...client.all_accounts_balance,
                accounts,
                balance: active_entry?.balance ?? client.all_accounts_balance?.balance ?? 0,
                currency: active_entry?.currency ?? client.all_accounts_balance?.currency ?? '',
                loginid: activeLoginid ?? client.all_accounts_balance?.loginid ?? '',
            });
        }
    }, [accountList, activeLoginid, client]);

    useEffect(() => {
        const currentBalanceData = client?.all_accounts_balance?.accounts?.[activeAccount?.loginid ?? ''];
        if (currentBalanceData) {
            client?.setBalance(currentBalanceData.balance.toFixed(getDecimalPlaces(currentBalanceData.currency)));
            client?.setCurrency(currentBalanceData.currency);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeAccount?.loginid, client?.all_accounts_balance]);

    useEffect(() => {
        if (client && activeAccount) {
            client?.setLoginId(activeLoginid);
            client?.setAccountList(accountList);
            client?.setIsLoggedIn(true);
        }
    }, [accountList, activeAccount, activeLoginid, client]);

    // Surface a clear, actionable error if a logged-in user's authorization
    // finished without success, instead of leaving a blank/non-working page.
    useEffect(() => {
        if (!common) return;
        if (isAuthorizing) {
            authAttempted.current = true;
            return;
        }
        const has_token = !!localStorage.getItem('authToken');
        const is_logged_in_cookie = Cookies.get('logged_state') === 'true';

        if (isAuthorized) {
            if (common.has_error) common.setError(false, {});
            return;
        }

        if (authAttempted.current && has_token && is_logged_in_cookie && !common.has_error) {
            common.setError(true, {
                header: localize('We could not connect to your account'),
                message: localize(
                    'Something went wrong while loading your trading account. Please check your connection and try again.'
                ),
                redirect_label: localize('Try again'),
                redirectOnClick: () => {
                    window.location.reload();
                },
                should_clear_error_on_click: true,
                type: 'error',
            });
        }
    }, [isAuthorizing, isAuthorized, common]);

    useEffect(() => {
        initFormErrorMessages(FORM_ERROR_MESSAGES());

        return () => {
            if (timeInterval.current) {
                clearInterval(timeInterval.current);
            }
        };
    }, []);

    useEffect(() => {
        if (common && currentLang) {
            common.setCurrentLanguage(currentLang);
        }
    }, [currentLang, common]);

    useEffect(() => {
        const updateServerTime = () => {
            api_base.api
                .time()
                .then((res: TSocketResponseData<'time'>) => {
                    common.setServerTime(toMoment(res.time), false);
                })
                .catch(() => {
                    common.setServerTime(toMoment(Date.now()), true);
                });
        };

        // Clear any existing interval before setting up a new one
        if (timeInterval.current) {
            clearInterval(timeInterval.current);
            timeInterval.current = null;
        }

        // Only setup the interval if the connection is open and we have access to the API
        if (client && connectionStatus === CONNECTION_STATUS.OPENED && api_base?.api) {
            if (!appInitialization.current) {
                appInitialization.current = true;
                api_base.api
                    ?.websiteStatus()
                    .then((res: TSocketResponseData<'website_status'>) => {
                        client.setWebsiteStatus(res.website_status);
                    })
                    .catch(() => {
                        // website_status is not part of the new platform's WS
                        // protocol for logged-out users; ignore so it never
                        // becomes an unhandled rejection.
                    });
            }

            // Initial time update
            updateServerTime();

            // Schedule updates every 10 seconds
            timeInterval.current = setInterval(updateServerTime, 10000);
        }

        // Cleanup on unmount or dependency change
        return () => {
            if (timeInterval.current) {
                clearInterval(timeInterval.current);
                timeInterval.current = null;
            }
        };
    }, [client, common, is_tmb_enabled, connectionStatus]);

    const handleMessages = useCallback(
        async (res: Record<string, unknown>) => {
            if (!res) return;
            const data = res.data as TSocketResponseData<'balance'>;
            const { msg_type, error } = data;

            if (msg_type === 'authorize' && (error?.code === 'DisabledClient' || error?.code === 'InvalidToken')) {
                await oAuthLogout();
            }

            if (msg_type === 'balance' && data && !error) {
                const balance = data.balance;
                if (balance?.accounts) {
                    client.setAllAccountsBalance(balance);
                } else if (balance && typeof balance.balance === 'number') {
                    // The new platform's per-account socket sends a balance for
                    // a single account and may omit the loginid; fall back to
                    // the active account so its balance stays live.
                    const target_loginid = balance.loginid || activeLoginid;
                    if (!client?.all_accounts_balance?.accounts || !target_loginid) return;
                    const accounts = { ...client.all_accounts_balance.accounts };
                    const currentLoggedInBalance = { ...accounts[target_loginid] };
                    currentLoggedInBalance.balance = balance.balance;
                    if (balance.currency) {
                        currentLoggedInBalance.currency = balance.currency;
                    }

                    const updatedAccounts = {
                        ...client.all_accounts_balance,
                        accounts: {
                            ...client.all_accounts_balance.accounts,
                            [target_loginid]: currentLoggedInBalance,
                        },
                    };
                    client.setAllAccountsBalance(updatedAccounts);
                }
            }
        },
        [client, oAuthLogout, activeLoginid]
    );

    useEffect(() => {
        if (!isAuthorizing && client) {
            const subscription = api_base?.api?.onMessage().subscribe(handleMessages);
            msg_listener.current = { unsubscribe: subscription?.unsubscribe };
        }

        return () => {
            if (msg_listener.current) {
                msg_listener.current.unsubscribe?.();
            }
        };
    }, [connectionStatus, handleMessages, isAuthorizing, isAuthorized, client]);

    useEffect(() => {
        if (!isAuthorizing && isAuthorized && !accountInitialization.current && client) {
            accountInitialization.current = true;
            api_base.api
                .getSettings()
                .then((settingRes: TSocketResponseData<'get_settings'>) => {
                    client?.setAccountSettings(settingRes.get_settings);
                    const client_information: TClientInformation = {
                        loginid: activeAccount?.loginid,
                        email: settingRes.get_settings?.email,
                        currency: client?.currency,
                        residence: settingRes.get_settings?.residence,
                        first_name: settingRes.get_settings?.first_name,
                        last_name: settingRes.get_settings?.last_name,
                        preferred_language: settingRes.get_settings?.preferred_language,
                        user_id: ((api_base.account_info as any)?.user_id as number) || activeLoginid,
                        landing_company_shortcode: activeAccount?.landing_company_name,
                    };

                    Cookies.set('client_information', JSON.stringify(client_information), {
                        domain: currentDomain,
                    });

                    api_base.api
                        .landingCompany({
                            landing_company: settingRes.get_settings?.country_code,
                        })
                        .then((res: TSocketResponseData<'landing_company'>) => {
                            client?.setLandingCompany(res.landing_company as unknown as TLandingCompany);
                        })
                        .catch(() => {
                            // The new API platform may not support `landing_company`.
                            // Mark it resolved so the dashboard loader (which is
                            // gated on is_landing_company_loaded) is never stuck.
                            client?.setIsLandingCompanyLoaded(true);
                        });
                })
                .catch(error => {
                    // If account settings fail, the nested landing_company call
                    // above never runs. Resolve the gate so the dashboard still
                    // loads instead of hanging on the spinner forever.
                    console.error('get_settings failed during account init:', error);
                    client?.setIsLandingCompanyLoaded(true);
                });

            api_base.api
                .getAccountStatus()
                .then((res: TSocketResponseData<'get_account_status'>) => {
                    client?.setAccountStatus(res.get_account_status);
                })
                .catch(() => {
                    /* get_account_status is non-blocking for boot; ignore */
                });
        }
    }, [isAuthorizing, isAuthorized, client]);

    return <>{children}</>;
});

export default CoreStoreProvider;
