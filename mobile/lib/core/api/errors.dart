/// What went wrong, in a form a screen can act on.
///
/// Dio's own exception carries a request, a response and a stack trace, and
/// showing any of it to somebody is how an internal host name ends up on a
/// phone screen. Everything that leaves the API layer is one of these instead:
/// a kind the screen can branch on, and a sentence in Uzbek it can display.
enum ApiFailure {
  /// The phone could not reach the server at all.
  offline,

  /// Nobody is signed in, or the session has ended. The screen sends the
  /// person back to sign in rather than showing an error.
  unauthorized,

  /// The number does not exist, or does not belong to this account. The two
  /// are deliberately indistinguishable.
  notFound,

  /// The person's input was refused, and [ApiException.message] says why.
  rejected,

  /// Too many attempts.
  tooMany,

  /// Something broke on the server. There is nothing the person can do.
  server,
}

class ApiException implements Exception {
  const ApiException(this.failure, this.message);

  final ApiFailure failure;

  /// Always safe to put on screen: it comes from the API's own Uzbek text, or
  /// from the fallbacks below when the server said nothing useful.
  final String message;

  static const offline = ApiException(
    ApiFailure.offline,
    'Internet yo\'q. Ulanishni tekshiring.',
  );

  static const server = ApiException(
    ApiFailure.server,
    'Nimadir noto\'g\'ri ketdi. Keyinroq urinib ko\'ring.',
  );

  @override
  String toString() => message;
}
