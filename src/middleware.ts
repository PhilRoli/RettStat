import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const publicPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/no-dev-access",
];

function isPublicPath(pathname: string): boolean {
  // Strip locale prefix if present
  const strippedPath = routing.locales.reduce(
    (p, locale) => (p.startsWith(`/${locale}/`) ? p.slice(locale.length + 1) : p),
    pathname
  );
  return publicPaths.some((path) => strippedPath.startsWith(path));
}

export default function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Let intl middleware handle locale detection/routing
  const response = intlMiddleware(request);

  // Check auth from cookie (Edge runtime can't use PocketBase SDK)
  const authCookie = request.cookies.get("pb_auth");
  let isAuthenticated = false;

  if (authCookie?.value) {
    try {
      const authData = JSON.parse(decodeURIComponent(authCookie.value));
      if (authData.token) {
        // Basic JWT expiration check in Edge runtime
        const parts = authData.token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          isAuthenticated = payload.exp * 1000 > Date.now();
        }
      }
    } catch {
      // Invalid cookie
    }
  }

  const isPublic = isPublicPath(pathname);

  // Redirect unauthenticated users to login (except public paths)
  if (!isAuthenticated && !isPublic && pathname !== "/") {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check dev environment access
  const isDevEnvironment = hostname.startsWith("dev.");
  if (isDevEnvironment && isAuthenticated && !isPublic && pathname !== "/no-dev-access") {
    // For dev access check we'd need the profile, which requires a DB call.
    // This is handled client-side in the app layout instead.
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json|icons/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
