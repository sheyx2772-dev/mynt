import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'data/auth_repository.dart';
import 'screens/activate_card_screen.dart';
import 'screens/analytics_screen.dart';
import 'screens/checkout_screen.dart';
import 'screens/claim_profile_screen.dart';
import 'screens/edit_profile_screen.dart';
import 'screens/exchange_contact_screen.dart';
import 'screens/handle_screen.dart';
import 'screens/home_screen.dart';
import 'screens/leads_screen.dart';
import 'screens/public_profile_screen.dart';
import 'screens/qr_screen.dart';
import 'screens/sign_in_screen.dart';
import 'screens/success_screen.dart';
import 'screens/tap_screen.dart';

/// Routes that require a session. The public profile and the tap flow are
/// deliberately not here — a stranger who taps a card is never signed in.
const _protectedPrefixes = ['/app', '/claim', '/checkout', '/activate'];

GoRouter buildRouter(AuthRepository auth) {
  return GoRouter(
    initialLocation: '/',
    refreshListenable: _AuthListenable(auth),
    redirect: (context, state) {
      final path = state.matchedLocation;
      final needsAuth = _protectedPrefixes.any(path.startsWith);
      if (needsAuth && !auth.isSignedIn) {
        return '/signin?next=${Uri.encodeComponent(state.uri.toString())}';
      }
      if (path == '/signin' && auth.isSignedIn) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
      GoRoute(
        path: '/signin',
        builder: (_, state) => SignInScreen(next: state.uri.queryParameters['next']),
      ),
      GoRoute(
        path: '/handle/:handle',
        builder: (_, state) =>
            HandleScreen(handle: state.pathParameters['handle']!.toUpperCase()),
      ),
      GoRoute(
        path: '/claim/:handle',
        builder: (_, state) =>
            ClaimProfileScreen(handle: state.pathParameters['handle']!.toUpperCase()),
      ),
      GoRoute(
        path: '/checkout/:handle',
        builder: (_, state) => CheckoutScreen(
          handle: state.pathParameters['handle']!.toUpperCase(),
          ownerName: state.uri.queryParameters['name'] ?? '',
          bio: state.uri.queryParameters['bio'] ?? '',
        ),
      ),
      GoRoute(
        path: '/success/:handle',
        builder: (_, state) => SuccessScreen(
          handle: state.pathParameters['handle']!.toUpperCase(),
          serial: state.uri.queryParameters['serial'],
        ),
      ),
      GoRoute(path: '/activate', builder: (_, __) => const ActivateCardScreen()),
      GoRoute(
        path: '/tap/:handle',
        builder: (_, state) =>
            TapScreen(handle: state.pathParameters['handle']!.toUpperCase()),
      ),
      GoRoute(
        path: '/p/:handle',
        builder: (_, state) =>
            PublicProfileScreen(handle: state.pathParameters['handle']!.toUpperCase()),
      ),
      GoRoute(
        path: '/exchange/:handle',
        builder: (_, state) =>
            ExchangeContactScreen(handle: state.pathParameters['handle']!.toUpperCase()),
      ),
      GoRoute(
        path: '/qr/:handle',
        builder: (_, state) =>
            QrScreen(handle: state.pathParameters['handle']!.toUpperCase()),
      ),
      GoRoute(path: '/app/leads', builder: (_, __) => const LeadsScreen()),
      GoRoute(path: '/app/analytics', builder: (_, __) => const AnalyticsScreen()),
      GoRoute(path: '/app/profile', builder: (_, __) => const EditProfileScreen()),
    ],
    errorBuilder: (_, state) => _RouteNotFound(location: state.uri.toString()),
  );
}

/// Bridges Supabase's auth stream to go_router's refresh mechanism.
class _AuthListenable extends ChangeNotifier {
  _AuthListenable(AuthRepository auth) {
    _subscription = auth.changes.listen((_) => notifyListeners());
  }

  late final dynamic _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

class _RouteNotFound extends StatelessWidget {
  const _RouteNotFound({required this.location});

  final String location;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Text(
            '"$location" topilmadi.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
