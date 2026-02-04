import { type NextRequest, NextResponse } from "next/server";
import { getPb } from "@/lib/pocketbase";
import type { ProfileRecord } from "@/lib/pocketbase/types";

const publicPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/no-dev-access", // Allow access to no-dev-access page
];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const { pathname, hostname } = request.nextUrl;

  // Detect if this is the dev environment
  const isDevEnvironment = hostname.startsWith("dev.");

  // Check if the path is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Check PocketBase auth from cookie
  const authCookie = request.cookies.get("pb_auth");
  let isAuthenticated = false;
  let userProfile: ProfileRecord | null = null;

  if (authCookie?.value) {
    try {
      const authData = JSON.parse(authCookie.value);
      if (authData.token && authData.record) {
        getPb().authStore.save(authData.token, authData.record);
        isAuthenticated = getPb().authStore.isValid;

        // Get user profile to check dev_access
        if (isAuthenticated && authData.record.id) {
          try {
            userProfile = await getPb()
              .collection("profiles")
              .getFirstListItem<ProfileRecord>(`user="${authData.record.id}"`);
          } catch {
            // Profile not found, treat as no dev access
            userProfile = null;
          }
        }
      }
    } catch {
      // Invalid cookie, treat as not authenticated
    }
  }

  // Redirect to login if accessing protected route without session
  if (!isAuthenticated && !isPublicPath && pathname !== "/") {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check dev environment access
  if (isDevEnvironment && isAuthenticated && !isPublicPath && pathname !== "/no-dev-access") {
    // User is logged in but doesn't have dev access
    if (!userProfile?.dev_access) {
      return NextResponse.redirect(new URL("/no-dev-access", request.url));
    }
  }

  // Redirect to home if accessing auth pages while logged in
  if (isAuthenticated && isPublicPath && pathname !== "/no-dev-access") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
