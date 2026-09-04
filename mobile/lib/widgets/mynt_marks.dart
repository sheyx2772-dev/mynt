import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/mynt_theme.dart';

/// The wordmark: a rounded black tile with a lime dot, then "mynt".
class MyntWordmark extends StatelessWidget {
  const MyntWordmark({super.key, this.size = 26, this.onDark = false});

  final double size;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final tile = onDark ? MyntColors.lime : MyntColors.black;
    final dot = onDark ? MyntColors.black : MyntColors.lime;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: tile,
            borderRadius: BorderRadius.circular(size * 0.27),
          ),
          child: Center(
            child: Container(
              width: size * 0.27,
              height: size * 0.27,
              decoration: BoxDecoration(color: dot, shape: BoxShape.circle),
            ),
          ),
        ),
        SizedBox(width: size * 0.31),
        Text(
          'mynt',
          style: MyntTypography.display(
            size: size * 0.73,
            color: onDark ? MyntColors.white : MyntColors.black,
            letterSpacing: -0.01,
          ),
        ),
      ],
    );
  }
}

/// The four concentric arcs of the NFC glyph. Drawn rather than shipped as
/// an asset so it recolours and scales cleanly.
class _NfcPainter extends CustomPainter {
  const _NfcPainter(this.color, this.strokeWidth);

  final Color color;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    // Arcs open to the left, growing rightwards — the same rhythm as the
    // lucide `nfc` icon the web app uses.
    final center = Offset(size.width * 0.06, size.height / 2);
    const sweep = math.pi * 0.62;
    for (var i = 0; i < 4; i++) {
      final radius = size.width * (0.24 + i * 0.24);
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -sweep / 2,
        sweep,
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_NfcPainter old) =>
      old.color != color || old.strokeWidth != strokeWidth;
}

class NfcMark extends StatelessWidget {
  const NfcMark({super.key, this.size = 26, this.color = MyntColors.lime});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _NfcPainter(color, size * 0.065)),
    );
  }
}

/// The uppercase section label that sits above every list.
class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key, this.color});

  final String text;
  final Color? color;

  @override
  Widget build(BuildContext context) =>
      Text(text.toUpperCase(), style: MyntTypography.eyebrow(color: color));
}

/// The lime-tinted status pill ("Bo'sh") and its muted twin ("Band qilingan").
class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.label, this.available = true});

  final String label;
  final bool available;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 26,
      padding: const EdgeInsets.symmetric(horizontal: 11),
      decoration: BoxDecoration(
        color: available
            ? MyntColors.lime.withValues(alpha: 0.22)
            : MyntColors.inkAt(0.07),
        borderRadius: BorderRadius.circular(MyntRadii.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (available)
            Container(
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                color: MyntColors.lime,
                shape: BoxShape.circle,
              ),
            )
          else
            Icon(Icons.lock_outline, size: 12, color: MyntColors.inkAt(0.55)),
          const SizedBox(width: 7),
          Text(
            label.toUpperCase(),
            style: MyntTypography.body(
              size: 10,
              weight: FontWeight.w600,
              color: MyntColors.inkAt(available ? 0.7 : 0.55),
            ).copyWith(letterSpacing: 0.9),
          ),
        ],
      ),
    );
  }
}
