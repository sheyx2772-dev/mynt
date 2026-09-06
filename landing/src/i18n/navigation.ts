import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// Link, redirect and the router, already knowing the language.
//
// Imported from here rather than from `next/link` and `next/navigation`, so a
// href written as `/narxlar` is rendered as `/ru/narxlar` for a Russian reader
// without every call site remembering to say so. A plain `next/link` still
// works and still goes where it says — it just leaves the reader's language
// behind, which is a bug nobody sees until they are two pages in and reading
// Uzbek again.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
