package handles

import "time"

// What a subscription buys, and what the site is able to draw.

// What a plan buys.
//
// The column says what was bought; the date says whether it still holds, and a
// lapsed premium falls back to free rather than going dark — the number was
// paid for and stays reachable. This is the only place the two are read
// together, so nothing downstream has to remember the rule.
const (
	PlanFree    = "free"
	PlanPremium = "premium"
)

// Services a profile may list, by plan. Five on free rather than three: a
// services list is the reason a tradesman or a lawyer keeps the card at all,
// and the premium difference has to come from what the free plan can afford to
// lack — the statistics, the contacts collected — not from cutting the feature
// that sells the product.
var serviceLimits = map[string]int{PlanFree: 5, PlanPremium: 8}

func ServiceLimit(plan string) int {
	if limit, ok := serviceLimits[plan]; ok {
		return limit
	}
	return serviceLimits[PlanFree]
}

// The designs the site can draw. A stored value the renderer does not know
// would be a blank card, so anything else falls back rather than being kept.
//
// This list is the same ten the database's check constraint allows
// (00013_xarita_design.sql) and the same ten landing/src/lib/card-designs.ts
// renders. It had drifted from both: it listed humo, paxta and tun, which the
// constraint would have refused on write, and it was missing seven the site
// offers — so a buyer choosing Polat, Suzani or Rahbar in the cabinet was
// silently given Genesis, with no error and nothing to tell them why. Any
// change here belongs in all three places at once.
var cardDesigns = map[string]bool{
	"genesis": true, "lime": true, "grid": true, "sheen": true, "naqsh": true,
	"paper": true, "rahbar": true, "devops": true, "suzani": true, "xarita": true,
}

const (
	DefaultCardDesign = "genesis"
	DefaultDeviceType = "card"
)

func CardDesign(raw string) string {
	if cardDesigns[raw] {
		return raw
	}
	return DefaultCardDesign
}

var deviceTypes = map[string]bool{"card": true, "ring": true, "bracelet": true}

func DeviceType(raw string) string {
	if deviceTypes[raw] {
		return raw
	}
	return DefaultDeviceType
}

// EffectivePlan is the plan as it stands today rather than the column.
//
// The column says what was bought; the date says whether it still holds. A
// lapsed premium falls back to free rather than going dark — the number was
// paid for and stays reachable, it just stops carrying the premium features.
// The rule lives here so nothing downstream has to remember it.
func EffectivePlan(plan string, expires *time.Time) string {
	if plan != PlanPremium {
		return PlanFree
	}
	// No date on a premium row means it does not lapse — a gift, or a plan
	// settled some other way. Treated as still holding, because the alternative
	// silently downgrades somebody who paid.
	if expires == nil {
		return PlanPremium
	}
	if expires.Before(time.Now()) {
		return PlanFree
	}
	return PlanPremium
}
