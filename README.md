# Flex

Digital identity for Uzbekistan: a rare handle, a public profile, and an NFC
card that opens it with one tap. `flex.com.uz/MYN042` is somebody's profile.

New here? Read [HANDOFF.md](HANDOFF.md) — the current state, where the keys
are, and the things that were learned the hard way. [AGENTS.md](AGENTS.md)
describes the four applications and how to start them.

| Folder | What it is |
|---|---|
| [`backend/`](backend) | Go + Postgres. The only thing that touches the database. |
| [`landing/`](landing) | The public site. Its own [README](landing/README.md) is the long one — pricing, payments, analytics, the deck. |
| [`admin/`](admin) | The panel, behind a sign-in. |
| [`mobile/`](mobile) | The Flutter app. |
