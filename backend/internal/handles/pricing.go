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

// Combinations that are worth something because they are words rather than
// because of their shape.
var rareWords = map[string]bool{
	"VIP": true, "CEO": true, "GOD": true, "SIR": true,
	"ACE": true, "WOW": true, "TOP": true, "BOS": true,
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
