"use client";

import { useTransition } from "react";
import { LogOut, Package, UserRound } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/(cabinet)/[locale]/cabinet/actions";
import { Link } from "@/i18n/navigation";

// What belongs to the account rather than to a number.
//
// Two items behind one button. Orders are here because a person orders a card
// for one number and a ring for another in one sitting and wants one list;
// sign-out is here, second and under a line, because it is the one control on
// any screen that a thumb should not land on by accident.
//
// Sign-out is a server action: the backend is told first so the token dies
// everywhere, then the cookie goes (see `cabinet/actions.ts`). Nothing about
// who is signing out travels from here — the cookie is the whole identity.
export default function AccountMenu({
  labels,
}: {
  labels: { account: string; orders: string; signOut: string };
}) {
  const [pending, start] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={labels.account}
        className="flex size-11 items-center justify-center rounded-input text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <UserRound aria-hidden className="size-5" strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48 rounded-card">
        <DropdownMenuItem asChild className="h-11 rounded-plate">
          <Link href="/cabinet/orders">
            <Package aria-hidden strokeWidth={1.75} />
            {labels.orders}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          onSelect={() => start(() => signOut())}
          className="h-11 rounded-plate text-muted-foreground"
        >
          <LogOut aria-hidden strokeWidth={1.75} />
          {labels.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
