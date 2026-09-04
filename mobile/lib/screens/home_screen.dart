import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../app.dart';
import '../core/formatting.dart';
import '../core/pricing.dart';
import '../theme/mynt_theme.dart';
import '../widgets/mynt_background.dart';
import '../widgets/mynt_buttons.dart';
import '../widgets/mynt_cards.dart';
import '../widgets/mynt_fields.dart';
import '../widgets/mynt_marks.dart';

/// 26^3 * 10^3 — the whole vanity namespace, quoted on the web hero.
const _namespaceSize = 26 * 26 * 26 * 10 * 10 * 10;

const _popular = [
  ('VIP', '007'),
  ('ACE', '777'),
  ('BOS', '001'),
];

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _letters = TextEditingController(text: 'MYN');
  final _digits = TextEditingController(text: '042');

  @override
  void dispose() {
    _letters.dispose();
    _digits.dispose();
    super.dispose();
  }

  /// The inputs may be mid-edit ("MY", ""), so pad before pricing rather
  /// than refusing to show a number.
  String get _paddedLetters =>
      '${_letters.text.toUpperCase().replaceAll(RegExp('[^A-Z]'), '')}XXX'
          .substring(0, 3);

  String get _paddedDigits =>
      '${_digits.text.replaceAll(RegExp('[^0-9]'), '')}000'.substring(0, 3);

  void _pick(String letters, String digits) {
    setState(() {
      _letters.text = letters;
      _digits.text = digits;
    });
  }

  @override
  Widget build(BuildContext context) {
    final letters = _paddedLetters;
    final digits = _paddedDigits;
    final lr = letterRarity(letters);
    final dr = digitRarity(digits);
    final total = priceForHandle(letters, digits);
    final signedIn = MyntServices.of(context).auth.isSignedIn;

    return MyntScaffold(
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const MyntWordmark(),
                SizedBox(
                  height: 44,
                  child: OutlinedButton(
                    onPressed: () =>
                        context.go(signedIn ? '/app/profile' : '/signin'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: MyntColors.black,
                      side: const BorderSide(color: Color(0x1F000000)),
                      shape: const StadiumBorder(),
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                    ),
                    child: Text(
                      signedIn ? 'Profilim' : 'Kirish',
                      style: MyntTypography.body(size: 13, weight: FontWeight.w500),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            Container(
              height: 28,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: MyntColors.lime.withValues(alpha: 0.22),
                borderRadius: BorderRadius.circular(MyntRadii.pill),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: MyntColors.lime,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 7),
                  Text(
                    '${formatNumber(_namespaceSize)} kombinatsiya',
                    style: MyntTypography.body(
                      size: 10,
                      weight: FontWeight.w600,
                      color: MyntColors.inkAt(0.7),
                    ).copyWith(letterSpacing: 0.9),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              "Handle'ingizni\ntanlang.",
              style: MyntTypography.display(
                size: 36,
                height: 1.06,
                letterSpacing: -0.035,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              '3 harf + 3 raqam. Narx faqat kamyoblikka qarab hisoblanadi — '
              "yashirin to'lov yo'q.",
              style: MyntTypography.body(
                size: 14,
                height: 1.5,
                color: MyntColors.inkAt(0.55),
              ),
            ),
            const SizedBox(height: 26),
            MyntCard(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      HandleField(
                        letters: _letters,
                        digits: _digits,
                        onLettersChanged: (_) => setState(() {}),
                        onDigitsChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'mynt.uz/$letters$digits',
                          style: MyntTypography.tabular(
                            size: 12,
                            weight: FontWeight.w400,
                            color: MyntColors.inkAt(0.4),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  BreakdownRow(
                    label: 'Harf kamyobligi',
                    reason: lr.reason,
                    value: '×${lr.multiplier}',
                  ),
                  BreakdownRow(
                    label: 'Raqam kamyobligi',
                    reason: dr.reason,
                    value: '×${dr.multiplier}',
                  ),
                  TotalRow(label: 'Jami narx', value: formatUZS(total)),
                  const SizedBox(height: 18),
                  LimeButton(
                    label: 'Band qilish',
                    onPressed: () => context.push('/handle/$letters$digits'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            const Eyebrow('Mashhur kombinatsiyalar'),
            const SizedBox(height: 10),
            Row(
              children: [
                for (final (l, d) in _popular) ...[
                  Expanded(
                    child: SizedBox(
                      height: 44,
                      child: OutlinedButton(
                        onPressed: () => _pick(l, d),
                        style: OutlinedButton.styleFrom(
                          backgroundColor: MyntColors.fieldFill,
                          side: const BorderSide(color: MyntColors.hairline),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(MyntRadii.field),
                          ),
                          padding: EdgeInsets.zero,
                        ),
                        child: Text(
                          '$l$d',
                          style: MyntTypography.tabular(
                            size: 14,
                            weight: FontWeight.w600,
                            displayFace: true,
                          ),
                        ),
                      ),
                    ),
                  ),
                  if ((l, d) != _popular.last) const SizedBox(width: 8),
                ],
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
