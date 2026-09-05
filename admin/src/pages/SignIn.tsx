import { useEffect, useState } from "react";

import { confirmLink, requestLink, signInWithPassword } from "../api/session";
import { Failed } from "../ui/parts";

// The panel's front door.
//
// The same door as everywhere else — an address, a link, a session — and no
// password of its own. Being on the allow-list is what makes an account an
// administrator, and that list lives on the server where nobody holding this
// bundle can read it. So an outsider who signs in here successfully still sees
// nothing, and is told nothing about what they cannot see.
export default function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [parol, setParol] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  // The link is the way back when a password is forgotten, and the way in
  // before one is set. It is not the everyday door, so it is behind a word.
  const [useLink, setUseLink] = useState(false);

  // A link opened in this browser lands here with the token in the query. It is
  // spent immediately and taken out of the address, because a token in a URL is
  // a token in the history and in whatever the next page's referrer carries.
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("t");
    if (!token) return;

    window.history.replaceState({}, "", window.location.pathname);
    confirmLink(token)
      .then(onSignedIn)
      .catch((error: Error) => setProblem(error.message));
  }, [onSignedIn]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setProblem("");

    try {
      if (useLink) {
        await requestLink(email.trim());
        setSent(true);
      } else {
        await signInWithPassword(email.trim(), parol);
        onSignedIn();
      }
    } catch (error) {
      setProblem((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <p className="text-xs uppercase tracking-[0.2em] text-flex-black/40">Flex</p>
      <h1 className="mt-2 font-semibold text-3xl">Boshqaruv</h1>

      {sent ? (
        <p className="mt-3 text-flex-black/60 leading-relaxed">
          {/* The server answers the same way whether the address has an account,
              so this must not claim more than the server said. */}
          Agar manzil to'g'ri bo'lsa, havola yuborildi. U 15 daqiqa amal qiladi.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="siz@example.com"
            autoComplete="email"
            className="w-full rounded-xl bg-flex-black/4 px-4 py-3 outline-none"
          />

          {!useLink && (
            <input
              type="password"
              value={parol}
              onChange={(e) => setParol(e.target.value)}
              placeholder="Parol"
              // Named so a password manager fills the right field and offers to
              // save a new one when it is changed.
              autoComplete="current-password"
              className="mt-3 w-full rounded-xl bg-flex-black/4 px-4 py-3 outline-none"
            />
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-3 w-full rounded-xl bg-lime py-3 font-medium text-flex-black disabled:opacity-50"
          >
            {busy ? "Kutilmoqda…" : useLink ? "Havola yuborish" : "Kirish"}
          </button>

          <button
            type="button"
            onClick={() => {
              setUseLink(!useLink);
              setProblem("");
            }}
            className="mt-4 w-full text-flex-black/45 text-sm transition-colors hover:text-flex-black"
          >
            {useLink
              ? "Parol bilan kirish"
              : "Parolni unutdingizmi? Havola bilan kiring"}
          </button>
        </form>
      )}

      {problem && <Failed>{problem}</Failed>}
    </main>
  );
}
