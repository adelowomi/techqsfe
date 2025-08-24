import { PrismaAdapter } from "@auth/prisma-adapter";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";

import { db } from "~/server/db";
import { getUserByEmail } from "~/lib/auth-utils";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			role: "HOST" | "PRODUCER" | "ADMIN";
		} & DefaultSession["user"];
	}

	interface User {
		role: "HOST" | "PRODUCER" | "ADMIN";
	}
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
	providers: [
		Credentials({
			name: "credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" }
			},
			async authorize(credentials) {
				const parsedCredentials = z
					.object({ email: z.string().email(), password: z.string().min(6) })
					.safeParse(credentials);

				if (parsedCredentials.success) {
					const { email, password } = parsedCredentials.data;
					const user = await getUserByEmail(email);

					if (!user || !user.password) return null;

					const passwordsMatch = await compare(password, user.password);
					if (passwordsMatch) {
						return {
							id: user.id,
							email: user.email,
							name: user.name,
							role: user.role,
						};
					}
				}
				return null;
			},
		}),
	],
	adapter: PrismaAdapter(db) as any,
	callbacks: {
		session: ({ session, token }) => ({
			...session,
			user: {
				...session.user,
				id: token.sub!,
				role: ((token as any).role as "HOST" | "PRODUCER" | "ADMIN") || "HOST",
			},
		}),
		jwt: async ({ token, user }) => {
			if (user) {
				(token as any).role = user.role;
			} else if (token.sub && !(token as any).role) {
				// Fetch user role from database if not in token
				const dbUser = await db.user.findUnique({
					where: { id: token.sub },
					select: { role: true },
				});
				if (dbUser) {
					(token as any).role = dbUser.role;
				}
			}
			return token;
		},
	},
} satisfies NextAuthConfig;
