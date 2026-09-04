/// Prices, as somebody in Tashkent reads them.
///
/// A number like 120000000 on a screen is unreadable, and a comma is not what
/// is used here — the separator is a space, and the currency is said in words
/// rather than shown as a symbol.
String som(int amount) {
  final digits = amount.abs().toString();
  final buffer = StringBuffer();

  for (var i = 0; i < digits.length; i++) {
    // A space every three digits, counted from the right.
    if (i > 0 && (digits.length - i) % 3 == 0) buffer.write(' ');
    buffer.write(digits[i]);
  }

  return "${amount < 0 ? '-' : ''}$buffer so'm";
}
