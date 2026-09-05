import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import type { Column } from "../ui/data-table";
import { DataTable } from "../ui/data-table";
import { som, when } from "../ui/format";
import { Pager } from "../ui/pager";
import { Empty, Failed, Waiting } from "../ui/parts";
import { Search } from "../ui/search";
import { useList } from "../ui/use-list";
import AccountOrders from "./AccountOrders";
import { Badge } from "@/components/ui/badge";

type Key = "kim" | "raqamlar" | "tolagan" | "oxirgi_tolov" | "qoshilgan";
type Account = {
	id: string;
	email?: string;
	telefon?: string;
	davlat?: string;
	raqamlar: number;
	tolagan: number;
	oxirgi_tolov?: string;
	qoshilgan?: string;
};

/** A phone account has a placeholder address, so the number is what names it. */
const who = (a: Account) => (a.telefon ? `+${a.telefon}` : (a.email ?? "—"));

const COLUMNS: Column<Account, Key>[] = [
	{
		key: "kim",
		header: "Kim",
		cell: (a) => (
			<>
				{who(a)}
				{a.davlat && (
					<Badge variant="outline" className="ml-2">
						{a.davlat}
					</Badge>
				)}
			</>
		),
	},
	{
		key: "raqamlar",
		header: "Raqamlar",
		descFirst: true,
		cell: (a) => <span className="tabular-nums">{a.raqamlar}</span>,
	},
	{
		key: "tolagan",
		header: "Jami to'lagan",
		descFirst: true,
		cell: (a) =>
			a.tolagan > 0 ? (
				<span className="tabular-nums">{som(a.tolagan)}</span>
			) : (
				<span className="text-muted-foreground">—</span>
			),
	},
	{
		key: "oxirgi_tolov",
		header: "Oxirgi to'lov",
		descFirst: true,
		cell: (a) => (
			<span className="text-muted-foreground">{when(a.oxirgi_tolov)}</span>
		),
	},
	{
		key: "qoshilgan",
		header: "Qo'shilgan",
		descFirst: true,
		cell: (a) => (
			<span className="text-muted-foreground">{when(a.qoshilgan)}</span>
		),
	},
];

// Who the customers are, and what they have actually paid.
//
// Ordered by what came in rather than by when they joined, because the question
// this screen answers is "who is worth ringing" — and a list ordered by date is
// a list where that person is somewhere in the middle.
export default function Accounts() {
	const [open, setOpen] = useState<{ id: string; who: string } | null>(null);
	const list = useList<Key>({ key: "tolagan", desc: true });

	const accounts = useQuery({
		queryKey: ["hisoblar", list.query],
		queryFn: async () => {
			const { data, error } = await api.GET("/boshqaruv/hisoblar", {
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
				<Search placeholder="Email yoki telefon" onSearch={list.onSearch} />
			</div>

			{accounts.isPending && <Waiting />}
			{accounts.isError && <Failed>Hisoblar o'qilmadi.</Failed>}

			{accounts.data &&
				(accounts.data.royxat.length === 0 ? (
					<Empty>Hech nima topilmadi.</Empty>
				) : (
					<DataTable
						columns={COLUMNS}
						rows={accounts.data.royxat}
						rowKey={(a) => a.id}
						sort={list.sort}
						onSort={list.setSort}
						onRowClick={(a) => setOpen({ id: a.id, who: who(a) })}
					/>
				))}

			{accounts.data && (
				<Pager
					total={accounts.data.jami}
					skip={list.skip}
					size={list.size}
					onSkip={list.setSkip}
					onSize={list.setSize}
				/>
			)}

			{open && (
				<AccountOrders
					id={open.id}
					who={open.who}
					onClose={() => setOpen(null)}
				/>
			)}
		</div>
	);
}
