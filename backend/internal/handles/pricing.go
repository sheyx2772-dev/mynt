// Package handles holds the rules about a number: what it costs, what a
// profile on it may contain, and what a link on that profile may point at.
//
// All of it is pure. Nothing here opens a database or reads a request, so the
// rules can be tested by stating them.
package handles

import (
	"regexp"
	"strings"
)

// A plain combination starts here and the rarity multipliers take it up from
// there. Round, because a price ending in nine reads as a discount and this is
// not a discounted thing.
const BasePrice = 100_000

// The tier is a multiplier of twenty, so every word added here takes a
// combination out of the hundred-thousand pool and puts it in a two-million
// one. It is a pricing decision, not a dictionary — a word belongs here when
// somebody would pay for it, not when it exists.
//
// Three groups. What a person is: the titles somebody puts on a card. Where
// they are: the ones that read as Uzbek rather than as English. And what
// anybody recognises anywhere.
//
// Uzbek words with an apostrophe — o‘, g‘ — cannot be here at all: a handle
// is three letters of A–Z, and "O‘ZB" is four characters of which one is not
// a letter.
var rareWords = map[string]bool{
	// What a person is, and what they do. The trades sell to a business rather
	// than to one person, which is a different and larger buyer.
	"VIP": true, "CEO": true, "CTO": true, "CFO": true, "MBA": true, "DEV": true,
	"DOC": true, "PRO": true, "BOS": true, "SIR": true, "BEK": true, "XON": true,
	"GYM": true, "SPA": true, "LAW": true, "MED": true, "WEB": true, "APP": true,
	"HUB": true, "LAB": true, "BAR": true, "TAX": true, "PAY": true, "FIT": true,
	"JOB": true, "CAR": true, "SEO": true, "NET": true,
	// Uzbek, written the way the alphabet here allows. `OSH` is the strongest
	// of them: every choyxona in the country wants it.
	"OTA": true, "ONA": true, "AKA": true, "OPA": true, "OYI": true, "JON": true,
	"DIL": true, "YOR": true, "PUL": true, "NON": true, "OSH": true, "SUV": true,
	"QOR": true, "KUN": true, "TUN": true, "YOZ": true, "KUZ": true, "TIL": true,
	"ISH": true, "GAP": true, "BOY": true, "SOZ": true,
	// Names. Three letters is a short name here, so there are few — but a
	// person buying their own name is the easiest sale there is.
	"ALI": true, "ABU": true, "UMR": true, "MIR": true,
	// Where they are: the cities, the way an airport writes them.
	"UZB": true, "NUR": true, "ZAR": true, "ASL": true, "TOY": true, "GUL": true,
	"SAM": true, "BUX": true, "XIV": true, "NAV": true, "AND": true, "FAR": true,
	// What anybody recognises.
	"GOD": true, "ACE": true, "WOW": true, "TOP": true, "LUX": true, "MAX": true,
	"WIN": true, "ONE": true, "KEY": true, "NEW": true, "ART": true, "ZEN": true,
	"SKY": true, "SUN": true, "GEM": true, "FLY": true, "FOX": true, "ICE": true,
	"BIG": true, "BUY": true,
}

var handlePattern = regexp.MustCompile(`^([A-Z]{3})([0-9]{3})$`)
var serialPattern = regexp.MustCompile(`^[0-9]{6}$`)

// Rarity is a multiplier and the reason for it, because the site shows the
// buyer the whole breakdown before they pay. A price with no explanation reads
// as one somebody made up.
type Rarity struct {
	Multiplier int
	Reason     string
}

func LetterRarity(letters string) Rarity {
	l := strings.ToUpper(letters)
	if len(l) != 3 {
		return Rarity{1, "oddiy kombinatsiya"}
	}

	switch {
	case l[0] == l[1] && l[1] == l[2]:
		return Rarity{30, "3 ta bir xil harf (masalan AAA)"}
	case rareWords[l]:
		return Rarity{20, "tanish/qisqa so'z (masalan VIP)"}
	case l[0] == l[2]:
		return Rarity{4, "palindrom shakl (masalan ABA)"}
	default:
		return Rarity{1, "oddiy kombinatsiya"}
	}
}

func DigitRarity(digits string) Rarity {
	if len(digits) != 3 {
		return Rarity{1, "oddiy raqam"}
	}

	d := [3]int{int(digits[0] - '0'), int(digits[1] - '0'), int(digits[2] - '0')}

	switch {
	case d[0] == d[1] && d[1] == d[2]:
		return Rarity{40, "3 ta bir xil raqam (masalan 000, 777)"}
	case d[0] == 0 && d[1] == 0:
		return Rarity{15, "boshida ikkita nol (00X)"}
	case d[1] == d[0]+1 && d[2] == d[1]+1, d[1] == d[0]-1 && d[2] == d[1]-1:
		return Rarity{12, "ketma-ket raqamlar (masalan 123)"}
	case d[0] == d[2]:
		return Rarity{5, "palindrom raqam (masalan 121)"}
	default:
		return Rarity{1, "oddiy raqam"}
	}
}

// Price in so'm.
//
// Always recomputed here, never taken from a request. A price that arrives with
// the order is a price the buyer chose.
func Price(letters, digits string) int {
	return BasePrice * LetterRarity(letters).Multiplier * DigitRarity(digits).Multiplier
}

// Parsed is a number that has been checked, so that everything downstream can
// stop checking.
type Parsed struct {
	Letters string
	Digits  string
}

func (p Parsed) Normalized() string { return p.Letters + p.Digits }
func (p Parsed) Price() int         { return Price(p.Letters, p.Digits) }

// Parse accepts a number in any case and returns it in ours, or reports that it
// is not one. Every route that takes a number in its path starts here, so an
// invalid one never reaches a query.
func Parse(raw string) (Parsed, bool) {
	match := handlePattern.FindStringSubmatch(strings.ToUpper(strings.TrimSpace(raw)))
	if match == nil {
		return Parsed{}, false
	}
	// A blocked combination fails here rather than being refused later, so
	// every caller gets the refusal without having to remember to ask: the
	// search, the purchase, the profile page and the panel all go through this
	// one function. See blocked.go for what is on the list and why.
	if blockedWords[match[1]] {
		return Parsed{}, false
	}
	return Parsed{Letters: match[1], Digits: match[2]}, true
}

// ParseSerial accepts a genesis card's six-digit manufacturing number, which is
// a different namespace from the handles above and not interchangeable with
// them.
func ParseSerial(raw string) (string, bool) {
	serial := strings.TrimSpace(raw)
	if !serialPattern.MatchString(serial) {
		return "", false
	}
	return serial, true
}
