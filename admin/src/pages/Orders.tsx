import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import type { Column } from "../ui/data-table";
import { DataTable } from "../ui/data-table";
import { som, when } from "../ui/format";
import { Pager } from "../ui/pager";
import { Empty, Failed, Waiting } from "../ui/parts";
import { Status } from "../ui/status";
import { useList } from "../ui/use-list";
import OrderDetail from "./OrderDetail";
import { Button } from "@/components/ui/button";

type Holat = "" | "pending" | "paid" | "cancelled" | "failed";
type Order = {
	id: string;
	raqam: string;
	xaridor: string;
	summa: number;
	holat: string;
	tolov?: string;
	ochilgan?: string;
};

const FILTERS: { value: Holat; label: string }[] = [
	{ value: "", label: "Hammasi" },
	{ value: "pending", label: "To'lanmagan" },
	{ value: "paid", label: "To'langan" },
	{ value: "cancelled", label: "Bekor qilingan" },
];

const COLUMNS: Column<
	Order,
	"raqam" | "xaridor" | "summa" | "holat" | "ochilgan"
>[] = [
	{
		key: "raqam",
		header: "Raqam",
		cell: (o) => <span className="font-medium">{o.raqam}</span>,
	},
	{
		key: "xaridor",
		header: "Xaridor",
		cell: (o) => (
			<span className="text-muted-foreground">{o.xaridor || "—"}</span>
		),
	},
	{
		key: "summa",
		header: "Summa",
		descFirst: true,
		cell: (o) => <span className="tabular-nums">{som(o.summa)}</span>,
	},
	{
		key: "holat",
		header: "Holat",
		cell: (o) => <Status status={o.holat} provider={o.tolov} />,
	},
	{
		key: "ochilgan",
		header: "Ochilgan",
		descFirst: true,
		cell: (o) => (
			<span className="text-muted-foreground">{when(o.ochilgan)}</span>
		),
	},
];

export default function Orders() {
	const [holat, setHolat] = useState<Holat>("");
	const [open, setOpen] = useState<string | null>(null);
	const list = useList<"raqam" | "xaridor" | "summa" | "holat" | "ochilgan">({
		key: "ochilgan",
		desc: true,
	});

	const orders = useQuery({
		queryKey: ["buyurtmalar", holat, list.query],
		queryFn: async () => {
			const { qidiruv: _, ...paging } = list.query;
			const { data, error } = await api.GET("/boshqaruv/buyurtmalar", {
				params: { query: { holat: holat || undefined, ...paging } },
			});
			if (error || !data) throw new Error("O'qilmadi");
			return data;
		},
		// The rows of the page being left stay on screen until the next page
		// arrives. Without this the table empties, the page collapses to a
		// spinner, and the pager the cursor is resting on jumps away.
		placeholderData: keepPreviousData,
	});

	return (
		<div>
			<div className="mb-4 flex flex-wrap gap-1.5">
				{FILTERS.map((f) => (
					<Button
						key={f.value}
						variant={holat === f.value ? "default" : "outline"}
						size="sm"
						onClick={() => {
							setHolat(f.value);
							list.setSkip(0);
						}}
					>
						{f.label}
					</Button>
				))}
			</div>

			{orders.isPending && <Waiting />}
			{orders.isError && <Failed>Buyurtmalar o'qilmadi.</Failed>}

			{orders.data &&
				(orders.data.royxat.length === 0 ? (
					<Empty>Bu holatda buyurtma yo'q.</Empty>
				) : (
					<DataTable
						columns={COLUMNS}
						rows={orders.data.royxat}
						rowKey={(o) => o.id}
						sort={list.sort}
						onSort={list.setSort}
						onRowClick={(o) => setOpen(o.id)}
					/>
				))}

			{orders.data && (
				<Pager
					total={orders.data.jami}
					skip={list.skip}
					size={list.size}
					onSkip={list.setSkip}
					onSize={list.setSize}
				/>
			)}

			{open && <OrderDetail id={open} onClose={() => setOpen(null)} />}
		</div>
	);
}
