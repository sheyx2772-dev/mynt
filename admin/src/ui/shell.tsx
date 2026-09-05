import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";

import { SECTIONS } from "./nav";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";

// The frame every screen sits in: sections down the left, who you are and
// where you are across the top.
//
// A sidebar rather than a row of tabs because the list keeps growing — six
// sections already, and gifts, leads and payouts are all coming. Tabs run out
// of width and then start hiding things; a sidebar just gets longer.
export function Shell({
	email,
	onSignOut,
}: {
	email: string;
	onSignOut: () => void;
}) {
	return (
		<SidebarProvider>
			<Sidebar collapsible="icon">
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							{/* The mark stays when the rail collapses and the words do not:
							    a 3rem rail cannot hold "Boshqaruv", and letting it try is
							    what spills the title across the icons. */}
							<SidebarMenuButton size="lg" asChild>
								<Link to="/">
									<span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-lime font-semibold text-flex-black">
										F
									</span>
									<span className="grid flex-1 leading-tight">
										<span className="text-muted-foreground text-[0.65rem] uppercase tracking-[0.2em]">
											Flex
										</span>
										<span className="font-semibold">Boshqaruv</span>
									</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>

				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								{SECTIONS.map((s) => (
									<Item
										key={s.path}
										path={s.path}
										label={s.label}
										icon={<s.icon />}
									/>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</Sidebar>

			<SidebarInset>
				<Header email={email} onSignOut={onSignOut} />
				{/* Capped, because a five-column table stretched across a 27-inch
				    monitor puts the amount and its status a hand-span apart. */}
				<main className="w-full max-w-7xl p-4 md:p-6">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

function Item({
	path,
	label,
	icon,
}: {
	path: string;
	label: string;
	icon: ReactNode;
}) {
	const { pathname } = useLocation();
	// "/" would otherwise match every path, so the front page is compared whole.
	const active = path === "/" ? pathname === "/" : pathname.startsWith(path);

	return (
		<SidebarMenuItem>
			<SidebarMenuButton asChild isActive={active} tooltip={label}>
				<Link to={path}>
					{icon}
					<span>{label}</span>
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}

function Header({
	email,
	onSignOut,
}: {
	email: string;
	onSignOut: () => void;
}) {
	const { pathname } = useLocation();
	const here = SECTIONS.find((s) =>
		s.path === "/" ? pathname === "/" : pathname.startsWith(s.path),
	);

	return (
		<header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
			<SidebarTrigger className="-ml-1" />
			<Separator orientation="vertical" className="mr-1 h-4" />
			<h1 className="font-medium">{here?.label ?? "Boshqaruv"}</h1>

			<div className="ml-auto flex items-center gap-1">
				<span className="hidden text-muted-foreground text-sm sm:inline">
					{email}
				</span>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Chiqish"
					onClick={onSignOut}
				>
					<LogOut />
				</Button>
			</div>
		</header>
	);
}
