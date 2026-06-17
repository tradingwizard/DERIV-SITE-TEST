---
name: Deriv NEW API platform quirks
description: Non-obvious behavior of Deriv's new (non-legacy) auth/account/WS platform used by this fork
---

# Deriv NEW API platform (PKCE OAuth + REST + OTP-authenticated WS)

This fork was migrated off legacy Deriv auth to Deriv's NEW platform. Several
long-standing assumptions from the legacy Deriv codebase are now WRONG.

## Account shapes — no more VR/CR loginid prefixes
- New accounts use `account_type` of `"demo"` / `"real"` and IDs like `DOT90004580`
  (NOT legacy `VR...`/`CR...`/`VRTC...` prefixes), and are USD-only.
- Accounts endpoint: `GET /trading/v1/options/accounts` →
  `{ data: [{ account_id, balance, currency, group, status, account_type }] }`.
- **How to apply:** never branch demo/real on `loginid.startsWith('VR'|'CR')`.
  Derive virtual via `account_type` (treat `/demo|virtual|vrt/i` as virtual).
  `account_id` is the loginid used everywhere downstream.
- UI that groups/labels accounts must use `is_virtual` + `landing_company_name`
  (adapter sets it to `group || 'svg'`, so EU == `'maltainvest'`), NOT loginid
  prefixes (CR/MF/VRT). Same rule for `is_cr_account` (real && !eu).

## Pending-contract recovery — portfolio snapshot is gone
- Legacy recovery read `core.portfolio.positions`; the portfolio store/sub was
  removed, so positions were hardcoded `[]` and recovery silently did nothing.
- **How to apply:** rebuild the positions list from the `proposal_open_contract`
  updates the app already receives (cache them per contract_id in transactions
  store) for LIVE-session reconciliation. The global open-contracts subscription
  does NOT report a contract that settled while the user was away (it dropped out
  of the "open" set), so after a page refresh those stay stuck pending. Fix:
  explicitly one-shot query `{proposal_open_contract:1, contract_id}` per cached
  pending contract (no `subscribe`) and finalize the result.
- **Two complementary recovery paths, do not conflate:** (1) a global WS message
  listener (`app-content.jsx handleMessage`) finalizes contracts that settle
  DURING the session (it only acts on `status !== 'open'`); (2) the refresh
  one-shot query finalizes contracts that settled WHILE AWAY.
- **Gotcha:** `updateResultsCompletedContract` must only push to
  `recovered_transactions` when `isEnded(contract)`. Marking a still-OPEN
  contract as recovered makes the live listener's `!recovered_transactions.includes`
  guard skip it when it later settles → stuck pending forever. So the refresh
  query must also skip finalizing contracts that are still open.

## OTP-authenticated WebSocket
- OTP endpoint → `{ data: { url: "wss://.../ws/demo|real?otp=..." } }`.
- **Why:** the OTP is single-use and short-lived. A failed WS connect (or a stale
  OTP) cannot be retried by reconnecting with the same URL.
- **How to apply:** on WS connect failure, fetch a FRESH OTP before each retry
  (see `connectWithOtpRetry` in `deriv-ws-adapter.ts`). The ws `connect()` must
  reject on close-before-open and on a timeout — otherwise authorize() hangs
  forever and the dashboard renders blank with no accounts and no error.

## Logged-out public market data — VERIFIED working (probed live)
- Public WS URL: `wss://api.derivws.com/trading/v1/options/ws/public?app_id=...`
  — the `/public` suffix is REQUIRED (without it the handshake 404s).
- `req_id` IS echoed on every response, and `echo_req` is present. Correlation
  by req_id is reliable; the adapter's msg_type fallback is only a safety net.
- SUPPORTED on the public socket (no auth): `active_symbols`, `ticks`,
  `ticks_history` (history/candles), `trading_times`, `contracts_for` (pass the
  symbol as the value, e.g. `{contracts_for: 'R_100'}` — `currency` is rejected
  with InputValidationFailed), `time`, `ping`, `forget`, `forget_all`.
- NOT SUPPORTED (reply `UnrecognisedRequest`): `website_status`,
  `residence_list`. These legacy "system" calls are gone on the new platform.
- **How to apply:** the logged-out chart/symbol path is fine. `website_status`
  is stubbed to degrade gracefully (the adapter resolves `{website_status:{}}`
  on failure) so it doesn't spam uncaught errors; currency/country lookups have
  fallbacks. The `DisconnectError` spam seen in dev was HMR reconnect noise, not
  a protocol failure.
