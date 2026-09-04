import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/mynt_theme.dart';
import '../widgets/mynt_background.dart';
import '../widgets/mynt_marks.dart';

/// What a phone shows in the second between the card being tapped and the
/// profile resolving. Purely a transition — it forwards on its own.
class TapScreen extends StatefulWidget {
  const TapScreen({super.key, required this.handle});

  final String handle;

  @override
  State<TapScreen> createState() => _TapScreenState();
}

class _TapScreenState extends State<TapScreen> with TickerProviderStateMixin {
  late final AnimationController _rings;
  late final AnimationController _reveal;

  @override
  void initState() {
    super.initState();
    _rings = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2600),
    )..repeat();
    _reveal = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    )..forward();

    Future.delayed(const Duration(milliseconds: 1800), () {
      if (mounted) context.pushReplacement('/p/${widget.handle}');
    });
  }

  @override
  void dispose() {
    _rings.dispose();
    _reveal.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MyntScaffold(
      dark: true,
      glows: const [Alignment(0, -0.1)],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Align(
            alignment: Alignment.centerLeft,
            child: MyntWordmark(size: 24, onDark: true),
          ),
          const Spacer(),
          SizedBox(
            height: 260,
            child: Stack(
              alignment: Alignment.center,
              children: [
                for (var i = 0; i < 3; i++)
                  AnimatedBuilder(
                    animation: _rings,
                    builder: (context, _) {
                      // Three rings a third of a cycle apart, each scaling
                      // out and fading as it goes.
                      final t = (_rings.value + i / 3) % 1.0;
                      return Opacity(
                        opacity: (1 - t) * (t < 0.12 ? t / 0.12 : 1),
                        child: Container(
                          width: 260 * (0.35 + 0.65 * t),
                          height: 260 * (0.35 + 0.65 * t),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: MyntColors.lime.withValues(alpha: 0.55),
                              width: 1.5,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                Container(
                  width: 96,
                  height: 96,
                  decoration: const BoxDecoration(
                    color: MyntColors.lime,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Color(0xBFABFF09),
                        blurRadius: 50,
                        spreadRadius: -14,
                        offset: Offset(0, 20),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: NfcMark(size: 42, color: MyntColors.black),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 44),
          FadeTransition(
            opacity: _reveal,
            child: SlideTransition(
              position: Tween(
                begin: const Offset(0, 0.25),
                end: Offset.zero,
              ).animate(
                CurvedAnimation(parent: _reveal, curve: Curves.easeOutCubic),
              ),
              child: Column(
                children: [
                  Text(
                    "KARTA O'QILDI",
                    style: MyntTypography.body(
                      size: 12,
                      weight: FontWeight.w600,
                      color: MyntColors.lime.withValues(alpha: 0.85),
                    ).copyWith(letterSpacing: 1.7),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    widget.handle,
                    style: MyntTypography.tabular(
                      size: 44,
                      weight: FontWeight.w600,
                      color: MyntColors.white,
                      displayFace: true,
                      letterSpacing: -0.03,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'mynt.uz/${widget.handle}',
                    style: MyntTypography.tabular(
                      size: 14,
                      weight: FontWeight.w400,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const Spacer(),
          Text(
            'Profil ochilmoqda…',
            textAlign: TextAlign.center,
            style: MyntTypography.body(
              size: 13,
              height: 1.5,
              color: Colors.white.withValues(alpha: 0.4),
            ),
          ),
        ],
      ),
    );
  }
}
