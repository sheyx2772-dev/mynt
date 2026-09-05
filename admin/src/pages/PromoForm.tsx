import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../api/client";
import { Field } from "../ui/field";
import { Failed } from "../ui/parts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const KINDS = [
	{ value: "percent", label: "Foiz" },
	{ value: "amount", label: "So'm" },
	{ value: "months", label: "Bepul oy" },
] as const;

const SCOPES = [
	{ value: "handle", label: "Raqam" },
	{ value: "subscription", label: "Obuna" },
	{ value: "device", label: "Qurilma" },
	{ value: "venue", label: "Obyekt" },
] as const;

// What the value box asks for, and an example of an answer. A box labelled
// "Necha foiz" with nothing in it does not say whether it wants 20 or 0.2.
const VALUE = {
	percent: { label: "Necha foiz", placeholder: "20" },
	amount: { label: "Necha so'm", placeholder: "50 000" },
	months: { label: "Necha oy", placeholder: "3" },
} as const;

// Making a code.
//
// Everything but the code and the value is optional, and empty means no limit —
// which is what somebody making a code without thinking about it means.
export default function PromoForm({ onCreated }: { onCreated: () => void }) {
	const [kod, setKod] = useState("");
	const [turi, setTuri] = useState<keyof typeof VALUE>("percent");
	const [qiymati, setQiymati] = useState("");
	const [chegara, setChegara] = useState("");
	const [nechaMarta, setNechaMarta] = useState("");
	const [engKam, setEngKam] = useState("");
	const [tugashi, setTugashi] = useState("");
	const [birMarta, setBirMarta] = useState(true);
	const [nimaga, setNimaga] = useState<string[]>([
		...SCOPES.map((s) => s.value),
	]);
	const [izoh, setIzoh] = useState("");

	const client = useQueryClient();

	const create = useMutation({
		mutationFn: async () => {
			const { data, error } = await api.POST("/boshqaruv/promokodlar", {
				body: {
					kod: kod.trim(),
					turi,
					// Spaces are allowed in the boxes because "50 000" is how the number
					// is written here; the API wants the digits.
					qiymati: digits(qiymati),
					// Zero is how the API spells "no limit", and an empty box means the
					// same thing.
					eng_kop_chegirma: digits(chegara),
					necha_marta: digits(nechaMarta),
					eng_kam_summa: digits(engKam),
					bir_hisob_bir_marta: birMarta,
					nimaga,
					tugashi,
					izoh: izoh.trim(),
				},
			});
			if (error || !data) {
				throw new Error(
					(error as { detail?: string })?.detail ?? "Yaratilmadi.",
				);
			}
			return data.kod;
		},
		onSuccess: () => {
			client.invalidateQueries({ queryKey: ["promokodlar"] });
			onCreated();
		},
	});

	return (
		<form
			className="mt-6 space-y-4"
			onSubmit={(e) => {
				e.preventDefault();
				create.mutate();
			}}
		>
			<Field
				label="Kod"
				value={kod}
				onChange={setKod}
				placeholder="YOZ2026"
				autoFocus
			/>

			<div className="grid gap-1.5">
				<Label>
					<span className="text-muted-foreground text-xs">Turi</span>
				</Label>
				<Select
					value={turi}
					onValueChange={(v) => setTuri(v as keyof typeof VALUE)}
				>
					<SelectTrigger className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{KINDS.map((k) => (
							<SelectItem key={k.value} value={k.value}>
								{k.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Field
				label={VALUE[turi].label}
				value={qiymati}
				onChange={setQiymati}
				placeholder={VALUE[turi].placeholder}
			/>

			{turi === "percent" && (
				<Field
					label="Eng ko'p chegirma"
					value={chegara}
					onChange={setChegara}
					placeholder="2 000 000"
					help="Bo'sh — chegarasiz"
				/>
			)}

			<fieldset>
				<legend className="text-muted-foreground text-xs">
					Nimaga ishlaydi
				</legend>
				<div className="mt-1.5 flex flex-wrap gap-1.5">
					{SCOPES.map((s) => (
						<Button
							key={s.value}
							type="button"
							variant={nimaga.includes(s.value) ? "default" : "outline"}
							size="sm"
							aria-pressed={nimaga.includes(s.value)}
							onClick={() =>
								setNimaga(
									nimaga.includes(s.value)
										? nimaga.filter((v) => v !== s.value)
										: [...nimaga, s.value],
								)
							}
						>
							{s.label}
						</Button>
					))}
				</div>
			</fieldset>

			<div className="grid grid-cols-2 gap-3">
				<Field
					label="Necha marta"
					value={nechaMarta}
					onChange={setNechaMarta}
					placeholder="100"
					help="Bo'sh — cheksiz"
				/>
				<Field
					label="Eng kam summa"
					value={engKam}
					onChange={setEngKam}
					placeholder="50 000"
					help="Bo'sh — yo'q"
				/>
			</div>

			<Field
				label="Tugashi"
				value={tugashi}
				onChange={setTugashi}
				placeholder="2026-12-31"
				help="Bo'sh — muddatsiz"
			/>

			<Label className="flex items-center gap-2 font-normal text-sm">
				<Checkbox
					checked={birMarta}
					onCheckedChange={(on) => setBirMarta(on === true)}
				/>
				Bitta hisob faqat bir marta
			</Label>

			<Field
				label="Izoh"
				value={izoh}
				onChange={setIzoh}
				placeholder="Yozgi aksiya"
				help="O'zingiz uchun — mijoz ko'rmaydi."
			/>

			<Button
				type="submit"
				size="lg"
				disabled={create.isPending}
				className="w-full"
			>
				{create.isPending ? "Yaratilmoqda…" : "Yaratish"}
			</Button>

			{create.isError && <Failed>{create.error.message}</Failed>}
		</form>
	);
}

/** "50 000" and "50000" mean the same number; an empty box means zero. */
function digits(text: string): number {
	return Number(text.replace(/\D/g, "")) || 0;
}
