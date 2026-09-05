package orders

// What a device order is doing, and what it costs.
//
// Both are here rather than on the website, because both decide money and
// access. A price that arrives with a request is a discount anybody can grant
// themselves; a state transition the client chooses is a queue anybody can
// reorder. The website keeps its own copy of the state machine so it can grey a
// button out, but this is the one that refuses.

// Device is a thing that can be made. Priced separately from the number: a
// number is scarce and its price follows that, while a device is manufactured
// and its price follows what it costs to make.
const (
	Card     = "card"
	Ring     = "ring"
	Bracelet = "bracelet"
)

var devicePrices = map[string]int64{
	Card:     200_000,
	Ring:     350_000,
	Bracelet: 250_000,
}

// DevicePrice reports what a kind of device costs, and whether it exists.
func DevicePrice(deviceType string) (int64, bool) {
	price, ok := devicePrices[deviceType]
	return price, ok
}

// The six states in orders_fulfilment_check, and what may follow what.
//
// Forward only, with two exceptions that are real rather than theoretical: a
// parcel that comes back has to be able to go out again, and a queue can be
// re-ordered by putting something back. Nothing leaves `address_needed` except
// into the queue, because until there is an address there is nowhere to send it
// — and that step is not here at all, it belongs to the buyer writing one.
var nextState = map[string][]string{
	"address_needed": {"queued"},
	"queued":         {"making", "returned"},
	"making":         {"shipped", "queued"},
	"shipped":        {"delivered", "returned"},
	"delivered":      {"returned"},
	"returned":       {"queued"},
}

// canAdvance reports whether the operator may move an order from one state to
// another.
func canAdvance(from, to string) bool {
	for _, allowed := range nextState[from] {
		if allowed == to {
			return true
		}
	}
	return false
}
