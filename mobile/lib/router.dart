import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'screens/buy_screen.dart';
import 'screens/edit_profile_screen.dart';
import 'screens/leads_screen.dart';
import 'screens/number_screen.dart';
import 'screens/numbers_screen.dart';
import 'screens/sign_in_screen.dart';
import 'screens/stats_screen.dart';
import 'screens/tag_screen.dart';
import 'state/session_controller.dart';

/// Where the app can be, and who may be there.
///
/// The guard is on the router rather than inside each screen. A screen that
/// forgets to check is the way a private screen becomes a public one, and
/// there is no way to forget a check that a screen does not make.
///
/// It guards navigation, not data. Everything private is fetched with a
/// session the backend verifies, so a route reached some other way still shows
/// nothing — this is the first line, not the only one.
GoRouter buildRouter(Ref ref) {
  return GoRouter(
    initialLocation: '/',
    // The router rebuilds its guard whenever the session changes, so signing
    // out moves the person off a private screen rather than leaving them on
    // one that has quietly stopped loading.
    refreshListenable: _SessionChanges(ref),
    redirect: (context, state) {
      final session = ref.read(sessionProvider);

      // While the stored token is being checked, nothing is redirected: sending
      // somebody to sign in and then back again makes the app flash on every
      // cold start.
      if (session.isLoading) return null;

      final signedIn = session.value != null;
      final atSignIn = state.matchedLocation == '/kirish';

      if (!signedIn && !atSignIn) {
        // Where they were going, so they land there instead of on a list.
        final next = Uri.encodeComponent(state.matchedLocation);
        return '/kirish?keyin=$next';
      }
      if (signedIn && atSignIn) return '/';

      return null;
    },
    routes: [
      GoRoute(
        path: '/kirish',
        builder: (context, state) => SignInScreen(
          next: state.uri.queryParameters['keyin'],
        ),
      ),
      GoRoute(path: '/', builder: (_, _) => const NumbersScreen()),
      GoRoute(path: '/olish', builder: (_, _) => const BuyScreen()),
      GoRoute(
        path: '/raqam/:raqam',
        builder: (_, state) => NumberScreen(number: state.pathParameters['raqam']!),
        routes: [
          GoRoute(
            path: 'tahrirlash',
            builder: (_, state) => EditProfileScreen(number: state.pathParameters['raqam']!),
          ),
          GoRoute(
            path: 'vizitkalar',
            builder: (_, state) => LeadsScreen(number: state.pathParameters['raqam']!),
          ),
          GoRoute(
            path: 'statistika',
            builder: (_, state) => StatsScreen(number: state.pathParameters['raqam']!),
          ),
          GoRoute(
            path: 'teg',
            builder: (_, state) => TagScreen(number: state.pathParameters['raqam']!),
          ),
        ],
      ),
    ],
  );
}

/// Turns the session provider into something GoRouter will listen to.
class _SessionChanges extends ChangeNotifier {
  _SessionChanges(Ref ref) {
    ref.listen(sessionProvider, (_, _) => notifyListeners());
  }
}
