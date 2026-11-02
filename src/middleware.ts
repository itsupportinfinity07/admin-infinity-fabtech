import { NextResponse, type NextRequest } from "next/server";

// Cheap presence check only. The cookie is cryptographically verified in
// requireUser() on every page, route handler and server action.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic =
    pathname.startsWith("/login") || pathname.startsWith("/api/auth") || pathname.startsWith("/api/img/");
  const hasSession = req.cookies.has("__session");

  if (!isPublic && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png).*)"] };
