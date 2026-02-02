import { type NextRequest, NextResponse } from "next/server";
import { pb } from "@/lib/pocketbase";

const publicPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const { pathname } = request.nextUrl;

  // Check if the path is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Check PocketBase auth from cookie
  const authCookie = request.cookies.get("pb_auth");
  let isAuthenticated = false;

  if (authCookie?.value) {
    try {
      const authData = JSON.parse(authCookie.value);
      if (authData.token) {
        pb.authStore.save(authData.token, authData.record);
        isAuthenticated = pb.authStore.isValid;
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

  // Redirect to home if accessing auth pages while logged in
  if (isAuthenticated && isPublicPath) {
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
