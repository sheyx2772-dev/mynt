import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * A labelled input with an optional line of help under it.
 *
 * One component rather than a Label and an Input at every call site: the label
 * has to be tied to the input for a screen reader and for a click on the words
 * to focus the box, and doing that by hand at a dozen call sites is a dozen
 * chances to forget.
 */
export function Field({
	label,
	value,
	onChange,
	placeholder,
	help,
	type = "text",
	required,
	autoFocus,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	help?: ReactNode;
	type?: string;
	required?: boolean;
	autoFocus?: boolean;
}) {
	return (
		<div className="grid gap-1.5">
			<Label>
				<span className="text-muted-foreground text-xs">{label}</span>
			</Label>
			<Input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				required={required}
				// biome-ignore lint/a11y/noAutofocus: the one field a form opens on
				autoFocus={autoFocus}
			/>
			{help && <p className="text-muted-foreground text-xs">{help}</p>}
		</div>
	);
}
