import type { ReactNode } from "react";

import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

/**
 * A table with its column names, scrolling sideways rather than pushing the
 * page wide. Every list screen here is the same shape, so the shape is written
 * once.
 */
export function Rows({
	columns,
	children,
}: {
	columns: string[];
	children: ReactNode;
}) {
	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						{columns.map((c) => (
							<TableHead key={c}>{c}</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>{children}</TableBody>
			</Table>
		</div>
	);
}
