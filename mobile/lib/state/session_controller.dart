import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api/errors.dart';
import 'providers.dart';

/// Who is signed in, as far as the app knows.
///
/// `null` means nobody. The value is the account's address, which is the only
/// thing about a person this app holds — everything else it shows belongs to a
/// number and is fetched when a screen asks for it.
class SessionController extends AsyncNotifier<String?> {
  @override
  Future<String?> build() => _whoAmI();

  /// Asks the backend whose session this is.
  ///
  /// The stored token is not inspected — it is opaque, and a token that looks
  /// valid can have been revoked. Asking is the only way to know, and it is one
  /// request at start-up.
  Future<String?> _whoAmI() async {
    final token = await ref.read(sessionStoreProvider).read();
    if (token == null) return null;

    try {
      return await ref.read(apiProvider).whoAmI();
    } on ApiException catch (error) {
      // A session the server no longer recognises is cleared here rather than
      // left to fail on the next screen. Anything else — the phone is offline —
      // keeps the token: being on a train is not a reason to be signed out.
      if (error.failure == ApiFailure.unauthorized) {
        await ref.read(sessionStoreProvider).clear();
      }
      return null;
    }
  }

  /// Spends a sign-in link and stores the session it returns.
  Future<void> confirm(String linkToken) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final token = await ref.read(apiProvider).confirmLink(linkToken);
      if (token.isEmpty) throw ApiException.server;

      await ref.read(sessionStoreProvider).write(token);
      return ref.read(apiProvider).whoAmI();
    });
  }

  /// Ends this session on the server and forgets it here.
  ///
  /// The local token is cleared whatever the server said. A person who pressed
  /// sign out on a phone with no signal must still end up signed out on the
  /// phone in their hand; the server-side session expires on its own.
  Future<void> signOut() async {
    try {
      await ref.read(apiProvider).signOut();
    } on ApiException {
      // Deliberately swallowed. See above.
    }
    await ref.read(sessionStoreProvider).clear();
    ref.invalidate(myNumbersProvider);
    state = const AsyncValue.data(null);
  }
}

final sessionProvider =
    AsyncNotifierProvider<SessionController, String?>(SessionController.new);
