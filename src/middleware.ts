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

function checkAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get("pb_auth");
  if (!authCookie?.value) return false;

  try {
    const authData = JSON.parse(decodeURIComponent(authCookie.value));
    if (authData.token) {
      const parts = authData.token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        return payload.exp * 1000 > Date.now();
      }
    }
  } catch {
    // Invalid cookie
  }
  return false;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authenticated = checkAuthenticated(request);
  const isPublic = isPublicPath(pathname);

  // Redirect unauthenticated users to login (except public paths and root)
  if (!authenticated && !isPublic && pathname !== "/") {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  if (authenticated && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Let intl middleware handle locale detection/routing
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json|icons/|api/|pb/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
