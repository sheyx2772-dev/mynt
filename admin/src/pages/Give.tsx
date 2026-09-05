import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../api/client";
import { Field } from "../ui/field";
import { Failed } from "../ui/parts";
import { Button } from "@/components/ui/button";

// Handing a number to somebody without a sale.
//
// Replaces `scripts/handles.py give`, which needed a terminal and a service
// role key. The reason is required and is written to the row: a gift that looks
// like a sale in the numbers makes the first month's figures a lie, and the
// first month's figures are the ones that decide what to do next.
export default function Give({ onGiven }: { onGiven: () => void }) {
	const [raqam, setRaqam] = useState("");
	const [email, setEmail] = useState("");
	const [ism, setIsm] = useState("");
	const [sababi, setSababi] = useState("");

	const client = useQueryClient();

	const give = useMutation({
		mutationFn: async () => {
			const { data, error } = await api.POST("/boshqaruv/sovga", {
				body: {
					raqam: raqam.trim().toUpperCase(),
					email: email.trim(),
					ism: ism.trim(),
					sababi: sababi.trim(),
				},
			});
			if (error || !data) {
				// The server's own sentence, which says which of the three things was
				// wrong — no such account, number taken, or a bad format.
				throw new Error((error as { detail?: string })?.detail ?? "Berilmadi.");
			}
			return data.raqam;
		},
		onSuccess: () => {
			client.invalidateQueries({ queryKey: ["umumiy"] });
			client.invalidateQueries({ queryKey: ["raqamlar"] });
			client.invalidateQueries({ queryKey: ["sovgalar"] });
			onGiven();
		},
	});

	return (
		<form
			className="mt-6 space-y-4"
			onSubmit={(e) => {
				e.preventDefault();
				give.mutate();
			}}
		>
			<Field
				label="Raqam"
				value={raqam}
				onChange={setRaqam}
				placeholder="AAA777"
				autoFocus
			/>
			<Field
				label="Kimga"
				value={email}
				onChange={setEmail}
				placeholder="odam@example.com"
				help="Hisob allaqachon bo'lishi kerak — o'zi bir marta kirgan bo'lsin."
			/>
			<Field
				label="Kartadagi ism"
				value={ism}
				onChange={setIsm}
				placeholder="Aziz Karimov"
			/>
			<Field
				label="Nima uchun"
				value={sababi}
				onChange={setSababi}
				placeholder="sartarosh, Chilonzor"
				help="Hisobotda qoladi. Sovg'a sotuvdek ko'rinsa, oylik raqamlar yolg'on bo'ladi."
			/>

			<Button
				type="submit"
				size="lg"
				disabled={give.isPending}
				className="w-full"
			>
				{give.isPending ? "Berilmoqda…" : "Berish"}
			</Button>

			{give.isError && <Failed>{give.error.message}</Failed>}
		</form>
	);
}
