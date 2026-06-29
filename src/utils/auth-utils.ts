/**
 * Utility functions for authentication-related operations
 */
import Cookies from 'js-cookie';
import { debugAuth } from '@/utils/auth-debug';

/**
 * Clears authentication data from local storage and reloads the page
 */
export const clearAuthData = (is_reload: boolean = true, source = 'clearAuthData'): void => {
    debugAuth('auth-clear.attempted', { source, is_reload });
    localStorage.removeItem('accountsList');
    localStorage.removeItem('clientAccounts');
    localStorage.removeItem('callback_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('active_loginid');
    localStorage.removeItem('account_type');
    localStorage.removeItem('client.accounts');
    localStorage.removeItem('client.country');
    sessionStorage.removeItem('query_param_currency');
    sessionStorage.removeItem('deriv_accounts');
    if (is_reload) {
        location.reload();
    }
};

/**
 * Handles OIDC authentication failure by clearing auth data and showing logged out view
 * @param error - The error that occurred during OIDC authentication
 */
export const handleOidcAuthFailure = (error: any): void => {
    // Log the error
    console.error('OIDC authentication failed:', error);
    debugAuth('auth-clear.attempted', {
        source: 'handleOidcAuthFailure',
        message: error?.message || String(error),
        is_reload: true,
    });

    // Clear auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('active_loginid');
    localStorage.removeItem('account_type');
    localStorage.removeItem('clientAccounts');
    localStorage.removeItem('accountsList');
    sessionStorage.removeItem('deriv_accounts');

    // Set logged_state cookie to false
    Cookies.set('logged_state', 'false', {
        domain: window.location.hostname.split('.').slice(-2).join('.'),
        expires: 30,
        path: '/',
        secure: true,
    });

    // Reload the page to show the logged out view
    window.location.reload();
};
