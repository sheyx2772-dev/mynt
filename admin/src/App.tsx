import { useCallback, useEffect, useState } from "react";

import { signOut, whoAmI } from "./api/session";
import Accounts from "./pages/Accounts";
import Give from "./pages/Give";
import Handles from "./pages/Handles";
import Orders from "./pages/Orders";
import Overview from "./pages/Overview";
import Promo from "./pages/Promo";
import SignIn from "./pages/SignIn";
import { Waiting } from "./ui/parts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
	{ id: "umumiy", label: "Umumiy", view: <Overview /> },
	{ id: "buyurtmalar", label: "Buyurtmalar", view: <Orders /> },
	{ id: "raqamlar", label: "Raqamlar", view: <Handles /> },
	{ id: "hisoblar", label: "Hisoblar", view: <Accounts /> },
	{ id: "sovga", label: "Sovg'a", view: <Give /> },
	{ id: "promokod", label: "Promokod", view: <Promo /> },
] as const;

// The panel, which is six screens and a sign-in.
//
// Tabs rather than routes: nothing here is linked to from anywhere, nothing is
// bookmarked, and a router for six screens behind one login is machinery with
// no work to do.
export default function App() {
	const [email, setEmail] = useState<string | null>(null);
	const [checking, setChecking] = useState(true);

	const check = useCallback(() => {
		whoAmI()
			.then((account) => setEmail(account?.email ?? null))
			.finally(() => setChecking(false));
	}, []);

	useEffect(check, [check]);

	if (checking) return <Waiting rows={3} />;
	if (!email) return <SignIn onSignedIn={check} />;

	return (
		<div className="mx-auto max-w-5xl px-6 py-10">
			<header className="flex items-baseline justify-between gap-4">
				<div>
					<p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
						Flex
					</p>
					<h1 className="mt-1 font-semibold text-2xl">Boshqaruv</h1>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => signOut().then(() => setEmail(null))}
				>
					{email} · chiqish
				</Button>
			</header>

			{/* Every screen is mounted only while it is shown: each one holds a query,
          and six queries running behind one visible table is six tables' worth
          of load for one table's worth of reading. */}
			<Tabs defaultValue={TABS[0].id} className="mt-8">
				<TabsList>
					{TABS.map((t) => (
						<TabsTrigger key={t.id} value={t.id}>
							{t.label}
						</TabsTrigger>
					))}
				</TabsList>

				{TABS.map((t) => (
					<TabsContent key={t.id} value={t.id} className="mt-6">
						{t.view}
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}
