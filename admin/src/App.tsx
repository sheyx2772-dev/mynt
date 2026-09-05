import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router";

import { signOut, whoAmI } from "./api/session";
import Accounts from "./pages/Accounts";
import Gifts from "./pages/Gifts";
import Handles from "./pages/Handles";
import Orders from "./pages/Orders";
import Overview from "./pages/Overview";
import Promo from "./pages/Promo";
import SignIn from "./pages/SignIn";
import { Waiting } from "./ui/parts";
import { Shell } from "./ui/shell";

// The panel: a sign-in, and six screens behind it.
//
// Routes rather than tab state, now that the sections are down the side: a
// section is a place, the address bar should say which one, and reloading
// while looking at Buyurtmalar should come back to Buyurtmalar.
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
		<BrowserRouter>
			<Routes>
				<Route
					element={
						<Shell
							email={email}
							onSignOut={() => signOut().then(() => setEmail(null))}
						/>
					}
				>
					<Route index element={<Overview />} />
					<Route path="buyurtmalar" element={<Orders />} />
					<Route path="raqamlar" element={<Handles />} />
					<Route path="hisoblar" element={<Accounts />} />
					<Route path="sovga" element={<Gifts />} />
					<Route path="promokod" element={<Promo />} />
					{/* A stale bookmark lands on the front page rather than on nothing. */}
					<Route path="*" element={<Overview />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
}
