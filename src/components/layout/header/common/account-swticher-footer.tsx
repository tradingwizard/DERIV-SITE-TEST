import React from 'react';
import classNames from 'classnames';
import { standalone_routes } from '@/components/shared';
import Button from '@/components/shared_ui/button';
import { useFirebaseCountriesConfig } from '@/hooks/firebase/useFirebaseCountriesConfig';
import useStoreWalletAccountsList from '@/hooks/useStoreWalletAccountsList';
import { getWalletUrl, handleTraderHubRedirect } from '@/utils/traders-hub-redirect';
import { Localize, localize } from '@deriv-com/translations';
import { AccountSwitcher as UIAccountSwitcher } from '@deriv-com/ui';

type TAccountSwitcherFooter = {
    oAuthLogout: () => void;
    loginid?: string;
    is_logging_out?: boolean;
    residence?: string;
    type?: 'demo' | 'real';
};
import { AccountSwitcherDivider } from './utils';

const AccountSwitcherFooter = ({ loginid, residence, type }: TAccountSwitcherFooter) => {
    const accountList = JSON.parse(localStorage.getItem('clientAccounts') || '{}');
    const account_currency = loginid ? accountList[loginid]?.currency : '';
    const { has_wallet = false } = useStoreWalletAccountsList() || {};
    const { hubEnabledCountryList } = useFirebaseCountriesConfig();

    // Check if the account is a demo account from its type, stored flag, or URL
    // parameter (login-ID prefixes are no longer reliable on the new API).
    const urlParams = new URLSearchParams(window.location.search);
    const account_param = urlParams.get('account');
    const account_is_virtual = loginid ? Boolean(accountList[loginid]?.is_virtual) : false;
    const is_virtual = account_is_virtual || type === 'demo' || account_param === 'demo' || false;

    // Show the manage button only for real accounts.
    const show_manage_button = type === 'real' && !is_virtual;

    // Get the redirect URL from handleTraderHubRedirect
    const redirectParams = {
        product_type: 'cfds' as const,
        has_wallet,
        is_virtual,
        residence,
        hubEnabledCountryList,
    };
    const redirect_url_str = handleTraderHubRedirect(redirectParams) || standalone_routes.traders_hub;

    // Add the account parameter to the URL
    let final_url_str = redirect_url_str;
    try {
        const redirect_url = new URL(redirect_url_str);
        if (is_virtual) {
            // For demo accounts, set the account parameter to 'demo'
            redirect_url.searchParams.set('account', 'demo');
        } else if (account_currency) {
            // For real accounts, set the account parameter to the currency
            redirect_url.searchParams.set('account', account_currency);
        }
        final_url_str = redirect_url.toString();
    } catch (error) {
        console.error('Error parsing redirect URL:', error);
    }

    const is_virtual_tab = type === 'demo';

    return (
        <div className=''>
            <UIAccountSwitcher.TradersHubLink href={final_url_str}>
                {localize(`Looking for CFD accounts? Go to Trader's Hub`)}
            </UIAccountSwitcher.TradersHubLink>
            <AccountSwitcherDivider />
            {!is_virtual_tab && (
                <div
                    className={classNames('account-switcher-footer__actions', {
                        'account-switcher-footer__actions--hide-manage-button': !show_manage_button,
                    })}
                >
                    <Button
                        id='manage-button'
                        className='manage-button'
                        onClick={() => {
                            if (has_wallet) {
                                const wallet_url = getWalletUrl();
                                location.replace(wallet_url);
                            } else {
                                location.replace(final_url_str);
                            }
                        }}
                    >
                        <Localize i18n_default_text='Manage accounts' />
                    </Button>
                    {/* Logout button removed from Desktop interface as per acceptance criteria */}
                </div>
            )}
        </div>
    );
};

export default AccountSwitcherFooter;
