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

## OTP-authenticated WebSocket
- OTP endpoint → `{ data: { url: "wss://.../ws/demo|real?otp=..." } }`.
- **Why:** the OTP is single-use and short-lived. A failed WS connect (or a stale
  OTP) cannot be retried by reconnecting with the same URL.
- **How to apply:** on WS connect failure, fetch a FRESH OTP before each retry
  (see `connectWithOtpRetry` in `deriv-ws-adapter.ts`). The ws `connect()` must
  reject on close-before-open and on a timeout — otherwise authorize() hangs
  forever and the dashboard renders blank with no accounts and no error.

## Logged-out public market data is a SEPARATE protocol concern
- The logged-out/public WS rejects legacy requests like `website_status`/`time`
  with `UnrecognisedRequest`, and `forget_all` ticks with `DisconnectError`.
- **How to apply:** these errors are unrelated to login/authorize; do not chase
  them while fixing the post-login dashboard. They belong to the logged-out
  market-data work stream.
