import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { LandingPage } from "~/app/_components/landing-page";

export default async function Home() {
	const session = await auth();

	return (
		<HydrateClient>
			<LandingPage
				isAuthenticated={!!session?.user}
				user={session?.user ? {
					id: session.user.id,
					name: session.user.name,
					email: session.user.email,
					role: session.user.role,
				} : null}
			/>
		</HydrateClient>
	);
}
