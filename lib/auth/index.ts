// lib/auth.ts
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/drizzle";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
  profile,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  providers: [
    Credentials({
      name: "Email y contraseña",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      // Correct the function signature here
      async authorize(credentials) {
        // 1. Validate the credentials object and its properties
        if (
          !credentials ||
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          throw new Error("CredentialsSignin");
        }

        // 2. Use the validated credentials
        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        if (!email || !password) {
          throw new Error("CredentialsSignin");
        }

        const rows = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        const u = rows[0];

        if (!u || !u.passwordHash) {
          // user not found or is OAuth-only
          throw new Error("CredentialsSignin");
        }

        const ok = await bcrypt.compare(password, u.passwordHash);
        if (!ok) throw new Error("CredentialsSignin");

        // return minimal user object
        return {
          id: u.id,
          name: u.name ?? u.email ?? "Usuario",
          email: u.email!,
          image: u.image ?? null,
          role: u.role,
        };
      },
    }),
  ],

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    newUser: "/auth/setup",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async signIn({ user }) {
      return true;
    },

    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }

      if (user?.id) {
        token.id = user.id;

        // fetch role & whether profile exists
        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);
        if (dbUser[0]) {
          token.role = dbUser[0].role;

          const userProfile = await db
            .select()
            .from(profile)
            .where(eq(profile.userId, user.id))
            .limit(1);

          token.hasProfile = userProfile.length > 0;
        }
      }
      return token as any;
    },

    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "player";
        session.user.hasProfile = (token.hasProfile as boolean) || false;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User ${user.email} signed in with ${account?.provider}`);
      if (isNewUser && user.id) {
        try {
          const existingProfile = await db
            .select()
            .from(profile)
            .where(eq(profile.userId, user.id))
            .limit(1);

          if (existingProfile.length === 0 && user.name) {
            const [firstName, ...rest] = user.name.split(" ");
            const lastName = rest.join(" ");
            await db.insert(profile).values({
              userId: user.id,
              firstName: firstName || "",
              lastName: lastName || "",
              avatarUrl: user.image as string | null,
            });
          }
        } catch (err) {
          console.error("Error creating profile:", err);
        }
      }
    },

    async createUser({ user }) {
      console.log(`New user created: ${user.email}`);
    },
  },

  debug: process.env.NODE_ENV === "development",
  trustHost: true,
});

// --- module augmentation (keep yours) ---
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      hasProfile: boolean;
    };
  }
  interface User {
    role: string;
  }
}
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: string;
    hasProfile: boolean;
  }
}
