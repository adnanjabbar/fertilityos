# Native Mobile Apps — Exploration (Phase 9.5)

This document captures the current stance on native mobile apps for FertilityOS and how the API can support them.

## Current State

- **PWA (Phase 9.1):** The web app is installable as a PWA. Staff can “Add to Home Screen” and use the dashboard with limited offline support. No native app is required for basic mobile access.
- **API:** All app functionality is driven by REST APIs under `/api/app/*`. Authentication is session-based (NextAuth cookies). The same APIs are used by the web app and can be consumed by a mobile client that maintains a session (e.g. via WebView login or a future token-based flow).

## Options for Native Apps

### 1. React Native (Expo)

- **Pros:** Single codebase (JS/TS), shared logic with web possible, large ecosystem, Expo for builds and OTA.
- **Cons:** Bridge overhead, some native modules may be needed for HIPAA-sensitive features (e.g. secure storage).

### 2. Flutter

- **Pros:** Single codebase (Dart), performant, good for custom UI.
- **Cons:** Different language from the rest of the stack, team may need to learn Dart.

### 3. WebView Wrapper (Capacitor, Cordova)

- **Pros:** Reuse existing web app with minimal changes; one codebase.
- **Cons:** Less “native” feel and performance; still subject to WebView limits.

### 4. Stay PWA-Only

- **Pros:** No extra codebase; installable and offline-capable already.
- **Cons:** No push notifications (without extra work), no app-store presence, some platform limitations.

## Recommendation (Phase 9)

- **Short term:** Rely on the PWA for mobile. Improve responsive and touch UX; document install flow.
- **Medium term:** If app-store presence or push is required, a **React Native (Expo)** app that reuses the same REST APIs is a reasonable next step. Alternatively, a **Capacitor** wrapper around the existing web app can ship quickly.
- **API contract:** Keep APIs stable and versioned. Use a prefix like `/api/v1/` if you introduce breaking changes later. Document auth (session cookie vs. future bearer token) for mobile clients.

## API Stability and Versioning

- Today, app routes use `/api/app/...` with no version segment. Mobile clients would call the same URLs.
- For future breaking changes, introduce `/api/v1/app/...` (or similar) and keep v1 stable while v2 evolves.
- Sensitive operations (e.g. patient list, export) are already audited; mobile clients will generate the same audit entries when using the same APIs.

## References

- [Phase 9 handoff](../System-Architecture/Planning/phase-9-handoff.md)
- [PWA and mobile](./PWA-AND-MOBILE.md)
