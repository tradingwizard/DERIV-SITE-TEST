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

## Core model differences (durable decisions)
- **Auth must be server-side PKCE.** The new token endpoint is form-encoded and
  (per Deriv docs) must be exchanged from a backend, never the browser — so this
  fork ships a small Express server that also proxies the authenticated REST calls.
  **Why:** browser-side token exchange is not supported; treat the backend as a
  required part of the architecture, not optional scope.
- **WS auth is OTP-in-URL, not an `authorize` message.** The active account's
  authenticated WS URL is obtained over REST, then connected to directly. Because
  the rest of the app still expects a legacy `authorize.account_list` shape, the
  adapter synthesizes that response from REST account data.
- **A DerivAPIBasic-compatible adapter is the seam.** Keep the full legacy method
  surface the app calls directly (convenience methods + send/onMessage/forget/
  connection facade). Missing methods cause synchronous `.then`-on-undefined
  crashes during post-login bootstrap — verify parity whenever app code adds a new
  `api_base.api.*` call.
- **Field names differ between new and legacy and are translated in the adapter.**
  **Why:** the new platform renamed several active_symbols/proposal/poc fields and
  dropped market display names; downstream code is unchanged and relies on the
  legacy names.

## TMB must be forced OFF for this fork
`useTMB` defaults come from Deriv's Firebase remote config and its session endpoint
targets `oauth.deriv.com` — neither works for a non-Deriv domain. TMB is therefore
hard-forced off (no override path) so the PKCE flow is always used.
**Why:** if TMB ever turned on, it would bypass PKCE and try to talk to Deriv's own
OAuth infra, breaking login on gtstrader.app.
**How to apply:** treat the TMB enabled-flag as synchronously false; never gate UI
on the async `isTmbEnabled()` return value (a Promise is always truthy).

## Unverified in this env (must test on deploy)
Live OAuth + real/demo trading cannot be exercised without a Deriv login. Two
runtime assumptions in the adapter are unconfirmed: the public WS URL query format
(`/public?app_id=`) and whether the server echoes `req_id` (there is a msg_type
fallback for correlation if it does not).
