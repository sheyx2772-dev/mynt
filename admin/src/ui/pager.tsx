import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

// Moving between pages of a list.
//
// Numbers rather than "load more": this is a table somebody works through, and
// the question is often "was it near the start" rather than "what is next".
export function Pager({
	total,
	skip,
	size,
	onSkip,
}: {
	total: number;
	skip: number;
	size: number;
	onSkip: (skip: number) => void;
}) {
	const pages = Math.ceil(total / size);
	if (pages <= 1) return null;

	const current = Math.floor(skip / size);

	// The pager sits under fifty rows, so changing page from here would otherwise
	// leave the reader at the bottom of the new page, looking at its last rows.
	const go = (page: number) => {
		onSkip(page * size);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<div className="mt-5 flex items-center justify-between gap-4 text-sm">
			<p className="text-muted-foreground tabular-nums">
				{skip + 1}–{Math.min(skip + size, total)} / {total}
			</p>

			<div className="flex items-center gap-1">
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Oldingi"
					disabled={current === 0}
					onClick={() => go(current - 1)}
				>
					<ChevronLeft />
				</Button>

				{window_(current, pages).map((page, i) =>
					page === null ? (
						// A gap, not a button: with two hundred pages the row would
						// otherwise be longer than the table above it.
						// biome-ignore lint/suspicious/noArrayIndexKey: gaps have no identity
						<span key={`gap-${i}`} className="px-1 text-muted-foreground">
							…
						</span>
					) : (
						<Button
							key={page}
							variant={page === current ? "default" : "ghost"}
							size="icon-sm"
							onClick={() => go(page)}
							aria-current={page === current ? "page" : undefined}
							className="tabular-nums"
						>
							{page + 1}
						</Button>
					),
				)}

				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Keyingi"
					disabled={current >= pages - 1}
					onClick={() => go(current + 1)}
				>
					<ChevronRight />
				</Button>
			</div>
		</div>
	);
}

/**
 * The page numbers to show: always the first and last, always the two either
 * side of the current one, and a `null` wherever a run was left out. The width
 * is fixed, so the row does not grow as the table does.
 */
function window_(current: number, pages: number): (number | null)[] {
	const keep = new Set<number>([0, pages - 1]);
	for (let p = current - 1; p <= current + 1; p++) {
		if (p >= 0 && p < pages) keep.add(p);
	}

	const out: (number | null)[] = [];
	let last = -1;
	for (const page of [...keep].sort((a, b) => a - b)) {
		// A single missing page is written out rather than hidden behind an
		// ellipsis that takes the same room.
		if (page - last === 2) out.push(last + 1);
		else if (page - last > 2) out.push(null);
		out.push(page);
		last = page;
	}
	return out;
}
