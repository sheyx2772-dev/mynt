import 'package:flutter/material.dart';

import '../theme/mynt_theme.dart';

/// The white panel: 28px radius, hairline border, one long soft shadow.
class MyntCard extends StatelessWidget {
  const MyntCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(24),
    this.radius = MyntRadii.card,
    this.shadow = true,
  });

  final Widget child;
  final EdgeInsets padding;
  final double radius;
  final bool shadow;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: MyntColors.white,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: MyntColors.hairline),
        boxShadow: shadow ? MyntShadows.card : null,
      ),
      child: child,
    );
  }
}

/// The dark card, with the diagonal sheen the web app paints over it.
class MyntDarkCard extends StatelessWidget {
  const MyntDarkCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(24),
    this.radius = MyntRadii.card,
    this.showGrid = false,
  });

  final Widget child;
  final EdgeInsets padding;
  final double radius;
  final bool showGrid;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: MyntColors.black,
        borderRadius: BorderRadius.circular(radius),
        boxShadow: MyntShadows.darkCard,
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Colors.white.withValues(alpha: 0.10),
                    Colors.white.withValues(alpha: 0),
                    Colors.white.withValues(alpha: 0),
                    Colors.white.withValues(alpha: 0.06),
                  ],
                  stops: const [0.0, 0.45, 0.6, 1.0],
                ),
              ),
            ),
          ),
          Padding(padding: padding, child: child),
        ],
      ),
    );
  }
}

/// One row of the price breakdown: label, optional reason, trailing value.
class BreakdownRow extends StatelessWidget {
  const BreakdownRow({
    super.key,
    required this.label,
    required this.value,
    this.reason,
    this.muted = false,
    this.topBorder = true,
  });

  final String label;
  final String value;
  final String? reason;
  final bool muted;
  final bool topBorder;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 13),
      decoration: BoxDecoration(
        border: topBorder
            ? const Border(top: BorderSide(color: MyntColors.hairlineSoft))
            : null,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: MyntTypography.body(
                    size: 13,
                    weight: muted ? FontWeight.w400 : FontWeight.w500,
                    color: muted ? MyntColors.inkAt(0.55) : MyntColors.black,
                  ),
                ),
                if (reason != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    reason!,
                    style: MyntTypography.body(
                      size: 11,
                      color: MyntColors.inkAt(0.4),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text(
            value,
            style: MyntTypography.tabular(
              size: muted ? 13 : 15,
              weight: muted ? FontWeight.w400 : FontWeight.w600,
              color: muted ? MyntColors.inkAt(0.55) : MyntColors.black,
              displayFace: !muted,
            ),
          ),
        ],
      ),
    );
  }
}

/// The total row — label on the left, lime chip on the right.
class TotalRow extends StatelessWidget {
  const TotalRow({super.key, required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(top: 16),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: MyntColors.hairlineSoft)),
      ),
      child: Row(
        children: [
          Expanded(child: Text(label, style: MyntTypography.display(size: 16))),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: MyntColors.lime,
              borderRadius: BorderRadius.circular(MyntRadii.field),
              boxShadow: MyntShadows.limeGlow,
            ),
            child: Text(
              value,
              style: MyntTypography.tabular(
                size: 17,
                weight: FontWeight.w600,
                displayFace: true,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
