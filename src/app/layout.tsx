import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { SessionProviderWrapper } from "~/app/_components/session-provider";
import { auth } from "~/server/auth";

export const metadata: Metadata = {
	title: "TechQS - Authentication System",
	description: "A modern authentication system built with Next.js, NextAuth, and Prisma",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default async function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await auth();

	return (
		<html lang="en" className={`${geist.variable}`}>
			<body>
				<SessionProviderWrapper session={session}>
					<TRPCReactProvider>{children}</TRPCReactProvider>
				</SessionProviderWrapper>
			</body>
		</html>
	);
}
