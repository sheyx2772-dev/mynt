import { useCallback, useEffect, useState } from "react";

import { signOut, whoAmI } from "./api/session";
import Give from "./pages/Give";
import Handles from "./pages/Handles";
import Orders from "./pages/Orders";
import Overview from "./pages/Overview";
import SignIn from "./pages/SignIn";
import { Waiting } from "./ui/parts";

const TABS = [
  { id: "umumiy", label: "Umumiy", view: <Overview /> },
  { id: "buyurtmalar", label: "Buyurtmalar", view: <Orders /> },
  { id: "raqamlar", label: "Raqamlar", view: <Handles /> },
  { id: "sovga", label: "Sovg'a", view: <Give /> },
] as const;

// The panel, which is four screens and a sign-in.
//
// Tabs rather than routes: nothing here is linked to from anywhere, nothing is
// bookmarked, and a router for four screens behind one login is machinery with
// no work to do.
export default function App() {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<string>(TABS[0].id);

  const check = useCallback(() => {
    whoAmI()
      .then((account) => setEmail(account?.email ?? null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(check, [check]);

  if (checking) return <Waiting />;
  if (!email) return <SignIn onSignedIn={check} />;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-flex-black/40">Flex</p>
          <h1 className="mt-1 font-semibold text-2xl">Boshqaruv</h1>
        </div>
        <button
          type="button"
          onClick={() => signOut().then(() => setEmail(null))}
          className="text-flex-black/45 text-sm transition-colors hover:text-flex-black"
        >
          {email} · chiqish
        </button>
      </header>

      <nav className="mt-8 flex gap-1 border-flex-black/10 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 pb-2.5 text-sm transition-colors ${
              tab === t.id
                ? "border-lime font-medium text-flex-black"
                : "border-transparent text-flex-black/45 hover:text-flex-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="mt-8">{TABS.find((t) => t.id === tab)?.view}</main>
    </div>
  );
}
