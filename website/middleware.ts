import { NextResponse } from "next/server";
import { auth } from "@/auth";

const authPagePaths = ["/login", "/register"];
const portalPublicPaths = ["/portal/login", "/portal/verify"];
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

export default auth((req) => {
  const hostname = req.nextUrl.hostname;
  const slug = getSubdomainSlug(hostname);
  const requestHeaders = new Headers(req.headers);
  if (slug) requestHeaders.set("x-tenant-slug", slug);

  const isApp = req.nextUrl.pathname.startsWith("/app");
  const isPortal = req.nextUrl.pathname.startsWith("/portal");
  const isPortalPublic = portalPublicPaths.some((p) => req.nextUrl.pathname === p || req.nextUrl.pathname.startsWith(p + "/"));
  const isAuthPage = authPagePaths.includes(req.nextUrl.pathname);
  const isLoggedIn = !!req.auth;

  if (isApp && !isLoggedIn) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  const isSuperPath = req.nextUrl.pathname.startsWith("/app/super");
  if (isSuperPath && isLoggedIn && req.auth?.user?.roleSlug !== "super_admin") {
    return NextResponse.redirect(new URL("/app/dashboard", req.nextUrl.origin));
  }

  if (isAuthPage && isLoggedIn) {
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
  matcher: ["/app/:path*", "/portal/:path*", "/login", "/register"],
};
