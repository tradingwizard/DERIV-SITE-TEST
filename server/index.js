/* eslint-disable no-console */
/**
 * GTS Empire backend server.
 *
 * Responsibilities for the NEW Deriv API platform:
 *  1. OAuth2 + PKCE token exchange (MUST be server-side per Deriv docs).
 *  2. Proxy authenticated REST calls (account list + WebSocket OTP) so the
 *     browser is not blocked by CORS and credentials stay on a trusted origin.
 *  3. Serve the built single-page app (dist/) with SPA fallback.
 */
const path = require('path');
const express = require('express');

const app = express();

const PORT = process.env.PORT || 3001;
const DERIV_APP_ID = process.env.DERIV_APP_ID || '33bwKJisse4x97RR0zpa0';
const AUTH_BASE = process.env.DERIV_AUTH_BASE || 'https://auth.deriv.com';
const API_BASE = process.env.DERIV_API_BASE || 'https://api.derivws.com';

app.use(express.json());

// --- helpers ---------------------------------------------------------------

const getBearer = req => {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) return header.slice(7);
    return null;
};

const forwardError = (res, status, message, extra) => {
    res.status(status || 500).json({ error: message || 'Request failed', ...(extra || {}) });
};

// --- health ----------------------------------------------------------------

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app_id: DERIV_APP_ID });
});

// --- OAuth2 token exchange (server-side, PKCE) -----------------------------

app.post('/api/oauth/token', async (req, res) => {
    try {
        const { code, code_verifier, redirect_uri } = req.body || {};
        if (!code || !code_verifier || !redirect_uri) {
            return forwardError(res, 400, 'Missing code, code_verifier or redirect_uri');
        }

        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: DERIV_APP_ID,
            code,
            code_verifier,
            redirect_uri,
        });

        const deriv_res = await fetch(`${AUTH_BASE}/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });

        const data = await deriv_res.json().catch(() => ({}));
        if (!deriv_res.ok) {
            console.error('Token exchange failed:', deriv_res.status, data);
            return forwardError(res, deriv_res.status, data.error_description || data.error || 'Token exchange failed', {
                details: data,
            });
        }

        return res.json({
            access_token: data.access_token,
            token_type: data.token_type,
            expires_in: data.expires_in,
            scope: data.scope,
        });
    } catch (err) {
        console.error('Token exchange error:', err);
        return forwardError(res, 500, 'Token exchange error');
    }
});

// --- Authenticated REST proxy ---------------------------------------------

app.get('/api/deriv/accounts', async (req, res) => {
    const token = getBearer(req);
    if (!token) return forwardError(res, 401, 'Missing bearer token');
    try {
        const deriv_res = await fetch(`${API_BASE}/trading/v1/options/accounts`, {
            headers: {
                'Deriv-App-ID': DERIV_APP_ID,
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await deriv_res.json().catch(() => ({}));
        if (!deriv_res.ok) {
            console.error(`[deriv] GET accounts -> ${deriv_res.status}`, JSON.stringify(data));
        } else {
            const count = Array.isArray(data?.data) ? data.data.length : 'n/a';
            console.log(`[deriv] GET accounts -> ${deriv_res.status} (${count} accounts)`);
        }
        return res.status(deriv_res.status).json(data);
    } catch (err) {
        console.error('Accounts proxy error:', err);
        return forwardError(res, 500, 'Accounts proxy error');
    }
});

app.post('/api/deriv/accounts/:accountId/otp', async (req, res) => {
    const token = getBearer(req);
    if (!token) return forwardError(res, 401, 'Missing bearer token');
    const { accountId } = req.params;
    try {
        const deriv_res = await fetch(
            `${API_BASE}/trading/v1/options/accounts/${encodeURIComponent(accountId)}/otp`,
            {
                method: 'POST',
                headers: {
                    'Deriv-App-ID': DERIV_APP_ID,
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        const data = await deriv_res.json().catch(() => ({}));
        if (!deriv_res.ok) {
            console.error(`[deriv] POST otp ${accountId} -> ${deriv_res.status}`, JSON.stringify(data));
        } else {
            console.log(`[deriv] POST otp ${accountId} -> ${deriv_res.status} (url ${data?.data?.url ? 'received' : 'missing'})`);
        }
        return res.status(deriv_res.status).json(data);
    } catch (err) {
        console.error('OTP proxy error:', err);
        return forwardError(res, 500, 'OTP proxy error');
    }
});

// --- Static SPA ------------------------------------------------------------

const DIST_DIR = path.resolve(__dirname, '..', 'dist');
app.use(express.static(DIST_DIR));

// SPA fallback: anything that is not an API route returns index.html.
app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`GTS Empire server listening on port ${PORT} (app_id ${DERIV_APP_ID})`);
});
