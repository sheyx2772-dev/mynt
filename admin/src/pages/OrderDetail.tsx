import { useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import { som, when } from "../ui/format";
import { Panel, Row } from "../ui/panel";
import { Failed, Waiting } from "../ui/parts";
import { Status } from "../ui/status";

const KIND: Record<string, string> = {
	handle: "Raqam sotib olish",
	device: "Uzuk",
	subscription: "Obuna",
	transfer: "Raqam o'tkazish",
};

/** Everything known about one order, over the table it was opened from. */
export default function OrderDetail({
	id,
	onClose,
}: {
	id: string;
	onClose: () => void;
}) {
	const order = useQuery({
		queryKey: ["buyurtma", id],
		queryFn: async () => {
			const { data, error } = await api.GET("/boshqaruv/buyurtmalar/{id}", {
				params: { path: { id } },
			});
			if (error || !data) throw new Error("O'qilmadi");
			return data.buyurtma;
		},
	});

	const o = order.data;

	return (
		<Panel eyebrow="Buyurtma" title={o?.raqam ?? "…"} onClose={onClose}>
			{order.isPending && <Waiting rows={5} />}
			{order.isError && <Failed>Buyurtma o'qilmadi.</Failed>}

			{o && (
				<>
					<dl className="mt-6 space-y-3 text-sm">
						<Row label="Nima">
							{KIND[o.turi] ?? o.turi}
							{o.oylar ? ` · ${o.oylar} oy` : ""}
						</Row>
						<Row label="Kim">
							{o.xaridor || "—"}
							{o.xaridor_id && (
								<span className="block font-mono text-muted-foreground text-xs">
									{o.xaridor_id}
								</span>
							)}
						</Row>
						<Row label="Summa">
							<span className="tabular-nums">{som(o.summa)}</span>
							{/* The discount is shown beside the amount, not instead of it:
                  what was charged and what was forgiven are both figures
                  somebody asks about. */}
							{o.promokod && (
								<span className="block text-lime-ink text-xs">
									{o.promokod}
									{o.chegirma ? ` · −${som(o.chegirma)}` : ""}
								</span>
							)}
						</Row>
						<Row label="Holat">
							<Status status={o.holat} />
						</Row>
						<Row label="To'lov">
							{o.tolov ?? "—"}
							{o.tolov_id && (
								<span className="block font-mono text-muted-foreground text-xs">
									{o.tolov_id}
								</span>
							)}
						</Row>
						<Row label="Ochilgan">{when(o.ochilgan)}</Row>
						<Row label="To'langan">{when(o.tolangan)}</Row>
						{o.bekor_qilingan && (
							<Row label="Bekor qilingan">{when(o.bekor_qilingan)}</Row>
						)}
						<Row label="ID">
							<span className="font-mono text-xs">{o.id}</span>
						</Row>
					</dl>

					{/* What the provider itself recorded. An order can be pending here
              while Payme holds a transaction against it, and that gap is
              exactly what somebody is looking for when they open this. */}
					<h3 className="mt-8 font-medium text-sm">Tranzaksiyalar</h3>
					{!o.tranzaksiyalar?.length ? (
						<p className="mt-2 text-muted-foreground text-sm">
							Yo'q — to'lov boshlanmagan.
						</p>
					) : (
						<ul className="mt-2 space-y-2">
							{o.tranzaksiyalar.map((t) => (
								<li
									key={`${t.tolov}-${t.id}`}
									className="rounded-xl bg-muted p-3"
								>
									<p className="flex justify-between">
										<span className="font-medium">{t.tolov}</span>
										<span className="text-muted-foreground">
											holat {t.holat}
										</span>
									</p>
									<p className="mt-1 font-mono text-muted-foreground text-xs">
										{t.id}
									</p>
									<p className="mt-1 text-muted-foreground text-xs">
										boshlangan {when(t.boshlangan)}
										{t.tolangan && ` · to'langan ${when(t.tolangan)}`}
										{t.bekor && ` · bekor ${when(t.bekor)}`}
									</p>
								</li>
							))}
						</ul>
					)}
				</>
			)}
		</Panel>
	);
}
