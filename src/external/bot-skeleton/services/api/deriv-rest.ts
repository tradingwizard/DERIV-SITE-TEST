/**
 * REST client for the new Deriv Options trading platform.
 *
 * All calls go through our own backend proxy (/api/deriv/*) which forwards them
 * to https://api.derivws.com with the required Deriv-App-ID header. The browser
 * only holds the OAuth access token.
 */

export type TDerivAccount = {
    account_id: string;
    balance: number;
    currency: string;
    account_type: string;
    group: string;
    status: string;
    created_at?: string;
    name?: string;
};

const parseError = async (response: Response): Promise<string> => {
    const data = await response.json().catch(() => ({}));
    if (data?.errors?.length) return data.errors[0].message || data.errors[0].code;
    return data?.error || `Request failed with status ${response.status}`;
};

/** Returns the list of options trading accounts for the given access token. */
export const fetchAccounts = async (accessToken: string): Promise<TDerivAccount[]> => {
    const response = await fetch('/api/deriv/accounts', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error(await parseError(response));
    const data = await response.json();
    return (data?.data ?? []) as TDerivAccount[];
};

/**
 * Requests a one-time-password WebSocket URL for a specific account.
 * Returns the ready-to-use authenticated WebSocket URL (OTP embedded).
 */
export const fetchWebSocketUrl = async (accessToken: string, accountId: string): Promise<string> => {
    const response = await fetch(`/api/deriv/accounts/${encodeURIComponent(accountId)}/otp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error(await parseError(response));
    const data = await response.json();
    const url = data?.data?.url;
    if (!url) throw new Error('No WebSocket URL returned by the server.');
    return url as string;
};

/** Heuristic: is this account a demo/virtual account? */
export const isVirtualAccount = (account: TDerivAccount): boolean =>
    /demo|virtual|vrt/i.test(`${account.account_type ?? ''} ${account.group ?? ''} ${account.account_id ?? ''}`);
