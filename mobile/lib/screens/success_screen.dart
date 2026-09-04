import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/mynt_theme.dart';
import '../widgets/mynt_background.dart';
import '../widgets/mynt_buttons.dart';
import '../widgets/mynt_cards.dart';
import '../widgets/mynt_fields.dart';
import '../widgets/mynt_marks.dart';

class SuccessScreen extends StatelessWidget {
  const SuccessScreen({super.key, required this.handle, this.serial});

  final String handle;

  /// Set once a physical card has been assigned to the order.
  final String? serial;

  @override
  Widget build(BuildContext context) {
    return MyntScaffold(
      showGrid: false,
      glows: const [Alignment(0, -0.6)],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Spacer(),
          Center(
            child: Container(
              width: 76,
              height: 76,
              decoration: const BoxDecoration(
                color: MyntColors.lime,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Color(0xCCABFF09),
                    blurRadius: 40,
                    spreadRadius: -12,
                    offset: Offset(0, 18),
                  ),
                ],
              ),
              child: const Icon(Icons.check_rounded, size: 38, color: MyntColors.black),
            ),
          ),
          const SizedBox(height: 26),
          Text(
            '$handle sizniki.',
            textAlign: TextAlign.center,
            style: MyntTypography.display(size: 32, height: 1.1, letterSpacing: -0.03),
          ),
          const SizedBox(height: 10),
          Text(
            'Profilingiz shu daqiqadan ishlaydi. '
            'NFC karta 3–5 ish kunida yetkaziladi.',
            textAlign: TextAlign.center,
            style: MyntTypography.body(
              size: 14,
              height: 1.55,
              color: MyntColors.inkAt(0.55),
            ),
          ),
          const SizedBox(height: 30),
          MyntDarkCard(
            radius: 24,
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  children: [
                    InitialsAvatar(
                      initials: handle.substring(0, 2),
                      size: 48,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            handle,
                            style: MyntTypography.tabular(
                              size: 16,
                              weight: FontWeight.w600,
                              color: MyntColors.white,
                              displayFace: true,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'mynt.uz/$handle',
                            style: MyntTypography.tabular(
                              size: 12,
                              weight: FontWeight.w400,
                              color: Colors.white.withValues(alpha: 0.5),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const NfcMark(size: 26),
                  ],
                ),
                if (serial != null) ...[
                  const SizedBox(height: 18),
                  Container(
                    padding: const EdgeInsets.only(top: 16),
                    decoration: BoxDecoration(
                      border: Border(
                        top: BorderSide(
                          color: Colors.white.withValues(alpha: 0.12),
                        ),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'MYNT CARD SERIYA',
                          style: MyntTypography.body(
                            size: 11,
                            color: Colors.white.withValues(alpha: 0.45),
                          ).copyWith(letterSpacing: 1),
                        ),
                        Text(
                          '#$serial',
                          style: MyntTypography.tabular(
                            size: 15,
                            weight: FontWeight.w600,
                            color: MyntColors.lime,
                            displayFace: true,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          const Spacer(),
          LimeButton(
            label: "Profilni ko'rish",
            onPressed: () => context.go('/p/$handle'),
          ),
          const SizedBox(height: 10),
          OutlineButton(
            label: 'Kartani aktivlashtirish',
            onPressed: () => context.go('/activate'),
          ),
        ],
      ),
    );
  }
}
