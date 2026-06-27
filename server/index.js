/* eslint-disable no-console */
/**
 * GTS Empire backend server.
 *
 * Responsibilities for the NEW Deriv API platform:
 *  1. OAuth2 + PKCE token exchange (MUST be server-side per Deriv docs).
 *  2. Proxy authenticated REST calls (account list + WebSocket OTP) so the
 *     browser is not blocked by CORS and credentials stay on a trusted origin.
 *  3. Serve the built single-page app (dist/) with SPA fallback.
 *
 * This server intentionally uses only Node's built-in modules so the preview
 * can run even when Windows/npm leaves backend packages half-installed.
 */
const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = process.env.PORT || 3001;
const DERIV_APP_ID = process.env.DERIV_APP_ID || '33bwKJisse4x97RR0zpa0';
const AUTH_BASE = process.env.DERIV_AUTH_BASE || 'https://auth.deriv.com';
const API_BASE = process.env.DERIV_API_BASE || 'https://api.derivws.com';
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

// --- helpers ---------------------------------------------------------------

const sendJson = (res, status, payload) => {
    const body = JSON.stringify(payload);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
};

const forwardError = (res, status, message, extra) => {
    sendJson(res, status || 500, { error: message || 'Request failed', ...(extra || {}) });
};

const getBearer = req => {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) return header.slice(7);
    return null;
};

const readJsonBody = req =>
    new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 1024 * 1024) {
                req.destroy();
                reject(new Error('Request body too large'));
            }
        });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                return resolve(JSON.parse(body));
            } catch (err) {
                return reject(err);
            }
        });
        req.on('error', reject);
    });

const sendFile = (res, file_path) => {
    fs.readFile(file_path, (err, data) => {
        if (err) return forwardError(res, err.code === 'ENOENT' ? 404 : 500, 'File not found');
        const ext = path.extname(file_path).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Content-Length': data.length,
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
        });
        return res.end(data);
    });
};

const serveStaticOrSpa = (req, res, pathname) => {
    let safe_path;
    try {
        safe_path = decodeURIComponent(pathname);
    } catch (_err) {
        return forwardError(res, 400, 'Invalid path');
    }

    const requested = path.normalize(safe_path).replace(/^(\.\.[/\\])+/, '');
    const file_path = path.join(DIST_DIR, requested === '/' ? 'index.html' : requested);

    if (!file_path.startsWith(DIST_DIR)) return forwardError(res, 403, 'Forbidden');

    fs.stat(file_path, (err, stat) => {
        if (!err && stat.isFile()) return sendFile(res, file_path);
        return sendFile(res, path.join(DIST_DIR, 'index.html'));
    });
};

// --- route handlers --------------------------------------------------------

const handleTokenExchange = async (req, res) => {
    try {
        const { code, code_verifier, redirect_uri } = await readJsonBody(req);
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

        return sendJson(res, 200, {
            access_token: data.access_token,
            token_type: data.token_type,
            expires_in: data.expires_in,
            scope: data.scope,
        });
    } catch (err) {
        console.error('Token exchange error:', err);
        return forwardError(res, 500, 'Token exchange error');
    }
};

const handleAccounts = async (req, res) => {
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
        return sendJson(res, deriv_res.status, data);
    } catch (err) {
        console.error('Accounts proxy error:', err);
        return forwardError(res, 500, 'Accounts proxy error');
    }
};

const handleOtp = async (req, res, account_id) => {
    const token = getBearer(req);
    if (!token) return forwardError(res, 401, 'Missing bearer token');

    try {
        const deriv_res = await fetch(
            `${API_BASE}/trading/v1/options/accounts/${encodeURIComponent(account_id)}/otp`,
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
            console.error(`[deriv] POST otp ${account_id} -> ${deriv_res.status}`, JSON.stringify(data));
        } else {
            console.log(`[deriv] POST otp ${account_id} -> ${deriv_res.status} (url ${data?.data?.url ? 'received' : 'missing'})`);
        }
        return sendJson(res, deriv_res.status, data);
    } catch (err) {
        console.error('OTP proxy error:', err);
        return forwardError(res, 500, 'OTP proxy error');
    }
};

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    if (req.method === 'GET' && pathname === '/api/health') {
        return sendJson(res, 200, { status: 'ok', app_id: DERIV_APP_ID });
    }

    if (req.method === 'POST' && pathname === '/api/oauth/token') {
        return handleTokenExchange(req, res);
    }

    if (req.method === 'GET' && pathname === '/api/deriv/accounts') {
        return handleAccounts(req, res);
    }

    const otp_match = pathname.match(/^\/api\/deriv\/accounts\/([^/]+)\/otp$/);
    if (req.method === 'POST' && otp_match) {
        return handleOtp(req, res, otp_match[1]);
    }

    if (pathname.startsWith('/api/')) {
        return forwardError(res, 404, 'API route not found');
    }

    return serveStaticOrSpa(req, res, pathname);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`GTS Empire server listening on port ${PORT} (app_id ${DERIV_APP_ID})`);
});
