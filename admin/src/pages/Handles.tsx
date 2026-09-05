import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import { som, when } from "../ui/format";
import { Pager } from "../ui/pager";
import { Empty, Failed, Waiting } from "../ui/parts";
import { Search } from "../ui/search";
import { Rows } from "../ui/table-shell";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";

const SIZE = 50;

// Searching for a number — by the number, by the name on it, or by who owns it.
//
// This screen exists because the answer to "who has AAA777" has been a psql
// session, and a question that needs a psql session is a question nobody asks.
export default function Handles() {
	const [search, setSearch] = useState("");
	const [skip, setSkip] = useState(0);

	const handles = useQuery({
		queryKey: ["raqamlar", search, skip],
		queryFn: async () => {
			const { data, error } = await api.GET("/boshqaruv/raqamlar", {
				params: {
					query: { qidiruv: search || undefined, soni: SIZE, otkazish: skip },
				},
			});
			if (error || !data) throw new Error("O'qilmadi");
			return data;
		},
		placeholderData: keepPreviousData,
	});

	return (
		<div>
			<Search
				placeholder="Raqam, ism yoki email"
				onSearch={(term) => {
					setSearch(term);
					setSkip(0);
				}}
			/>

			{handles.isPending && <Waiting />}
			{handles.isError && <Failed>Raqamlar o'qilmadi.</Failed>}
			{handles.data?.royxat.length === 0 && <Empty>Hech nima topilmadi.</Empty>}

			{handles.data && handles.data.royxat.length > 0 && (
				<>
					<Rows columns={["Raqam", "Egasi", "Tarif", "To'langan", "Olingan"]}>
						{handles.data.royxat.map((h) => (
							<TableRow key={h.raqam}>
								<TableCell className="font-medium">
									{h.raqam}
									{h.holat !== "claimed" && (
										<Badge
											variant="outline"
											className="ml-2 border-amber-500/40 text-amber-700"
										>
											{h.holat}
										</Badge>
									)}
								</TableCell>
								<TableCell>
									{h.ism || "—"}
									{h.egasi && (
										<span className="block text-muted-foreground text-xs">
											{h.egasi}
										</span>
									)}
								</TableCell>
								<TableCell>
									{h.tarif === "premium" ? (
										<Badge className="bg-[#f2e6c4] text-[#7a5c18]">
											premium
										</Badge>
									) : (
										<span className="text-muted-foreground">bepul</span>
									)}
								</TableCell>
								<TableCell className="tabular-nums">
									{/* A gift and a sale of zero are different things, and the
                      reason is what tells them apart in a month's figures. */}
									{h.tolangan ? (
										som(h.tolangan)
									) : (
										<span className="text-muted-foreground">
											{h.sovga_sababi ? `sovg'a — ${h.sovga_sababi}` : "—"}
										</span>
									)}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{when(h.olingan)}
								</TableCell>
							</TableRow>
						))}
					</Rows>

					<Pager
						total={handles.data.jami}
						skip={skip}
						size={SIZE}
						onSkip={setSkip}
					/>
				</>
			)}
		</div>
	);
}
