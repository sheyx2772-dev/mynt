import 'package:flutter/material.dart';

import '../theme/mynt_theme.dart';

/// The lime pill. One per screen — it is the money action.
class LimeButton extends StatelessWidget {
  const LimeButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.busy = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final Widget? icon;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !busy;
    return Opacity(
      opacity: enabled ? 1 : 0.6,
      child: DecoratedBox(
        decoration: const BoxDecoration(
          borderRadius: BorderRadius.all(Radius.circular(MyntRadii.pill)),
          boxShadow: MyntShadows.limeGlow,
        ),
        child: SizedBox(
          width: double.infinity,
          height: 52,
          child: FilledButton(
            onPressed: enabled ? onPressed : null,
            style: FilledButton.styleFrom(
              backgroundColor: MyntColors.lime,
              disabledBackgroundColor: MyntColors.lime,
              foregroundColor: MyntColors.black,
              disabledForegroundColor: MyntColors.black,
              elevation: 0,
              shape: const StadiumBorder(),
            ),
            child: busy
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.2,
                      color: MyntColors.black,
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (icon != null) ...[icon!, const SizedBox(width: 10)],
                      Text(
                        label,
                        style: MyntTypography.display(
                          size: 15,
                          letterSpacing: -0.005,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

/// The quiet alternative: same shape, hairline border, white fill.
class OutlineButton extends StatelessWidget {
  const OutlineButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final Widget? icon;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          backgroundColor: MyntColors.white,
          foregroundColor: MyntColors.black,
          side: const BorderSide(color: Color(0x1F000000)),
          shape: const StadiumBorder(),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[icon!, const SizedBox(width: 9)],
            Text(
              label,
              style: MyntTypography.body(size: 14, weight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }
}

/// Borderless, for the "no thanks" half of a pair.
class GhostButton extends StatelessWidget {
  const GhostButton({super.key, required this.label, required this.onPressed});

  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: TextButton(
        onPressed: onPressed,
        style: TextButton.styleFrom(
          foregroundColor: MyntColors.inkAt(0.5),
          shape: const StadiumBorder(),
        ),
        child: Text(
          label,
          style: MyntTypography.body(
            size: 14,
            weight: FontWeight.w500,
            color: MyntColors.inkAt(0.5),
          ),
        ),
      ),
    );
  }
}

/// The circular back chevron used on every pushed screen.
class BackPill extends StatelessWidget {
  const BackPill({super.key, this.onPressed});

  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 44,
      height: 44,
      child: Material(
        color: MyntColors.white,
        shape: const CircleBorder(
          side: BorderSide(color: Color(0x1F000000)),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onPressed ?? () => Navigator.of(context).maybePop(),
          child: const Icon(Icons.chevron_left, size: 22, color: MyntColors.black),
        ),
      ),
    );
  }
}
