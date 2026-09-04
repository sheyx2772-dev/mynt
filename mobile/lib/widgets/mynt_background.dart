import 'package:flutter/material.dart';

import '../theme/mynt_theme.dart';

/// The dot grid from `globals.css`: 1px dots on a 22px pitch, faded out
/// with a radial mask so it never reads as a hard edge.
class _DotGridPainter extends CustomPainter {
  const _DotGridPainter(this.color);

  final Color color;

  static const _pitch = 22.0;
  static const _radius = 1.0;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    for (var y = _pitch / 2; y < size.height; y += _pitch) {
      for (var x = _pitch / 2; x < size.width; x += _pitch) {
        canvas.drawCircle(Offset(x, y), _radius, paint);
      }
    }
  }

  @override
  bool shouldRepaint(_DotGridPainter oldDelegate) => oldDelegate.color != color;
}

class DotGrid extends StatelessWidget {
  const DotGrid({
    super.key,
    this.onDark = false,
    this.alignment = const Alignment(0, -1),
  });

  final bool onDark;
  final Alignment alignment;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: ShaderMask(
        blendMode: BlendMode.dstIn,
        shaderCallback: (bounds) => RadialGradient(
          center: alignment,
          radius: 0.9,
          colors: const [Colors.black, Colors.transparent],
          stops: const [0.0, 1.0],
        ).createShader(bounds),
        child: CustomPaint(
          painter: _DotGridPainter(
            onDark
                ? Colors.white.withValues(alpha: 0.14)
                : MyntColors.inkAt(0.14),
          ),
          size: Size.infinite,
        ),
      ),
    );
  }
}

/// The soft lime bloom behind the hero areas. A radial gradient rather than
/// a blurred circle — same look, no per-frame blur.
class LimeGlow extends StatelessWidget {
  const LimeGlow({
    super.key,
    required this.alignment,
    this.diameter = 300,
    this.opacity = 0.28,
  });

  final Alignment alignment;
  final double diameter;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Align(
        alignment: alignment,
        child: SizedBox(
          width: diameter,
          height: diameter,
          child: DecoratedBox(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  MyntColors.lime.withValues(alpha: opacity),
                  MyntColors.lime.withValues(alpha: 0),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Every screen sits on this: background colour, optional dot grid, one or
/// two glows, then the content inside safe area padding.
class MyntScaffold extends StatelessWidget {
  const MyntScaffold({
    super.key,
    required this.child,
    this.dark = false,
    this.showGrid = true,
    this.glows = const [Alignment(1.4, -1.1)],
    this.padding = const EdgeInsets.fromLTRB(24, 12, 24, 24),
    this.bottomBar,
  });

  final Widget child;
  final bool dark;
  final bool showGrid;
  final List<Alignment> glows;
  final EdgeInsets padding;
  final Widget? bottomBar;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: dark ? MyntColors.black : MyntColors.white,
      body: Stack(
        children: [
          if (showGrid) Positioned.fill(child: DotGrid(onDark: dark)),
          for (final alignment in glows)
            Positioned.fill(child: LimeGlow(alignment: alignment)),
          Positioned.fill(
            child: SafeArea(
              child: Column(
                children: [
                  Expanded(
                    child: Padding(padding: padding, child: child),
                  ),
                  if (bottomBar != null) bottomBar!,
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
