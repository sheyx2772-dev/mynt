# mobile

The Flutter app. Android and iOS; no web target, deliberately — the landing
site already installs to a home screen and is the better answer for a browser.

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8090
flutter analyze     # must be clean before anything is committed
flutter test
```

`10.0.2.2` is how the Android emulator reaches the host machine. A real phone
on the same Wi-Fi needs the laptop's address on that network instead.

## What this app is for

The parts of the product a phone does better than a browser: writing an NFC
tag, reading one, the camera, the address book. Everything else — the menu
editor, invoices, team administration — stays in the panel, where a keyboard
and a large screen already make it easier. A second copy of a screen is a
second place for it to be wrong.

## Rules that are not negotiable

**No key ships in the binary.** Anything compiled into an app is published:
`strings` on the downloaded file is enough to read it. The app holds no API
key at all. It authenticates as a person, with a session the backend issued to
that person, and every decision that money or ownership depends on is made on
the server.

**Configuration comes in through `--dart-define`.** A build against a laptop
and a build for the store differ by a command line, not by an edited file
somebody can commit by accident.

**The session goes in secure storage, never in shared preferences.** Keystore
on Android, Keychain on iOS, and the manifest turns off backup and device
transfer so neither carries it to another phone. A restored session is an
account handed over without anybody signing in.

**Nothing about a person is logged.** No token, no email address, no lead. A
crash report is read by whoever asks for it.

**A tapped link is data.** A URL arriving from NFC, a QR code or a deep link
was written by somebody else. Its host is checked before it is opened and it is
never followed straight into an authenticated action.

## The brand

`lib/brand/` holds the colours and the mark, copied from the landing site's
`globals.css`. A phone cannot read a stylesheet at build time, so the rule is
that the two change in the same commit.
