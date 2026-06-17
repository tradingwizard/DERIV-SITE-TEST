---
name: Deriv new-API migration
description: How GTS Empire (Deriv Bot fork) was moved off legacy @deriv/deriv-api onto Deriv's NEW API platform, and the constraints that flow from that choice.
---

# Deriv NEW API platform migration

GTS Empire no longer uses legacy `@deriv/deriv-api` (DerivAPIBasic). It runs on
Deriv's new Options trading platform, which has a fundamentally different auth and
data model. A compatibility adapter keeps the rest of the app (trade engine,
stores, services) unchanged.

**Why:** The new platform is required for the live app; the legacy WS `authorize`
message flow no longer exists there.

## Core model differences (how to apply)
- **Auth is server-side PKCE.** Token exchange (`/oauth2/token` on auth.deriv.com)
  is form-encoded and MUST run on a backend — never in the browser. A small Express
  server (`server/`) does the exchange and proxies authenticated REST calls
  (account list + WS OTP) so the browser only ever holds the access token.
- **WS auth is OTP-in-URL, not an `authorize` message.** Flow: REST get accounts →
  REST get OTP WS url for the active account → connect to that url. The adapter
  *synthesizes* a legacy-shaped `authorize` response (account_list/balance/etc.)
  from the REST account data so callers that expect `authorize.account_list` work.
- **Public/market data uses a separate public WS** so logged-out users still get
  ticks/active_symbols.
- **Field renames** must be translated both directions in the adapter:
  active_symbols `symbol→underlying_symbol`, `pip→pip_size`,
  `display_name→underlying_symbol_name`, `symbol_type→underlying_symbol_type`;
  market/submarket display names are gone (rebuild via a humanize map). proposal/buy/
  poc drop `loginid`, numeric fields may arrive as strings (coerce them), poc
  `exit_spot→sell_spot`.

## TMB must be forced OFF for this fork
`useTMB` defaults come from Deriv's Firebase remote config and its session endpoint
targets `oauth.deriv.com` — neither works for a non-Deriv domain. `isTmbEnabled()`
is hard-defaulted to false (only an explicit `localStorage.is_tmb_enabled='true'`
override re-enables it) so the PKCE flow is always used.
**Why:** if TMB ever turned on, it would bypass PKCE and try to talk to Deriv's own
OAuth infra, breaking login on gtstrader.app.

## Unverified in this env (must test on deploy)
Live OAuth + real/demo trading cannot be exercised without a Deriv login. Two
runtime assumptions in the adapter are unconfirmed: the public WS URL query format
(`/public?app_id=`) and whether the server echoes `req_id` (there is a msg_type
fallback for correlation if it does not).
