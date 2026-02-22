# Final Maintenance Guide

This project is in maintenance-first mode:
- No planned feature expansion.
- Only security, compatibility, and incident fixes.
- Keep release quality stable across desktop platforms.

## Maintenance Scope

Apply changes only when at least one condition is true:
- Critical bug (startup crash, data loss risk, broken proxy routing).
- Security issue (credential leakage, auth bypass, dependency vulnerability).
- Platform/runtime breakage (Tauri, OS, upstream API contract change).

Out of scope:
- New product features.
- Large UI redesign.
- Protocol expansion without hard operational need.

## Release Checklist

Before cutting a maintenance release:
1. Run frontend checks: `npm run check` and `npm run build`.
2. Run backend checks: `cargo check --manifest-path src-tauri/Cargo.toml` and `cargo test --manifest-path src-tauri/Cargo.toml --lib`.
3. Validate app startup and proxy lifecycle:
   - Open app.
   - Start/stop proxy.
   - Add/switch/remove account.
   - Verify monitor page can load logs.
4. Smoke test protocol compatibility:
   - OpenAI endpoint (`/v1/chat/completions`)
   - Anthropic endpoint (`/v1/messages`)
   - Gemini endpoint (`/v1beta/models/...`)
5. Confirm migration safety:
   - Existing `gui_config.json` loads.
   - Existing account files are readable.

## Emergency Rollback

If a maintenance release is unstable:
1. Stop release propagation.
2. Re-publish previous known-good version.
3. Keep user data untouched:
   - `gui_config.json`
   - `accounts/*.json`
   - `proxy_logs.db`
4. Patch forward only after reproducing and adding a regression test.

## Dependency Update Policy

- Prefer patch-level updates only.
- Minor/major updates require explicit justification and smoke test evidence.
- Update lockfiles only when needed for a validated maintenance fix.
