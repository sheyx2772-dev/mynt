import 'dart:async';

import 'package:app_links/app_links.dart';
import 'config.dart';

/// Links that open the app from outside it.
///
/// Two: the sign-in link, which carries a token worth an account for the next
/// fifteen minutes, and the address a payment provider returns a buyer to. That makes this the most security-sensitive entry
/// point in the app, because unlike everything else the input arrives from
/// somewhere the app did not ask.
///
/// Two rules follow, and both are enforced below.
///
/// The host is checked. Android verifies our own domain through
/// `assetlinks.json` before handing the link over, but a link can also arrive
/// from a share sheet or a custom scheme somebody else registered, and this
/// code should not depend on the platform having been careful.
///
/// The token is used and forgotten. It is never stored, never logged, and never
/// put into a route — a token in a route is a token in a back stack.
class DeepLinks {
  DeepLinks({required this.onSignIn, required this.onOrder});

  /// Called with the token from a valid sign-in link. Functions rather than a
  /// Ref so that this class has no opinion about how the app holds its state,
  /// and so a test can pass ones that record what they were given.
  final void Function(String token) onSignIn;

  /// Called with the id of an order somebody has come back from paying for.
  final void Function(String orderId) onOrder;
  final _links = AppLinks();
  StreamSubscription<Uri>? _subscription;

  void listen() {
    // `uriLinkStream` yields the link that launched the app as well as later
    // ones, so a cold start from a sign-in mail is handled by the same path.
    _subscription = _links.uriLinkStream.listen(handle);
  }

  void stop() {
    _subscription?.cancel();
    _subscription = null;
  }

  /// Acts on one link. Public because it is the whole of the security
  /// decision here, and a decision that cannot be tested by name gets tested
  /// by nobody.
  void handle(Uri uri) {
    if (!_isOurs(uri)) return;

    if (uri.path == '/kirish/tasdiq') {
      final token = uri.queryParameters['t'];
      if (token == null || token.isEmpty) return;

      // Spent immediately. If it fails — expired, already used — the session
      // controller records the error and the sign-in screen shows it.
      onSignIn(token);
      return;
    }

    // /buyurtma/{id}. The id is not a secret and carries no authority: the
    // order is read back over an authenticated request, under the caller's own
    // account, so a link to somebody else's order shows nothing.
    final segments = uri.pathSegments;
    if (segments.length == 2 && segments.first == 'buyurtma' && segments[1].isNotEmpty) {
      onOrder(segments[1]);
    }
  }

  /// Whether a link claims to be from the site this app belongs to.
  ///
  /// Compared against the configured site rather than a literal, so a build
  /// pointed at a development server still signs in — and a link from anywhere
  /// else is dropped in silence, because answering it at all would tell the
  /// sender the app is installed.
  bool _isOurs(Uri uri) {
    final site = Uri.parse(Config.siteBaseUrl);
    return uri.scheme == site.scheme && uri.host == site.host;
  }
}
