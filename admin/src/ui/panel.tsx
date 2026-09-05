import type { ReactNode } from "react";

import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";

// A panel that slides over the table it was opened from.
//
// A panel and not a page: the question being answered is usually about a row in
// a list ("why is this one still pending"), and taking the list away to answer
// it means finding the row again afterwards. Escape, the overlay and the close
// button all shut it, and the page underneath is frozen while it is open —
// Radix handles all of that, which is most of why shadcn is here.
export function Panel({
	eyebrow,
	title,
	onClose,
	children,
}: {
	eyebrow: string;
	title: ReactNode;
	onClose: () => void;
	children: ReactNode;
}) {
	return (
		<Sheet open onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
				<SheetHeader className="pb-0">
					<p className="text-muted-foreground text-xs uppercase tracking-[0.15em]">
						{eyebrow}
					</p>
					<SheetTitle className="font-semibold text-2xl">{title}</SheetTitle>
				</SheetHeader>

				<div className="px-4 pb-6">{children}</div>
			</SheetContent>
		</Sheet>
	);
}

/** One label-and-value line, as the panels write them. */
export function Row({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<div className="flex justify-between gap-4">
			<dt className="shrink-0 text-muted-foreground">{label}</dt>
			<dd className="text-right">{children}</dd>
		</div>
	);
}
