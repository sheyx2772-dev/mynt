/// Where the app points, and nothing else.
///
/// Every value arrives through `--dart-define`, so a build for the phone in
/// somebody's hand and a build against a laptop differ by a command line rather
/// than by an edited file that can be committed by accident.
///
/// Nothing secret is here, and nothing secret can be. Anything compiled into an
/// app is readable by anyone who downloads it — `strings` on the binary is
/// enough — so the app holds no key at all. It authenticates as a person, with
/// a session the backend issued to that person, and every privileged decision
/// is made on the server.
library;

abstract final class Config {
  /// The backend. Overridden for development:
  ///
  ///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8090
  ///
  /// 10.0.2.2 is how the Android emulator reaches the host machine; a real
  /// phone on the same Wi-Fi needs the laptop's address on that network.
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://flex-nfc.uz',
  );

  /// Where a tapped card sends a phone. The same host in production, and
  /// deliberately separate from [apiBaseUrl] so a local backend can be used
  /// while the profile links still point at the real site.
  static const siteBaseUrl = String.fromEnvironment(
    'SITE_BASE_URL',
    defaultValue: 'https://flex-nfc.uz',
  );

  /// The API is versioned because three clients read it and they are updated on
  /// their own schedules — an app store review can take a week.
  static const apiPrefix = '/v1';

  static Uri api(String path, [Map<String, dynamic>? query]) =>
      Uri.parse('$apiBaseUrl$apiPrefix$path').replace(queryParameters: query);

  /// What is written to an NFC tag, and what a QR code encodes.
  ///
  /// The `src` marker is what lets an owner see that the card itself is being
  /// used rather than a link somebody shared. The site issues `qr` and `share`
  /// for the other two.
  static String tagUrl(String handle) => '$siteBaseUrl/$handle?src=nfc';

  static String profileUrl(String handle) => '$siteBaseUrl/$handle';
}
