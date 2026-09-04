import 'package:flutter/material.dart';

import '../brand/palette.dart';

/// The one prominent button. Lime is a surface here, never text: it sits at
/// 1.2:1 on white and would be unreadable as a foreground colour.
class LimeButton extends StatelessWidget {
  const LimeButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.busy = false,
  });

  final String label;
  final VoidCallback? onPressed;

  /// While busy the button keeps its size and stops accepting taps, so a slow
  /// network cannot produce two of whatever it does.
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: FilledButton(
        onPressed: busy ? null : onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: Brand.lime,
          foregroundColor: Brand.black,
          disabledBackgroundColor: Brand.lime.withValues(alpha: 0.5),
          disabledForegroundColor: Brand.black.withValues(alpha: 0.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        child: busy
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: Brand.black),
              )
            : Text(label),
      ),
    );
  }
}

/// A quieter action, for what a screen offers rather than what it is for.
class OutlineButton extends StatelessWidget {
  const OutlineButton({super.key, required this.label, required this.onPressed, this.icon});

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: icon == null ? null : Icon(icon, size: 18),
        label: Text(label),
        style: OutlinedButton.styleFrom(
          foregroundColor: Brand.black,
          side: BorderSide(color: Brand.black.withValues(alpha: 0.15)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
        ),
      ),
    );
  }
}
