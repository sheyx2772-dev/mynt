import { useState } from "react";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { api } from "../api/client";
import { som } from "../ui/format";
import { Pager } from "../ui/pager";
import { Empty, Failed, Waiting } from "../ui/parts";
import PromoForm from "./PromoForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const KIND: Record<string, string> = {
	percent: "foiz",
	amount: "so'm",
	months: "oy",
};

const SIZE = 50;

// Promo codes: what exists, and a form to make another.
//
// A code is switched off rather than deleted. A spent campaign is the record of
// why a hundred orders were cheaper than the price list, and deleting the code
// deletes the reason.
export default function Promo() {
	const [open, setOpen] = useState(false);
	const [skip, setSkip] = useState(0);
	const client = useQueryClient();

	const codes = useQuery({
		queryKey: ["promokodlar", skip],
		queryFn: async () => {
			const { data, error } = await api.GET("/boshqaruv/promokodlar", {
				params: { query: { soni: SIZE, otkazish: skip } },
			});
			if (error || !data) throw new Error("O'qilmadi");
			return data;
		},
		placeholderData: keepPreviousData,
	});

	const toggle = useMutation({
		mutationFn: async ({ kod, faol }: { kod: string; faol: boolean }) => {
			const { error } = await api.PUT("/boshqaruv/promokodlar/{kod}", {
				params: { path: { kod } },
				body: { faol },
			});
			if (error) throw new Error("O'zgarmadi");
		},
		onSuccess: () => client.invalidateQueries({ queryKey: ["promokodlar"] }),
	});

	return (
		<div>
			<div className="mb-4 flex items-center justify-between gap-4">
				<p className="text-muted-foreground text-sm">
					Kod har qanday buyurtmaga ishlaydi — raqam, obuna, qurilma, obyekt.
				</p>
				<Button
					variant={open ? "outline" : "default"}
					onClick={() => setOpen(!open)}
				>
					{open ? "Yopish" : "Yangi kod"}
				</Button>
			</div>

			{open && (
				<div className="mb-6">
					<PromoForm
						onCreated={() => {
							setOpen(false);
							// A new code is active and newest, so it is the first row of the
							// first page — which is not where the reader may be standing.
							setSkip(0);
						}}
					/>
				</div>
			)}

			{codes.isPending && <Waiting />}
			{codes.isError && <Failed>Kodlar o'qilmadi.</Failed>}
			{codes.data?.royxat.length === 0 && <Empty>Hali kod yo'q.</Empty>}

			{codes.data && codes.data.royxat.length > 0 && (
				<>
					<div className="space-y-2">
						{codes.data.royxat.map((c) => (
							<Card key={c.kod}>
								<CardContent className="flex items-start justify-between gap-4">
									<div>
										<p className="flex items-center gap-2 font-semibold">
											<span
												className={
													c.faol ? "" : "text-muted-foreground line-through"
												}
											>
												{c.kod}
											</span>
											{!c.faol && <Badge variant="ghost">o'chirilgan</Badge>}
										</p>
										<p className="mt-0.5 text-sm">
											{c.turi === "amount"
												? som(c.qiymati)
												: `${c.qiymati} ${KIND[c.turi]}`}
											{c.turi === "percent" && c.eng_kop_chegirma
												? ` · eng ko'pi ${som(c.eng_kop_chegirma)}`
												: ""}
											{c.bir_hisob_bir_marta ? " · bir hisob bir marta" : ""}
										</p>
										{c.izoh && (
											<p className="mt-1 text-muted-foreground text-xs">
												{c.izoh}
											</p>
										)}
									</div>

									<div className="shrink-0 text-right">
										<p className="text-sm tabular-nums">
											{c.ishlatilgan}
											<span className="text-muted-foreground">
												/{c.necha_marta ?? "∞"}
											</span>
										</p>
										<Button
											variant="ghost"
											size="xs"
											className="mt-1"
											onClick={() =>
												toggle.mutate({ kod: c.kod, faol: !c.faol })
											}
										>
											{c.faol ? "o'chirish" : "yoqish"}
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					<Pager
						total={codes.data.jami}
						skip={skip}
						size={SIZE}
						onSkip={setSkip}
					/>
				</>
			)}
		</div>
	);
}
