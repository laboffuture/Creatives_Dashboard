import middleware from "next-auth/middleware";
export default middleware;

export const config = {
  // Protect all routes except the login page, api routes, and static assets
  matcher: [
    "/((?!login|api|_next/static|_next/image|favicon.ico).*)",
  ],
}
