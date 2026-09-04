/// Configuration comes in through `--dart-define-from-file=env.json` so no
/// key is ever committed to source. Only the ANON key belongs here: the
/// service_role key must never ship inside an app binary, which is why
/// claiming a handle and activating a card go through the API instead.
abstract final class MyntConfig {
  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

  /// The Next.js app that owns the service_role key.
  static const apiBaseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: 'https://mynt.uz');

  /// Where a tapped card sends a phone.
  static const profileBaseUrl =
      String.fromEnvironment('PROFILE_BASE_URL', defaultValue: 'https://mynt.uz');

  static bool get isConfigured =>
      supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;

  static String profileUrl(String handle) => '$profileBaseUrl/$handle';
}
