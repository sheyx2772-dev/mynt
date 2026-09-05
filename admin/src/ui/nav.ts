import {
	Gift,
	Hash,
	LayoutDashboard,
	ReceiptText,
	TicketPercent,
	Users,
} from "lucide-react";

/**
 * The panel's sections, in the order somebody works through them.
 *
 * Its own file, and data rather than JSX: the sidebar draws it, the header
 * reads the current one's title out of it, and a screen that appears in one
 * and not the other is the sort of thing nobody notices for a month.
 */
export const SECTIONS = [
	{ path: "/", label: "Umumiy", icon: LayoutDashboard },
	{ path: "/buyurtmalar", label: "Buyurtmalar", icon: ReceiptText },
	{ path: "/raqamlar", label: "Raqamlar", icon: Hash },
	{ path: "/hisoblar", label: "Hisoblar", icon: Users },
	{ path: "/sovga", label: "Sovg'a", icon: Gift },
	{ path: "/promokod", label: "Promokod", icon: TicketPercent },
] as const;
