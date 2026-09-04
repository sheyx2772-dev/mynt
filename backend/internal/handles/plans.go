package handles

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

// The six designs the site can draw. A stored value the renderer does not know
// would be a blank card, so anything else falls back rather than being kept.
var cardDesigns = map[string]bool{
	"genesis": true, "xarita": true, "naqsh": true,
	"humo": true, "paxta": true, "tun": true,
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
