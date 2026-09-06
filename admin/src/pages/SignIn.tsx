import { useState } from "react";

import { signInWithPassword } from "../api/session";
import { Failed } from "../ui/parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// The panel's front door, and the only one.
//
// An address and a password. There used to be a second way in — the panel
// could mail itself a link — and it is gone on purpose: an emailed link is a
// door that opens for whoever reads the mailbox, and this panel gives away
// numbers worth millions and shows every buyer's address. A handful of
// operators do not need a self-service way back in; they need one fewer way
// in.
//
// So a forgotten password is fixed where the server is, with `cmd/admin`,
// which asks for the new one on the terminal and never takes it as an
// argument. That is slower, and it is slower for one person once rather than
// open for everybody always.
//
// Signing in is still not what makes an administrator: the allow-list on the
// server does. An outsider who guesses a password here sees nothing, and is
// told nothing about what they cannot see.
export default function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
	const [email, setEmail] = useState("");
	const [parol, setParol] = useState("");
	const [busy, setBusy] = useState(false);
	const [problem, setProblem] = useState("");

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		setBusy(true);
		setProblem("");

		try {
			await signInWithPassword(email.trim(), parol);
			onSignedIn();
		} catch (error) {
			setProblem((error as Error).message);
		} finally {
			setBusy(false);
		}
	}

	return (
		<main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
			<p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
				Flex
			</p>
			<h1 className="mt-2 font-semibold text-3xl">Boshqaruv</h1>

			<form onSubmit={submit} className="mt-6 space-y-3">
				<Input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="siz@example.com"
					autoComplete="username"
					className="h-11"
				/>

				<Input
					type="password"
					value={parol}
					onChange={(e) => setParol(e.target.value)}
					placeholder="Parol"
					// Named so a password manager fills the right field and offers to
					// save a new one when it is changed.
					autoComplete="current-password"
					className="h-11"
				/>

				<Button type="submit" disabled={busy} className="h-11 w-full">
					{busy ? "Kutilmoqda…" : "Kirish"}
				</Button>
			</form>

			{problem && (
				<div className="mt-4">
					<Failed>{problem}</Failed>
				</div>
			)}
		</main>
	);
}
