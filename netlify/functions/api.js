/* eslint-disable no-console */
const DERIV_APP_ID = process.env.DERIV_APP_ID || process.env.GTS_APP_ID || '33bwKJisse4x97RR0zpa0';
const AUTH_BASE = process.env.DERIV_AUTH_BASE || 'https://auth.deriv.com';
const API_BASE = process.env.DERIV_API_BASE || process.env.DERIV_API_REST_BASE || 'https://api.derivws.com';

const jsonResponse = (statusCode, payload) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
    },
    body: JSON.stringify(payload),
});

const errorResponse = (statusCode, message, extra) =>
    jsonResponse(statusCode || 500, { error: message || 'Request failed', ...(extra || {}) });

const getPath = event => {
    const raw_path = event.rawUrl ? new URL(event.rawUrl).pathname : event.path || '/';
    let path = raw_path.replace(/^\/\.netlify\/functions\/api\/?/, '/');
    if (!path.startsWith('/api/')) path = `/api${path === '/' ? '' : path}`;
    return path;
};

const getBearer = event => {
    const headers = event.headers || {};
    const authorization = headers.authorization || headers.Authorization || '';
    return authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
};

const readJsonBody = event => {
    if (!event.body) return {};

    const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
    return JSON.parse(body);
};

const handleTokenExchange = async event => {
    let payload;
    try {
        payload = readJsonBody(event);
    } catch (_err) {
        return errorResponse(400, 'Invalid JSON body');
    }

    const { code, code_verifier, redirect_uri } = payload;
    if (!code || !code_verifier || !redirect_uri) {
        return errorResponse(400, 'Missing code, code_verifier or redirect_uri');
    }

    try {
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
            return errorResponse(deriv_res.status, data.error_description || data.error || 'Token exchange failed', {
                details: data,
            });
        }

        return jsonResponse(200, {
            access_token: data.access_token,
            token_type: data.token_type,
            expires_in: data.expires_in,
            scope: data.scope,
        });
    } catch (err) {
        console.error('Token exchange error:', err);
        return errorResponse(500, 'Token exchange error');
    }
};

const handleAccounts = async event => {
    const token = getBearer(event);
    if (!token) return errorResponse(401, 'Missing bearer token');

    try {
        const deriv_res = await fetch(`${API_BASE}/trading/v1/options/accounts`, {
            headers: {
                'Deriv-App-ID': DERIV_APP_ID,
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await deriv_res.json().catch(() => ({}));
        return jsonResponse(deriv_res.status, data);
    } catch (err) {
        console.error('Accounts proxy error:', err);
        return errorResponse(500, 'Accounts proxy error');
    }
};

const handleOtp = async (event, account_id) => {
    const token = getBearer(event);
    if (!token) return errorResponse(401, 'Missing bearer token');

    try {
        const deriv_res = await fetch(`${API_BASE}/trading/v1/options/accounts/${encodeURIComponent(account_id)}/otp`, {
            method: 'POST',
            headers: {
                'Deriv-App-ID': DERIV_APP_ID,
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await deriv_res.json().catch(() => ({}));
        return jsonResponse(deriv_res.status, data);
    } catch (err) {
        console.error('OTP proxy error:', err);
        return errorResponse(500, 'OTP proxy error');
    }
};

exports.handler = async event => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                Allow: 'GET, POST, OPTIONS',
            },
            body: '',
        };
    }

    const pathname = getPath(event);

    if (event.httpMethod === 'GET' && pathname === '/api/health') {
        return jsonResponse(200, { status: 'ok', app_id: DERIV_APP_ID });
    }

    if (event.httpMethod === 'POST' && pathname === '/api/oauth/token') {
        return handleTokenExchange(event);
    }

    if (event.httpMethod === 'GET' && pathname === '/api/deriv/accounts') {
        return handleAccounts(event);
    }

    const otp_match = pathname.match(/^\/api\/deriv\/accounts\/([^/]+)\/otp$/);
    if (event.httpMethod === 'POST' && otp_match) {
        return handleOtp(event, otp_match[1]);
    }

    return errorResponse(404, 'API route not found');
};

