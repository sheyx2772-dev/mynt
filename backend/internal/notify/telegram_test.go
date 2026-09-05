package notify

import "testing"

// A lead's name reaches the message exactly as somebody typed it into a public
// form, and Telegram parses the message as HTML.
func TestEscapeHTMLClosesTelegramsMarkup(t *testing.T) {
	cases := map[string]string{
		"Aziz":                    "Aziz",
		"<b>Aziz</b>":             "&lt;b&gt;Aziz&lt;/b&gt;",
		"Ali & Vali":              "Ali &amp; Vali",
		"</b><a href='x'>tap</a>": "&lt;/b&gt;&lt;a href='x'&gt;tap&lt;/a&gt;",
		// The ampersand has to be replaced first or the escapes are escaped.
		"&lt;": "&amp;lt;",
	}
	for in, want := range cases {
		if got := escapeHTML(in); got != want {
			t.Errorf("escapeHTML(%q) = %q, want %q", in, got, want)
		}
	}
}

// A deployment with no bot token has no channel, rather than one that fails on
// every notice.
func TestNewTelegramIsNilWithoutAToken(t *testing.T) {
	if NewTelegram("") != nil {
		t.Error("built a channel with no token")
	}
	if NewTelegram("123:abc") == nil {
		t.Error("refused a token")
	}
}
