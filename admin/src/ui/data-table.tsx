import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

/**
 * How a list is ordered: a column name the API knows, and a direction.
 *
 * `K` is that endpoint's own set of names, taken from the generated schema, so
 * a column sorted by a name the server does not have fails `npm run build`
 * rather than quietly coming back in the default order.
 */
export type Sort<K extends string = string> = { key: K; desc: boolean };

export type Column<T, K extends string = string> = {
	/** The name the API sorts by. Omitted means the column cannot be sorted. */
	key?: K;
	header: string;
	cell: (row: T) => ReactNode;
	/** Numbers and dates read newest-and-largest first; names read A–Z first. */
	descFirst?: boolean;
	className?: string;
};

/**
 * A table with sortable headers.
 *
 * The sorting is the server's, not this component's: the rows on screen are
 * one page of many, and a table that reordered only the fifty rows it happens
 * to hold would put the largest number on page three and call it the top.
 * So a header click changes the query, and the whole list reorders.
 */
export function DataTable<T, K extends string>({
	columns,
	rows,
	rowKey,
	sort,
	onSort,
	onRowClick,
}: {
	columns: Column<T, K>[];
	rows: T[];
	rowKey: (row: T) => string;
	sort?: Sort<K>;
	onSort?: (sort: Sort<K>) => void;
	onRowClick?: (row: T) => void;
}) {
	const click = (column: Column<T, K>) => {
		if (!column.key || !onSort) return;
		// The same column flips direction; a different one starts the way that
		// column is usually read.
		onSort(
			sort?.key === column.key
				? { key: column.key, desc: !sort.desc }
				: { key: column.key, desc: column.descFirst ?? false },
		);
	};

	return (
		<div className="overflow-x-auto rounded-xl border">
			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						{columns.map((c) => (
							<TableHead key={c.header} className={c.className}>
								{c.key && onSort ? (
									<Button
										variant="ghost"
										size="sm"
										className="-ml-2.5 h-7 font-medium text-muted-foreground"
										onClick={() => click(c)}
									>
										{c.header}
										{sort?.key !== c.key ? (
											<ChevronsUpDown className="opacity-40" />
										) : sort.desc ? (
											<ArrowDown />
										) : (
											<ArrowUp />
										)}
									</Button>
								) : (
									c.header
								)}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>

				<TableBody>
					{rows.map((row) => (
						<TableRow
							key={rowKey(row)}
							onClick={onRowClick && (() => onRowClick(row))}
							className={onRowClick ? "cursor-pointer" : undefined}
						>
							{columns.map((c) => (
								<TableCell key={c.header} className={c.className}>
									{c.cell(row)}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
