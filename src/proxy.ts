import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const publicPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export async function proxy(request: NextRequest) {
  const { response, supabase } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Check if the path is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if accessing protected route without session
  if (!session && !isPublicPath && pathname !== "/") {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to home if accessing auth pages while logged in
  if (session && isPublicPath) {
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
