import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import { som, when } from "../ui/format";
import { Pager } from "../ui/pager";
import { Empty, Failed, Waiting } from "../ui/parts";
import { Status } from "../ui/status";
import { Rows } from "../ui/table-shell";
import OrderDetail from "./OrderDetail";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";

type Holat = "" | "pending" | "paid" | "cancelled" | "failed";

const SIZE = 50;

const FILTERS: { value: Holat; label: string }[] = [
	{ value: "", label: "Hammasi" },
	{ value: "pending", label: "To'lanmagan" },
	{ value: "paid", label: "To'langan" },
	{ value: "cancelled", label: "Bekor qilingan" },
];

export default function Orders() {
	const [holat, setHolat] = useState<Holat>("");
	const [skip, setSkip] = useState(0);
	const [open, setOpen] = useState<string | null>(null);

	const orders = useQuery({
		queryKey: ["buyurtmalar", holat, skip],
		queryFn: async () => {
			const { data, error } = await api.GET("/boshqaruv/buyurtmalar", {
				params: {
					query: { holat: holat || undefined, soni: SIZE, otkazish: skip },
				},
			});
			if (error || !data) throw new Error("O'qilmadi");
			return data;
		},
		// The rows of the page being left stay on screen until the next page
		// arrives. Without this the table empties, the page collapses to a
		// spinner, and the pager the cursor is resting on jumps away.
		placeholderData: keepPreviousData,
	});

	// Changing the filter while on page 4 would otherwise ask for rows 150–200 of
	// a list that may only have twelve, and answer with an empty table.
	const filter = (value: Holat) => {
		setHolat(value);
		setSkip(0);
	};

	return (
		<div>
			<div className="mb-4 flex flex-wrap gap-1.5">
				{FILTERS.map((f) => (
					<Button
						key={f.value}
						variant={holat === f.value ? "default" : "outline"}
						size="sm"
						onClick={() => filter(f.value)}
					>
						{f.label}
					</Button>
				))}
			</div>

			{orders.isPending && <Waiting />}
			{orders.isError && <Failed>Buyurtmalar o'qilmadi.</Failed>}
			{orders.data?.royxat.length === 0 && (
				<Empty>Bu holatda buyurtma yo'q.</Empty>
			)}

			{orders.data && orders.data.royxat.length > 0 && (
				<>
					<Rows columns={["Raqam", "Xaridor", "Summa", "Holat", "Ochilgan"]}>
						{orders.data.royxat.map((o) => (
							<TableRow
								key={o.id}
								onClick={() => setOpen(o.id)}
								className="cursor-pointer"
							>
								<TableCell className="font-medium">{o.raqam}</TableCell>
								<TableCell className="text-muted-foreground">
									{o.xaridor || "—"}
								</TableCell>
								<TableCell className="tabular-nums">{som(o.summa)}</TableCell>
								<TableCell>
									<Status status={o.holat} provider={o.tolov} />
								</TableCell>
								<TableCell className="text-muted-foreground">
									{when(o.ochilgan)}
								</TableCell>
							</TableRow>
						))}
					</Rows>

					<Pager
						total={orders.data.jami}
						skip={skip}
						size={SIZE}
						onSkip={setSkip}
					/>
				</>
			)}

			{open && <OrderDetail id={open} onClose={() => setOpen(null)} />}
		</div>
	);
}
