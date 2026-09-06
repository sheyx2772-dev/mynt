import PageShell from "@/components/PageShell";

// The cabinet opens after five queries and sometimes ten. Until this file
// existed, tapping a tile showed the previous screen until every one of them
// came back.
export default function Loading() {
  return (
    <PageShell surface="ink">
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-40 rounded-plate bg-ink-s2" />
        <div className="h-[7.5rem] w-full rounded-tile bg-ink-s2" />
        <div className="h-[7.5rem] w-full rounded-tile bg-ink-s2" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-24 rounded-card bg-ink-s2" />
          <div className="h-24 rounded-card bg-ink-s2" />
        </div>
      </div>
    </PageShell>
  );
}
