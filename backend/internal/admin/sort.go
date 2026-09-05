package admin

// Which column a list is ordered by.
//
// The client sends a name, never a column. The name is looked up in a table
// per list, and anything not in that table falls back to the list's default —
// so a column name cannot arrive from outside, and no string reaches the SQL.
// The SQL itself matches on the name in a `case`, which is why nothing here
// builds a query.

// Sort is a column name and a direction, as a list has settled on them.
type Sort struct {
	Key        string
	Descending bool
}

var (
	orderKeys   = map[string]bool{"raqam": true, "xaridor": true, "summa": true, "holat": true, "ochilgan": true}
	handleKeys  = map[string]bool{"raqam": true, "egasi": true, "tarif": true, "tolangan": true, "olingan": true}
	accountKeys = map[string]bool{"kim": true, "raqamlar": true, "tolagan": true, "oxirgi_tolov": true, "qoshilgan": true}
)

// OrderSort, HandleSort and AccountSort each keep a request to the columns
// their list actually has.
func OrderSort(key string, desc bool) Sort   { return pick(orderKeys, key, desc, "ochilgan") }
func HandleSort(key string, desc bool) Sort  { return pick(handleKeys, key, desc, "olingan") }
func AccountSort(key string, desc bool) Sort { return pick(accountKeys, key, desc, "tolagan") }

func pick(allowed map[string]bool, key string, desc bool, fallback string) Sort {
	if !allowed[key] {
		// An unknown key is not an error to shout about: it is a stale bookmark
		// or a renamed column, and the useful answer is the list in its usual
		// order rather than a 400.
		return Sort{Key: fallback, Descending: true}
	}
	return Sort{Key: key, Descending: desc}
}
