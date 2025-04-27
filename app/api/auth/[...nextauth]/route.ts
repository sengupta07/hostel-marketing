import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// import GoogleProvider from 'next-auth/providers/google'; // Example provider
// import EmailProvider from 'next-auth/providers/email'; // Example provider
import { Adapter } from "next-auth/adapters"; // Import Adapter type
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter, // Cast PrismaAdapter to the expected Adapter type
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          // If user doesn't exist or doesn't have a password field
          if (!user || !user.password) {
            return null;
          }

          // Check if password matches
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            return null;
          }

          // Return user without password
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
    // Add other authentication providers here
    // Example:
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
    // EmailProvider({
    //   server: process.env.EMAIL_SERVER,
    //   from: process.env.EMAIL_FROM,
    // }),
  ],
  session: {
    strategy: "jwt", // Using JWT for session strategy is recommended
  },
  callbacks: {
    // Include user id and role in the session token (JWT)
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Ensure the role from the database is added to the token
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
    // Include user id and role in the session object accessible client-side
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any; // Cast to UserRole enum
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin", // Use our custom sign-in page
    // signOut: '/auth/signout', // Optional: Custom sign-out page
    error: "/auth/signin", // Redirect to sign-in page on error
    // verifyRequest: '/auth/verify-request', // Optional: Custom verify request page (for Email provider)
    // newUser: '/auth/new-user' // Optional: Redirect new users to a specific page
  },
  // Add other configurations like secret, debug options if needed
  secret: process.env.NEXTAUTH_SECRET, // Essential for production and JWT strategy
  // debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Add UserRole type to NextAuth types (important for session.user.role)
// Create a file like `types/next-auth.d.ts` and add the following:
/*
import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"
import { UserRole } from "@prisma/client" // Adjust import path if needed

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole; // Add role here
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: UserRole; // Add role here
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole; // Add role here
  }
}
*/
