import { Badge } from "@/components/ui/badge";

const LABEL: Record<string, string> = {
	pending: "kutilmoqda",
	paid: "to'langan",
	cancelled: "bekor",
	failed: "xato",
};

/**
 * An order's status, written the same way on every screen.
 *
 * Colour alone does not say it — the word is there too, because roughly one man
 * in twelve cannot tell the green from the amber.
 */
export function Status({
	status,
	provider,
}: {
	status: string;
	provider?: string | null;
}) {
	return (
		<span className="inline-flex items-center gap-1.5">
			<Badge
				variant={
					status === "paid"
						? "default"
						: status === "pending"
							? "outline"
							: "ghost"
				}
				className={
					status === "pending"
						? "border-amber-500/40 text-amber-700"
						: status === "paid"
							? ""
							: "text-muted-foreground"
				}
			>
				{LABEL[status] ?? status}
			</Badge>
			{provider && (
				<span className="text-muted-foreground text-xs">{provider}</span>
			)}
		</span>
	);
}
