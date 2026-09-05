import type { ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// The small pieces every screen in the panel is built from — the ones shadcn
// does not have, because they are about this panel rather than about tables in
// general.

export function Stat({
	label,
	value,
}: {
	label: string;
	value: number | string;
}) {
	return (
		<Card>
			<CardContent>
				{/* Tabular figures, so a number changing does not shift the label under it. */}
				<p className="font-semibold text-3xl tabular-nums">{value}</p>
				<p className="mt-1 text-muted-foreground text-sm">{label}</p>
			</CardContent>
		</Card>
	);
}

/**
 * Rows in outline while they load. A shape that matches what is coming keeps
 * the page from jumping when it arrives — which a centred "loading…" does not.
 */
export function Waiting({ rows = 6 }: { rows?: number }) {
	return (
		<div className="space-y-2.5 py-2">
			{Array.from({ length: rows }, (_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no identity
				<Skeleton key={i} className="h-8 w-full" />
			))}
		</div>
	);
}

export function Empty({ children }: { children: ReactNode }) {
	return <p className="py-12 text-center text-muted-foreground">{children}</p>;
}

export function Failed({ children }: { children: ReactNode }) {
	return (
		<Alert variant="destructive">
			<AlertDescription>{children}</AlertDescription>
		</Alert>
	);
}
