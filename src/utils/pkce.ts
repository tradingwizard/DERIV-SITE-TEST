/**
 * OAuth2 + PKCE helpers for the new Deriv API platform.
 *
 * The new platform uses Authorization Code flow with PKCE. The browser builds
 * the authorize URL (with a code challenge), then the callback exchanges the
 * returned code for an access token via our own backend (the token exchange
 * must never happen in the browser).
 */
import {
    DERIV_AFFILIATE,
    DERIV_AUTH_URL,
    DERIV_OAUTH_SCOPE,
    GTS_APP_ID,
    LEGACY_WS_APP_ID,
} from '@/components/shared/utils/config/config';

const VERIFIER_KEY = 'pkce_code_verifier';
const STATE_KEY = 'pkce_state';
const REFERENCE_VERIFIER_KEY = 'oauth_code_verifier';
const REFERENCE_VERIFIER_TIMESTAMP_KEY = 'oauth_code_verifier_timestamp';
const REFERENCE_STATE_KEY = 'oauth_csrf_token';
const REFERENCE_STATE_TIMESTAMP_KEY = 'oauth_csrf_token_timestamp';

const isDebugDeriv = () =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug_deriv');

const debugDeriv = (label: string, payload: Record<string, unknown>) => {
    if (!isDebugDeriv()) return;
    // eslint-disable-next-line no-console
    console.info(`[debug_deriv] ${label}`, payload);
};

const toBase64Url = (bytes: Uint8Array): string => {
    let str = '';
    bytes.forEach(b => (str += String.fromCharCode(b)));
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const randomString = (length = 32): string => {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return toBase64Url(bytes);
};

const sha256 = async (input: string): Promise<Uint8Array> => {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(digest);
};

export const getOAuthRedirectUri = (): string => `${window.location.origin}/`;

export const getOAuthCallbackRedirectUri = (): string => `${window.location.origin}/callback`;

/**
 * Builds the Deriv authorize URL, persisting the PKCE verifier + state so the
 * callback can complete the exchange.
 */
export const buildAuthorizeUrl = async (options: { isSignup?: boolean; account?: string } = {}): Promise<string> => {
    const verifier = randomString(48);
    const state = randomString(24);
    const challenge = toBase64Url(await sha256(verifier));

    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(STATE_KEY, state);
    sessionStorage.setItem(REFERENCE_VERIFIER_KEY, verifier);
    sessionStorage.setItem(REFERENCE_VERIFIER_TIMESTAMP_KEY, Date.now().toString());
    sessionStorage.setItem(REFERENCE_STATE_KEY, state);
    sessionStorage.setItem(REFERENCE_STATE_TIMESTAMP_KEY, Date.now().toString());
    if (options.account) sessionStorage.setItem('query_param_currency', options.account);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: GTS_APP_ID,
        redirect_uri: getOAuthRedirectUri(),
        scope: DERIV_OAUTH_SCOPE,
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        app_id: LEGACY_WS_APP_ID,
    });

    if (options.isSignup) {
        params.set('prompt', 'registration');
        if (DERIV_AFFILIATE.referral_code) params.set('t', DERIV_AFFILIATE.referral_code);
        params.set('utm_source', DERIV_AFFILIATE.utm_source);
        params.set('utm_medium', DERIV_AFFILIATE.utm_medium);
        params.set('utm_campaign', DERIV_AFFILIATE.utm_campaign);
    }

    return `${DERIV_AUTH_URL}?${params.toString()}`;
};

/** Redirects the browser to the Deriv login (or signup) page. */
export const redirectToLogin = async (options: { isSignup?: boolean; account?: string } = {}): Promise<void> => {
    const url = await buildAuthorizeUrl(options);
    const parsed_url = new URL(url);
    debugDeriv('pkce redirect', {
        auth_origin: parsed_url.origin,
        auth_path: parsed_url.pathname,
        client_id: parsed_url.searchParams.get('client_id'),
        redirect_uri: parsed_url.searchParams.get('redirect_uri'),
        response_type: parsed_url.searchParams.get('response_type'),
        is_signup: Boolean(options.isSignup),
        account: options.account || null,
    });
    window.location.assign(url);
};

export const getStoredState = (): string | null =>
    sessionStorage.getItem(STATE_KEY) || sessionStorage.getItem(REFERENCE_STATE_KEY);

export const clearPkceState = (): void => {
    sessionStorage.removeItem(VERIFIER_KEY);
    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(REFERENCE_VERIFIER_KEY);
    sessionStorage.removeItem(REFERENCE_VERIFIER_TIMESTAMP_KEY);
    sessionStorage.removeItem(REFERENCE_STATE_KEY);
    sessionStorage.removeItem(REFERENCE_STATE_TIMESTAMP_KEY);
};

/**
 * Exchanges the authorization code for an access token via our backend.
 * Returns the access token string.
 */
export const exchangeCodeForToken = async (code: string, redirect_uri = getOAuthRedirectUri()): Promise<string> => {
    const code_verifier = sessionStorage.getItem(VERIFIER_KEY) || sessionStorage.getItem(REFERENCE_VERIFIER_KEY);
    if (!code_verifier) throw new Error('Missing PKCE verifier. Please start the login again.');

    const response = await fetch('/api/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            code,
            code_verifier,
            redirect_uri,
        }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) {
        throw new Error(data.error || 'Failed to exchange authorization code for a token.');
    }

    clearPkceState();
    return data.access_token as string;
};
