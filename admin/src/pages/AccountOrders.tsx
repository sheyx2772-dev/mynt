import { useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import { som, when } from "../ui/format";
import { Panel } from "../ui/panel";
import { Empty, Failed, Waiting } from "../ui/parts";
import { Status } from "../ui/status";

// One customer's whole history: who paid what, when, and through which
// provider. The question this answers is asked on the phone, while the customer
// is waiting, so it is one click from the list rather than a search on another
// screen.
export default function AccountOrders({
	id,
	who,
	onClose,
}: {
	id: string;
	who: string;
	onClose: () => void;
}) {
	const orders = useQuery({
		queryKey: ["hisob-buyurtmalari", id],
		queryFn: async () => {
			const { data, error } = await api.GET(
				"/boshqaruv/hisoblar/{id}/buyurtmalar",
				{
					params: { path: { id } },
				},
			);
			if (error || !data) throw new Error("O'qilmadi");
			return data.buyurtmalar ?? [];
		},
	});

	// Only what was actually settled. A pending order is not money.
	const paid = orders.data
		?.filter((o) => o.holat === "paid")
		.reduce((sum, o) => sum + o.summa, 0);

	return (
		<Panel
			eyebrow="Hisob"
			title={<span className="break-all">{who}</span>}
			onClose={onClose}
		>
			{orders.isPending && <Waiting rows={4} />}
			{orders.isError && <Failed>Buyurtmalar o'qilmadi.</Failed>}
			{orders.data?.length === 0 && <Empty>Buyurtma yo'q.</Empty>}

			{orders.data && orders.data.length > 0 && (
				<>
					<p className="mt-2 text-muted-foreground text-sm">
						{orders.data.length} ta buyurtma · jami{" "}
						<span className="font-medium text-foreground tabular-nums">
							{som(paid ?? 0)}
						</span>
					</p>

					<ul className="mt-4 space-y-2">
						{orders.data.map((o) => (
							<li key={o.id} className="rounded-xl bg-muted p-3">
								<p className="flex justify-between gap-3">
									<span className="font-medium">{o.raqam}</span>
									<span className="tabular-nums">{som(o.summa)}</span>
								</p>
								<p className="mt-1.5 flex items-center justify-between gap-3">
									<Status status={o.holat} provider={o.tolov} />
									{/* When it was paid, falling back to when it was opened — an
                      unpaid order has no payment date to show. */}
									<span className="text-muted-foreground text-xs">
										{when(o.tolangan ?? o.ochilgan)}
									</span>
								</p>
							</li>
						))}
					</ul>
				</>
			)}
		</Panel>
	);
}
