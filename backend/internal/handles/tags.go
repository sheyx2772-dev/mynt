package handles

import (
	"strings"
	"unicode"
)

// Tags, which are rendered as "#tag" and used in search.

// ParseTags reduces what somebody typed to letters and digits.
//
// Tags are rendered as "#tag" and used in search, so anything that would need
// escaping in either place is removed rather than stored and worked around.
func ParseTags(raw string) []string {
	seen := make(map[string]bool, maxTags)
	tags := make([]string, 0, maxTags)

	for _, piece := range strings.FieldsFunc(raw, func(r rune) bool {
		return r == ',' || unicode.IsSpace(r)
	}) {
		var clean strings.Builder
		for _, r := range strings.TrimPrefix(piece, "#") {
			if unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_' {
				clean.WriteRune(r)
			}
			if clean.Len() >= 20 {
				break
			}
		}

		tag := clean.String()
		if tag == "" || seen[tag] {
			continue
		}
		seen[tag] = true
		tags = append(tags, tag)

		if len(tags) >= maxTags {
			break
		}
	}

	return tags
}
