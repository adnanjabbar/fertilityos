import { NextResponse } from "next/server";
import { auth } from "@/auth";

const authPagePaths = ["/login", "/register"];
const portalPublicPaths = ["/portal/login", "/portal/verify", "/portal/set-password", "/portal/reset-password"];
const ROOT_DOMAIN = "thefertilityos.com";

function getSubdomainSlug(hostname: string): string | null {
  const parts = hostname.split(".");
  if (parts.length < 2) return null;
  const first = parts[0].toLowerCase();
  if (first === "www" || first === "api") return null;
  const base = parts.slice(-2).join(".");
  if (base === ROOT_DOMAIN) return first;
  if (parts[parts.length - 1] === "localhost" && parts.length >= 2) return first;
  return null;
}

const CANONICAL_HOST = "www.thefertilityos.com";

/** Until wildcard DNS exists for *.{ROOT_DOMAIN}, set DISABLE_TENANT_SUBDOMAIN_REDIRECT=1 so clinic users stay on www. */
function tenantSubdomainRedirectDisabled() {
  const v = process.env.DISABLE_TENANT_SUBDOMAIN_REDIRECT;
  return v === "1" || v === "true";
}

export default auth((req) => {
  const hostname = req.nextUrl.hostname;
  // Normalize thefertilityos.com → www so the document always loads from www (avoids CORS on RSC/fetch)
  if (hostname === "thefertilityos.com" && (req.method === "GET" || req.method === "HEAD")) {
    const url = new URL(req.nextUrl.pathname + req.nextUrl.search, `https://${CANONICAL_HOST}`);
    return NextResponse.redirect(url, 308);
  }

  const slug = getSubdomainSlug(hostname);
  const requestHeaders = new Headers(req.headers);
  if (slug) requestHeaders.set("x-tenant-slug", slug);

  const isApp = req.nextUrl.pathname.startsWith("/app");
  const isPortal = req.nextUrl.pathname.startsWith("/portal");
  const isPortalPublic = portalPublicPaths.some((p) => req.nextUrl.pathname === p || req.nextUrl.pathname.startsWith(p + "/"));
  const isAuthPage = authPagePaths.includes(req.nextUrl.pathname);
  // Auth.js v5 on some non-Vercel edge environments can intermittently fail to
  // populate req.auth even when a valid session cookie exists. Use cookie
  // presence as a fallback so successful sign-ins do not bounce back to /login.
  const hasSessionCookie =
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-next-auth.session-token") ||
    req.cookies.has("next-auth.session-token");
  const isLoggedIn = !!req.auth || hasSessionCookie;

  // Auth V2: Tenants always log in on www, then get routed to their tenant subdomain.
  // Super-admin stays on www. Requires DNS: *.thefertilityos.com → your host (or set DISABLE_TENANT_SUBDOMAIN_REDIRECT).
  if (
    !tenantSubdomainRedirectDisabled() &&
    hostname === CANONICAL_HOST &&
    !!req.auth &&
    isApp &&
    req.auth.user.roleSlug !== "super_admin"
  ) {
    const tSlug = (req.auth?.user as { tenantSlug?: string })?.tenantSlug;
    if (tSlug && tSlug !== "system") {
      const target = new URL(req.nextUrl.pathname + req.nextUrl.search, `https://${tSlug}.${ROOT_DOMAIN}`);
      return NextResponse.redirect(target, 307);
    }
  }

  if (isApp && !isLoggedIn) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  const isSuperPath = req.nextUrl.pathname.startsWith("/app/super");
  if (isSuperPath && !!req.auth && req.auth.user.roleSlug !== "super_admin") {
    return NextResponse.redirect(new URL("/app/dashboard", req.nextUrl.origin));
  }

  if (isAuthPage && !!req.auth) {
    return NextResponse.redirect(new URL("/app/dashboard", req.nextUrl.origin));
  }

  if (isPortal) {
    if (isPortalPublic) {
      if (isLoggedIn && req.auth?.user?.roleSlug === "patient") {
        return NextResponse.redirect(new URL("/portal", req.nextUrl.origin));
      }
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    if (!isLoggedIn) {
      const login = new URL("/portal/login", req.nextUrl.origin);
      login.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(login);
    }
    if (req.auth?.user?.roleSlug !== "patient") {
      return NextResponse.redirect(new URL("/app/dashboard", req.nextUrl.origin));
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: ["/", "/app/:path*", "/portal/:path*", "/login", "/register", "/offline"],
};
