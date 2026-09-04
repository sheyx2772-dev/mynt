import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api/client.dart';
import '../core/api/flex_api.dart';
import '../core/models/handle.dart';
import '../core/models/lead.dart';
import '../core/models/stats.dart';
import '../core/session.dart';

/// What the app is made of, and where each piece is built.
///
/// Everything is constructed through a provider rather than reached for, so a
/// test can replace the API with one that answers from memory without any
/// screen knowing.

final sessionStoreProvider = Provider<SessionStore>((ref) => SessionStore());

final apiProvider = Provider<FlexApi>((ref) {
  return FlexApi(ApiClient(ref.watch(sessionStoreProvider)));
});

/// The numbers this account owns. Kept alive across screens so that returning
/// to the cabinet from a profile edit does not blank the list while it reloads.
final myNumbersProvider = FutureProvider<List<Handle>>((ref) {
  return ref.watch(apiProvider).myNumbers();
});

final numberProvider = FutureProvider.family<Handle, String>((ref, number) {
  return ref.watch(apiProvider).number(number);
});

final leadsProvider = FutureProvider.family<List<Lead>, String>((ref, number) {
  return ref.watch(apiProvider).leads(number);
});

/// How many days of history the statistics screen is showing.
///
/// A provider rather than screen state so that changing it refetches through
/// the same path everything else uses, and so the choice survives leaving the
/// screen and coming back.
class StatsDays extends Notifier<int> {
  @override
  int build() => 30;

  void set(int days) => state = days;
}

final statsDaysProvider = NotifierProvider<StatsDays, int>(StatsDays.new);

final statsProvider = FutureProvider.family<Stats, String>((ref, number) {
  return ref.watch(apiProvider).stats(number, days: ref.watch(statsDaysProvider));
});
