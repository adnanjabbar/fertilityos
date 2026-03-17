# PWA and Mobile Readiness (Phase 9.1)

FertilityOS can be installed as a Progressive Web App (PWA) on mobile and desktop for quick access and limited offline use.

## What’s Included

- **Web App Manifest** (`/public/manifest.json`) — Name, short name, start URL (`/app/dashboard`), display mode `standalone`, theme and background colors, icon references.
- **Service worker** (`/public/sw.js`) — Caches the app shell and dashboard. On fetch failure for `/app/*`, returns cached dashboard or an offline response. Cache key: `fertilityos-v1`; bump the version in `sw.js` when you want to invalidate caches.
- **Offline page** (`/app/offline/page.tsx`) — Shown when a non-cached app route is requested while offline; includes a link back to the dashboard.
- **Registration** — `PwaRegister` in `Providers` registers the service worker on the client. No install prompt is shown by default; users can “Add to Home Screen” / “Install” from the browser menu.

## Icons

The manifest references `/icon-192.png` and `/icon-512.png` in the site’s `public` folder. Icons are included in `public/` (icon-512.png is used for both sizes; browsers scale for 192). Replace with your own 192×192 and 512×512 PNGs for custom branding.

Suggested content (if replacing): FertilityOS logo or “F” mark on a blue–teal gradient background, with safe padding for maskable icons.

## Responsive and Touch

- Layouts use Tailwind breakpoints (`sm`, `md`, `lg`) and the sidebar collapses to a hamburger on small screens.
- Interactive targets (buttons, nav items) use minimum touch height (e.g. `min-h-[44px]`) where appropriate.
- Viewport meta is set in root layout (`width=device-width`, `initialScale=1`, `maximumScale=5`).

## Optional: Push Notifications

Phase 9.1 does not implement push notifications. To add them later:

1. Request notification permission and subscribe the user (e.g. in dashboard or settings).
2. Store the subscription (e.g. `endpoint`, `keys`) per user or tenant.
3. Use a backend job or webhook to send pushes (e.g. appointment reminders) via Web Push (VAPID).
4. Respect tenant and user preferences (e.g. “remind by push”) and permission state.

## Testing

- **Chrome DevTools** → Application → Service Workers: verify registration and cache.
- **Lighthouse** → Progressive Web App: check manifest, service worker, and installability.
- **Device** — Use “Add to Home Screen” (iOS) or “Install app” (Chrome/Edge) and confirm standalone display and offline behavior for the dashboard.

## Documentation

- [Phase 9 handoff](../System-Architecture/Planning/phase-9-handoff.md) — Overall Phase 9 scope.
- [Next steps](../System-Architecture/Planning/next-steps-development.md) — Roadmap and completion notes.
