import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const userRole = req.auth?.user?.role;
  const hasProfile = req.auth?.user?.hasProfile;
  const hasPassword = req.auth?.user?.hasPassword;
  const role = req.auth?.user?.role;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/setup", "/error", "/api/auth"];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Allow access to public routes
  if (isPublicRoute) {
    // Redirect authenticated users away from signin page
    if (isLoggedIn && pathname.startsWith("/login")) {
      // But only if they have a password set
      if (hasPassword) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      // If they don't have a password, redirect to setup
      if (role === 'player' && !hasPassword) {
        return NextResponse.redirect(new URL("/setup", req.url));
      }
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to signin
  if (!isLoggedIn) {
    const signInUrl = new URL("/login", req.url);
    console.log("Redirected Login")
    return NextResponse.redirect(signInUrl);
  }

  // Redirect players without password to setup page (this is the main change)
  if (role === 'player' && !hasPassword && pathname !== "/setup") {
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  // Redirect players with password but without profile to setup page
  if (role === 'player' && hasPassword && !hasProfile && pathname !== "/setup") {
    console.log("Entered setup")
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  // Redirect players with both password and profile away from setup page
  if (role === 'player' && hasPassword && hasProfile && pathname === "/setup") {
    console.log("Redirected Home")
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};