package handles

// Letter combinations that are not for sale at any price.
//
// This is not the rare-word list with the sign flipped. A rare word is priced
// high because somebody wants it; these are refused because selling them would
// do damage that no price makes up for — and the damage is done to people who
// never bought anything.
//
// A blocked combination is treated as though it were never part of the
// namespace: `Parse` refuses it, so a search says the number does not exist
// and a purchase gets the same 404 an invented format gets. Nothing tells the
// caller why. A message naming the reason is a message that maps the list.
//
// Checked against the letters alone, so all thousand numbers behind a blocked
// word go with it.
var blockedWords = map[string]bool{
	// Government bodies. The one group here that is a safety rule rather than
	// a taste one: a profile at MVD001 is a profile that can be mistaken for
	// an official channel, and somebody will believe what it says. It costs us
	// ten thousand combinations and removes a way to defraud people.
	"MVD": true, "IIB": true, "SSB": true, "DXX": true, "GAI": true,
	"YHX": true, "PRK": true, "GNK": true, "MCH": true, "SES": true,

	// Obscene in English.
	"SEX": true, "XXX": true, "PRN": true, "ASS": true, "FUK": true,
	"FCK": true, "CUM": true, "DIC": true, "DIK": true, "COK": true,
	"TIT": true, "NUD": true, "POR": true,

	// Obscene in Russian, written in Latin letters — which is how they are
	// actually typed here, and why a list of English words alone would have
	// caught none of them.
	"XUY": true, "XUI": true, "HUY": true, "HUI": true, "PIZ": true,
	"BLY": true, "BLD": true, "SUK": true, "EBA": true, "EBI": true,
	"EBU": true, "PID": true, "MUD": true, "NAX": true,

	// Obscene in Uzbek and Turkish. The shortest list of the three and the one
	// most likely to be incomplete — it was written by somebody who does not
	// speak the language natively, and it should be extended by somebody who
	// does rather than left as if it were finished.
	"SIK": true, "KOT": true, "AMK": true, "QIN": true, "SKM": true, "AMG": true,

	// Slurs. Blocked for what they are used to do to somebody, not for what
	// they mean.
	"GAY": true, "FAG": true,

	// Sacred names. Not obscene and not dangerous — simply not ours to sell as
	// a decoration on a card, and a profile behind one is a profile somebody
	// can point at and be offended by on our behalf.
	"ALH": true, "XUD": true, "QUR": true, "HAJ": true,
}

// Blocked reports whether a combination of letters may not be sold.
//
// Exported so the panel can say why a number that looks free is not listed,
// which is the one place the reason is allowed to be visible.
func Blocked(letters string) bool {
	return blockedWords[letters]
}
