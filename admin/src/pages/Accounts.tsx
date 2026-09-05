import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import { som, when } from "../ui/format";
import { Pager } from "../ui/pager";
import { Empty, Failed, Waiting } from "../ui/parts";
import { Search } from "../ui/search";
import { Rows } from "../ui/table-shell";
import AccountOrders from "./AccountOrders";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";

const SIZE = 50;

// Who the customers are, and what they have actually paid.
//
// Ordered by what came in rather than by when they joined, because the question
// this screen answers is "who is worth ringing" — and a list ordered by date is
// a list where that person is somewhere in the middle.
export default function Accounts() {
	const [search, setSearch] = useState("");
	const [skip, setSkip] = useState(0);
	const [open, setOpen] = useState<{ id: string; who: string } | null>(null);

	const accounts = useQuery({
		queryKey: ["hisoblar", search, skip],
		queryFn: async () => {
			const { data, error } = await api.GET("/boshqaruv/hisoblar", {
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
				placeholder="Email yoki telefon"
				onSearch={(term) => {
					setSearch(term);
					setSkip(0);
				}}
			/>

			{accounts.isPending && <Waiting />}
			{accounts.isError && <Failed>Hisoblar o'qilmadi.</Failed>}
			{accounts.data?.royxat.length === 0 && (
				<Empty>Hech nima topilmadi.</Empty>
			)}

			{accounts.data && accounts.data.royxat.length > 0 && (
				<>
					<Rows
						columns={[
							"Kim",
							"Raqamlar",
							"Jami to'lagan",
							"Oxirgi to'lov",
							"Qo'shilgan",
						]}
					>
						{accounts.data.royxat.map((a) => (
							<TableRow
								key={a.id}
								onClick={() =>
									setOpen({
										id: a.id,
										who: a.telefon ? `+${a.telefon}` : a.email,
									})
								}
								className="cursor-pointer"
							>
								<TableCell>
									{/* A phone account has a placeholder address, so the number is
                      what identifies it to a person. */}
									{a.telefon ? `+${a.telefon}` : a.email}
									{a.davlat && (
										<Badge variant="outline" className="ml-2">
											{a.davlat}
										</Badge>
									)}
								</TableCell>
								<TableCell className="tabular-nums">{a.raqamlar}</TableCell>
								<TableCell className="tabular-nums">
									{a.tolagan > 0 ? (
										som(a.tolagan)
									) : (
										<span className="text-muted-foreground">—</span>
									)}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{when(a.oxirgi_tolov)}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{when(a.qoshilgan)}
								</TableCell>
							</TableRow>
						))}
					</Rows>

					<Pager
						total={accounts.data.jami}
						skip={skip}
						size={SIZE}
						onSkip={setSkip}
					/>
				</>
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
