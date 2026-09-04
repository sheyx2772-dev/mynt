import { useQuery } from "@tanstack/react-query";

// The panel has no screens yet, and this one says so honestly.
//
// What it does do is exercise the whole chain the real screens will use: the
// browser asks this origin, Vite's proxy forwards /v1 to the Go backend, the
// backend asks Postgres, and the answer comes back. When that works, every
// piece of the plumbing is connected — and when it does not, this page says
// which end is quiet instead of a blank screen with a console error.

type Health = { ok: boolean; database: string };

function useBackendHealth() {
  return useQuery<Health>({
    queryKey: ["sogliq"],
    queryFn: async () => {
      const response = await fetch("/v1/sogliq");
      if (!response.ok) throw response;
      return response.json();
    },
    retry: false,
  });
}

export default function App() {
  const health = useBackendHealth();

  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-flex-black/40">Flex</p>
      <h1 className="mt-2 font-semibold text-3xl text-flex-black">Boshqaruv paneli</h1>
      <p className="mt-3 text-flex-black/60">
        Ekranlar hali yozilmagan. Bu sahifa faqat bitta narsani tekshiradi:
        panel backend bilan, backend esa baza bilan gaplasha oladimi.
      </p>

      <div className="mt-10 rounded-2xl border border-flex-black/10 p-6">
        <h2 className="font-medium text-sm text-flex-black/50">Ulanish</h2>

        {health.isPending && <p className="mt-3 text-flex-black/50">Tekshirilyapti…</p>}

        {health.isError && (
          <div className="mt-3">
            <p className="font-medium text-red-700">Backend javob bermadi.</p>
            <p className="mt-1 text-flex-black/60 text-sm">
              Uni ishga tushiring: <code className="rounded bg-flex-black/5 px-1.5 py-0.5">cd backend &amp;&amp; make db &amp;&amp; make dev</code>
            </p>
          </div>
        )}

        {health.data && (
          <div className="mt-3 flex items-center gap-3">
            <span className="inline-block size-2.5 rounded-full bg-lime" aria-hidden />
            <p className="text-flex-black">
              Backend ishlayapti, baza — <span className="text-lime-ink">{health.data.database}</span>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
