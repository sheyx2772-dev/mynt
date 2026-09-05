import { useState } from "react";

import type { Sort } from "./data-table";

/**
 * The state every list screen keeps: what it is filtered to, how it is
 * ordered, and where in it the reader is.
 *
 * Together rather than as four `useState` calls, because three of the four
 * have to reset the fourth. Changing the filter while standing on page four
 * asks the server for rows 150–200 of a list that may now hold twelve, and
 * gets an empty table back.
 */
export function useList<K extends string>(
	defaultSort: Sort<K>,
	// The first rung of the size selector, and a screenful on a laptop without
	// scrolling. A list that opens taller than the window makes the pager —
	// the thing that says how much there is — the part nobody sees.
	defaultSize = 25,
) {
	const [search, setSearch] = useState("");
	const [sort, setSortState] = useState<Sort<K>>(defaultSort);
	const [skip, setSkip] = useState(0);
	const [size, setSizeState] = useState(defaultSize);

	return {
		search,
		sort,
		skip,
		size,
		setSkip,
		setSize: setSizeState,
		onSearch: (term: string) => {
			setSearch(term);
			setSkip(0);
		},
		setSort: (next: Sort<K>) => {
			setSortState(next);
			setSkip(0);
		},
		/** The query parameters, spelled the way the API spells them. */
		query: {
			qidiruv: search || undefined,
			tartib: sort.key,
			teskari: sort.desc,
			soni: size,
			otkazish: skip,
		},
	};
}
