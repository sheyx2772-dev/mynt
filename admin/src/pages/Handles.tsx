import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import type { Column } from "../ui/data-table";
import { DataTable } from "../ui/data-table";
import { som, when } from "../ui/format";
import { Pager } from "../ui/pager";
import { Empty, Failed, Waiting } from "../ui/parts";
import { Search } from "../ui/search";
import { useList } from "../ui/use-list";
import { Badge } from "@/components/ui/badge";

type Key = "raqam" | "egasi" | "tarif" | "tolangan" | "olingan";
type Handle = {
	raqam: string;
	holat: string;
	egasi?: string;
	ism?: string;
	tarif: string;
	tolangan?: number;
	sovga_sababi?: string;
	olingan?: string;
};

export const HANDLE_COLUMNS: Column<Handle, Key>[] = [
	{
		key: "raqam",
		header: "Raqam",
		cell: (h) => (
			<span className="font-medium">
				{h.raqam}
				{h.holat !== "claimed" && (
					<Badge
						variant="outline"
						className="ml-2 border-amber-500/40 text-amber-700"
					>
						{h.holat}
					</Badge>
				)}
			</span>
		),
	},
	{
		key: "egasi",
		header: "Egasi",
		cell: (h) => (
			<>
				{h.ism || "—"}
				{h.egasi && (
					<span className="block text-muted-foreground text-xs">{h.egasi}</span>
				)}
			</>
		),
	},
	{
		key: "tarif",
		header: "Tarif",
		cell: (h) =>
			h.tarif === "premium" ? (
				<Badge className="bg-[#f2e6c4] text-[#7a5c18]">premium</Badge>
			) : (
				<span className="text-muted-foreground">bepul</span>
			),
	},
	{
		key: "tolangan",
		header: "To'langan",
		descFirst: true,
		cell: (h) =>
			// A gift and a sale of zero are different things, and the reason is what
			// tells them apart in a month's figures.
			h.tolangan ? (
				<span className="tabular-nums">{som(h.tolangan)}</span>
			) : (
				<span className="text-muted-foreground">
					{h.sovga_sababi ? `sovg'a — ${h.sovga_sababi}` : "—"}
				</span>
			),
	},
	{
		key: "olingan",
		header: "Olingan",
		descFirst: true,
		cell: (h) => (
			<span className="text-muted-foreground">{when(h.olingan)}</span>
		),
	},
];

// Searching for a number — by the number, by the name on it, or by who owns it.
//
// This screen exists because the answer to "who has AAA777" has been a psql
// session, and a question that needs a psql session is a question nobody asks.
export default function Handles() {
	const list = useList<Key>({ key: "olingan", desc: true });

	const handles = useQuery({
		queryKey: ["raqamlar", list.query],
		queryFn: async () => {
			const { data, error } = await api.GET("/boshqaruv/raqamlar", {
				params: { query: list.query },
			});
			if (error || !data) throw new Error("O'qilmadi");
			return data;
		},
		placeholderData: keepPreviousData,
	});

	return (
		<div>
			<div className="mb-4">
				<Search placeholder="Raqam, ism yoki email" onSearch={list.onSearch} />
			</div>

			{handles.isPending && <Waiting />}
			{handles.isError && <Failed>Raqamlar o'qilmadi.</Failed>}

			{handles.data &&
				(handles.data.royxat.length === 0 ? (
					<Empty>Hech nima topilmadi.</Empty>
				) : (
					<DataTable
						columns={HANDLE_COLUMNS}
						rows={handles.data.royxat}
						rowKey={(h) => h.raqam}
						sort={list.sort}
						onSort={list.setSort}
					/>
				))}

			{handles.data && (
				<Pager
					total={handles.data.jami}
					skip={list.skip}
					size={list.size}
					onSkip={list.setSkip}
					onSize={list.setSize}
				/>
			)}
		</div>
	);
}
