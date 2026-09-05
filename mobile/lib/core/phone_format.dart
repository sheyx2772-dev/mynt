import 'package:flutter/services.dart';

/// Groups a phone number as it is typed.
///
/// `+998901234567` is thirteen characters with nothing to hold on to: there is
/// no way to check you typed it right except to read it a digit at a time, and
/// no way to fix the middle of it without counting. Grouped, the eye reads it
/// the way it is spoken — "to'qson, bir yigirma uch, qirq besh, oltmish yetti".
///
/// The formatter works on digits and re-inserts the spaces, so a paste, a
/// backspace in the middle and an autofilled number all come out the same.
class PhoneFormatter extends TextInputFormatter {
  const PhoneFormatter();

  /// The dial codes, longest first — 998 has to be tested before 99 would be,
  /// and 7 last of all.
  ///
  /// Close to `auth.dialCodes` in the backend but not identical, and the
  /// difference is deliberate. The backend lists 77 so it can tell a Kazakh
  /// number from a Russian one, which share +7. Nobody writes a Kazakh number
  /// that way: it is +7 701 999 88 77 on every sign in Almaty. Splitting for
  /// the country is one job and grouping for the eye is another.
  static const _dialCodes = ['998', '996', '992', '971', '90', '44', '7', '1'];

  /// How the national part is grouped, per dial code. Uzbek numbers are said
  /// as 2-3-2-2, which is why they are written that way on every shopfront in
  /// the country. Anything unlisted falls back to threes, which is wrong for
  /// nobody in particular and unreadable for nobody either.
  static const _groups = {
    '998': [2, 3, 2, 2],
    '996': [3, 3, 3],
    '992': [2, 3, 4],
    '971': [2, 3, 4],
    '90': [3, 3, 2, 2],
    // Russia and Kazakhstan both.
    '7': [3, 3, 2, 2],
    '1': [3, 3, 4],
  };

  @override
  TextEditingValue formatEditUpdate(TextEditingValue before, TextEditingValue after) {
    final digits = after.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.isEmpty) {
      return const TextEditingValue(text: '+');
    }

    // A number longer than any real one is refused rather than truncated: the
    // person is typing something that is not a phone number and should see
    // that immediately.
    if (digits.length > 15) return before;

    final formatted = format(digits);

    // The caret goes wherever the same number of digits now sits. Counting
    // digits rather than characters is what survives a space being inserted in
    // front of the caret, which is the whole difficulty here.
    final digitsBeforeCaret = after.text
        .substring(0, after.selection.baseOffset.clamp(0, after.text.length))
        .replaceAll(RegExp(r'[^0-9]'), '')
        .length;

    var offset = formatted.length;
    var seen = 0;
    for (var i = 0; i < formatted.length; i++) {
      if (seen == digitsBeforeCaret) {
        offset = i;
        break;
      }
      if (RegExp(r'[0-9]').hasMatch(formatted[i])) seen++;
    }

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: offset),
    );
  }

  /// `998901234567` becomes `+998 90 123 45 67`.
  static String format(String digits) {
    final dial = _dialCodes.firstWhere(digits.startsWith, orElse: () => '');
    if (dial.isEmpty) return '+$digits';

    final rest = digits.substring(dial.length);
    if (rest.isEmpty) return '+$dial';

    final buffer = StringBuffer('+$dial');
    var at = 0;
    for (final size in _groups[dial] ?? const [3, 3, 3, 3, 3]) {
      if (at >= rest.length) break;
      final end = (at + size).clamp(0, rest.length);
      buffer.write(' ${rest.substring(at, end)}');
      at = end;
    }
    // Anything past the last group — a number longer than the pattern expects —
    // is kept rather than dropped. Losing a digit somebody typed is worse than
    // an odd-looking group.
    if (at < rest.length) buffer.write(' ${rest.substring(at)}');

    return buffer.toString();
  }
}
