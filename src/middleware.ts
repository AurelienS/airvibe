import { auth } from "@/auth";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set<string>(["/login"]);

export const middleware = auth((req: NextRequest & { auth?: unknown }) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname) && isLoggedIn) {
    return Response.redirect(new URL("/home", req.nextUrl));
  }

  // Allow Next.js internals and auth endpoints
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  ) {
    return;
  }

  if (!isLoggedIn && !PUBLIC_PATHS.has(pathname)) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("from", pathname);
    return Response.redirect(url);
  }
});

export default middleware;

export const config = {
  matcher: [],
};


