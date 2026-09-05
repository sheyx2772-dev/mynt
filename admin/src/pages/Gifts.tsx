import { useState } from "react";
import { Plus } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import { DataTable } from "../ui/data-table";
import { Pager } from "../ui/pager";
import { Panel } from "../ui/panel";
import { Empty, Failed, Waiting } from "../ui/parts";
import { Search } from "../ui/search";
import { useList } from "../ui/use-list";
import Give from "./Give";
import { HANDLE_COLUMNS } from "./Handles";
import { Button } from "@/components/ui/button";

type Key = "raqam" | "egasi" | "tarif" | "tolangan" | "olingan";

// What has been given away, and a way to give another.
//
// The list is the point of the screen. A gift is the one number in the takings
// that nobody paid for, so "who did we give one to, and why" is a question
// asked at the end of every month — and until now the form was here and the
// answer was not.
export default function Gifts() {
	const [giving, setGiving] = useState(false);
	const list = useList<Key>({ key: "olingan", desc: true });

	const gifts = useQuery({
		queryKey: ["sovgalar", list.query],
		queryFn: async () => {
			const { data, error } = await api.GET("/boshqaruv/raqamlar", {
				params: { query: { ...list.query, sovga: "sovga" } },
			});
			if (error || !data) throw new Error("O'qilmadi");
			return data;
		},
		placeholderData: keepPreviousData,
	});

	return (
		<div>
			<div className="mb-4 flex items-center gap-2">
				<div className="flex-1">
					<Search
						placeholder="Raqam, ism yoki email"
						onSearch={list.onSearch}
					/>
				</div>
				<Button className="mb-4" onClick={() => setGiving(true)}>
					<Plus />
					Sovg'a berish
				</Button>
			</div>

			{gifts.isPending && <Waiting />}
			{gifts.isError && <Failed>Sovg'alar o'qilmadi.</Failed>}

			{gifts.data &&
				(gifts.data.royxat.length === 0 ? (
					<Empty>Hali sovg'a berilmagan.</Empty>
				) : (
					<DataTable
						columns={HANDLE_COLUMNS}
						rows={gifts.data.royxat}
						rowKey={(h) => h.raqam}
						sort={list.sort}
						onSort={list.setSort}
					/>
				))}

			{gifts.data && (
				<Pager
					total={gifts.data.jami}
					skip={list.skip}
					size={list.size}
					onSkip={list.setSkip}
					onSize={list.setSize}
				/>
			)}

			{giving && (
				<Panel
					eyebrow="Sovg'a"
					title="Raqam berish"
					onClose={() => setGiving(false)}
				>
					<Give onGiven={() => setGiving(false)} />
				</Panel>
			)}
		</div>
	);
}
