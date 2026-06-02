# Node Probe 416 Summary

Project ref: `cimwhpatnazndnnvvfoz`

## Status Update

This file no longer describes the current product status.

After browser-side revalidation on both:

- `http://localhost:3000/`
- `https://baishijuju.github.io/duo-wish-board-app/`

the main product flows are working against the real Supabase project.

The remaining inconsistency is narrower:

- the standalone Node diagnostic path still reports empty `416 Requested Range Not Satisfiable` responses
- but the real browser application path is functioning

So this is now a tooling/debugging note, not a product outage summary.

## Browser-Validated Working

- Email OTP auth works in the browser.
- The browser app reaches the real Supabase-backed space rather than only local mock state.
- The same email can log back into the same space instead of creating a new one each time.
- A second email can join the same shared space.
- Shared-space private wish visibility behaves correctly in the browser:
  - owner can see the private wish
  - member cannot see the private wish
- Wish create/delete flows work in the browser.
- Wish image upload/delete works in the browser.
- Comment image upload works in the browser.
- Cross-page/browser sync works.

These browser findings supersede the earlier assumption that the whole product was blocked by REST/RPC `416` failures.

## Still Reproducible In Node Probe

Using the standalone script path, raw REST/RPC calls can still fail with empty `416 Requested Range Not Satisfiable` responses:

- `GET /rest/v1/spaces?select=id,name,invite_code,created_by,created_at&created_by=eq.0734cf0a-57b8-4909-9c6b-3bedc6ebb4b8&order=created_at.asc`
- `GET /rest/v1/space_members?select=space_id,user_id,display_name,role,joined_at&user_id=eq.0734cf0a-57b8-4909-9c6b-3bedc6ebb4b8&order=joined_at.asc`
- `POST /rest/v1/rpc/ensure_bound_space_memberships`
- `POST /rest/v1/rpc/create_personal_space`

Observed Node-probe response pattern:

- status: `416`
- status text: `Requested Range Not Satisfiable`
- body: empty
- `content-range`: null

## Current Interpretation

This should no longer be treated as evidence that the browser product is broken.

The more accurate interpretation is:

- browser mainline behavior is currently good
- database-side private visibility rules are currently good
- the mismatch is limited to the standalone Node-based diagnostic path

Most likely remaining failure surfaces are now one of:

- the raw request shape in `private-visibility-regression.mjs`
- a Node-specific auth/session/header mismatch in the script
- a publishable-key / fetch-path difference between the browser client and the script
- an environment/proxy behavior specific to the script path

## What This File Is For Now

Use this file to track the script/tooling inconsistency only.

Do not use it as the current source of truth for user-facing product availability.

## Browser Truth Anchors

- Supabase client initialization: [app/src/lib/supabase.ts](app/src/lib/supabase.ts#L1)
- OTP send/verify browser path: [app/src/stores/auth.ts](app/src/stores/auth.ts#L693) and [app/src/stores/auth.ts](app/src/stores/auth.ts#L752)
- Space bootstrap orchestration: [app/src/stores/auth.ts](app/src/stores/auth.ts#L448)
- Browser cloud-mode indicator: [app/src/App.vue](app/src/App.vue#L15)
- Private wish RLS baseline: [app/supabase/migrations/202604260001_initial_schema.sql](app/supabase/migrations/202604260001_initial_schema.sql#L248)

## Relevant Workspace Files

- [app/scripts/private-visibility-regression.mjs](app/scripts/private-visibility-regression.mjs)
- [app/supabase/diagnostics/20260512_feature_impact_matrix.md](app/supabase/diagnostics/20260512_feature_impact_matrix.md)
- [app/supabase/diagnostics/20260512_space_bootstrap_probe.sql](app/supabase/diagnostics/20260512_space_bootstrap_probe.sql)
- [app/supabase/diagnostics/20260512_space_members_visibility_probe.sql](app/supabase/diagnostics/20260512_space_members_visibility_probe.sql)