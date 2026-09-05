import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * A search box that submits, rather than one that fires on every keystroke.
 *
 * These searches hit the database across every order and every handle; running
 * one per typed letter would put six queries behind a six-letter number for an
 * answer only the last one gives.
 */
export function Search({
	placeholder,
	onSearch,
}: {
	placeholder: string;
	onSearch: (term: string) => void;
}) {
	const [term, setTerm] = useState("");

	return (
		<form
			className="mb-4 flex gap-2"
			onSubmit={(e) => {
				e.preventDefault();
				onSearch(term.trim());
			}}
		>
			<Input
				value={term}
				onChange={(e) => setTerm(e.target.value)}
				placeholder={placeholder}
				className="flex-1"
			/>
			<Button type="submit">Qidirish</Button>
		</form>
	);
}
