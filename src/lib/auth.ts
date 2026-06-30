import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * Shared NextAuth configuration.
 *
 * Exported separately from the route handler so it can be reused by
 * `getServerSession(authOptions)` inside API routes / server components
 * to enforce authentication (the proxy/middleware only protects pages,
 * not the /api routes).
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const allowedDomain = process.env.ALLOWED_DOMAIN;

      // If ALLOWED_DOMAIN is set, restrict access. Otherwise allow all (for dev/setup).
      if (!allowedDomain) return true;

      if (user.email && user.email.endsWith(`@${allowedDomain}`)) {
        return true;
      }

      // Deny access if email doesn't match domain.
      return false;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect back to login on error (e.g. access denied)
  },
  secret: process.env.NEXTAUTH_SECRET,
};
