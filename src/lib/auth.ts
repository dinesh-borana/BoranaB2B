import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      partyId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    partyId: string | null;
  }
}

const credentialsSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Mobile or email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { identifier, password } = parsed.data;
        const trimmed = identifier.trim();
        const user = await prisma.user.findFirst({
          where: trimmed.includes("@")
            ? { email: trimmed.toLowerCase() }
            : { mobile: trimmed },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? undefined,
          role: user.role,
          partyId: user.partyId,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
        token.partyId = (user as { partyId: string | null }).partyId ?? null;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.partyId = (token.partyId as string | null) ?? null;
      }
      return session;
    },
    authorized: async ({ auth: session, request }) => {
      const { pathname } = request.nextUrl;
      // Public routes — no auth required
      if (pathname.startsWith("/login")) return true;
      if (pathname.startsWith("/customer")) return true;
      if (pathname === "/") return true;
      // Admin routes require an authenticated admin
      if (pathname.startsWith("/admin")) {
        return session?.user?.role === "ADMIN";
      }
      // Everything else (API routes, etc.) requires a session
      return !!session;
    },
  },
});
