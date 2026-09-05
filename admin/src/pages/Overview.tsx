import { useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import { som } from "../ui/format";
import { Failed, Stat, Waiting } from "../ui/parts";
import { Card, CardContent } from "@/components/ui/card";

// The front page: what has been sold, what is waiting, and what came in.
export default function Overview() {
	const overview = useQuery({
		queryKey: ["umumiy"],
		queryFn: async () => {
			const { data, error } = await api.GET("/boshqaruv/umumiy", {});
			if (error || !data) throw new Error("O'qilmadi");
			return data.umumiy;
		},
	});

	if (overview.isPending) return <Waiting rows={3} />;
	if (overview.isError) return <Failed>O'qib bo'lmadi.</Failed>;

	const d = overview.data;

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<Stat label="Egallangan raqamlar" value={d.olingan} />
				<Stat label="Band, to'lov kutilmoqda" value={d.band} />
				<Stat
					label="To'lanmagan buyurtmalar"
					value={d.kutilayotgan_buyurtmalar}
				/>
				<Stat label="Qoldirilgan kontaktlar" value={d.vizitkalar} />
			</div>

			<Card>
				<CardContent>
					<p className="text-muted-foreground text-sm">Kelib tushgan pul</p>
					<p className="mt-1 font-semibold text-4xl tabular-nums">
						{som(d.tushum)}
					</p>
					<p className="mt-2 text-muted-foreground text-xs">
						{/* Not the same as what has been ordered, and not the same as what has
                been given away — a gift has no order and is not counted here. */}
						To'langan {d.tolangan_buyurtmalar} ta buyurtma. Sovg'a qilingan
						raqamlar bunga kirmaydi.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
