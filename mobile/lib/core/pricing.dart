/// Port of `src/lib/pricing.ts`. The server recomputes the price on every
/// claim, so this copy is for display only — but it has to agree with the
/// server exactly or the price shown differs from the price charged.
library;

const int basePrice = 99000;

const _rareWords = {'VIP', 'CEO', 'GOD', 'SIR', 'ACE', 'WOW', 'TOP', 'BOS'};

class Rarity {
  const Rarity(this.multiplier, this.reason);
  final int multiplier;
  final String reason;
}

Rarity letterRarity(String letters) {
  final l = letters.toUpperCase();
  if (l.length != 3) return const Rarity(1, 'oddiy kombinatsiya');
  if (l[0] == l[1] && l[1] == l[2]) {
    return const Rarity(30, '3 ta bir xil harf');
  }
  if (_rareWords.contains(l)) return const Rarity(20, "tanish qisqa so'z");
  if (l[0] == l[2]) return const Rarity(4, 'palindrom shakl');
  return const Rarity(1, 'oddiy kombinatsiya');
}

Rarity digitRarity(String digits) {
  if (digits.length != 3) return const Rarity(1, 'oddiy raqam');
  final d = digits.split('').map(int.parse).toList();
  if (d[0] == d[1] && d[1] == d[2]) {
    return const Rarity(40, '3 ta bir xil raqam');
  }
  if (d[0] == 0 && d[1] == 0) return const Rarity(15, 'boshida ikkita nol');
  final ascending = d[1] == d[0] + 1 && d[2] == d[1] + 1;
  final descending = d[1] == d[0] - 1 && d[2] == d[1] - 1;
  if (ascending || descending) {
    return const Rarity(12, 'ketma-ket raqamlar');
  }
  if (d[0] == d[2]) return const Rarity(5, 'palindrom raqam');
  return const Rarity(1, 'oddiy raqam');
}

int priceForHandle(String letters, String digits) =>
    basePrice * letterRarity(letters).multiplier * digitRarity(digits).multiplier;

/// A vanity handle: three letters then three digits (`MYN042`).
class ParsedHandle {
  const ParsedHandle(this.letters, this.digits);
  final String letters;
  final String digits;

  String get normalized => '$letters$digits';
  int get price => priceForHandle(letters, digits);
}

final _handlePattern = RegExp(r'^([A-Z]{3})(\d{3})$');
final _serialPattern = RegExp(r'^\d{6}$');

ParsedHandle? parseHandle(String raw) {
  final match = _handlePattern.firstMatch(raw.toUpperCase());
  if (match == null) return null;
  return ParsedHandle(match.group(1)!, match.group(2)!);
}

/// Genesis cards are pure six-digit manufacturing serials — a separate
/// series from the vanity handles above.
String? parseGenesisSerial(String raw) =>
    _serialPattern.hasMatch(raw) ? raw : null;
