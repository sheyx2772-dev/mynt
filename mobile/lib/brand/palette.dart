import 'package:flutter/material.dart';

/// The brand, as Flutter sees it.
///
/// The values are the ones in the website's `globals.css`. They are copied
/// rather than fetched — a phone cannot read a stylesheet at build time — so
/// the rule is that this file changes in the same commit as that one.
abstract final class Brand {
  /// The mark colour. Sits at 1.2:1 on white, so it is a surface and an accent,
  /// never text on a light background.
  static const lime = Color(0xFFABFF09);

  /// The same hue darkened until it passes contrast. This is the one to write
  /// small text and data labels in.
  static const limeInk = Color(0xFF6B9E00);

  static const black = Color(0xFF0E0A1B);
  static const white = Color(0xFFFFFFFF);

  /// Gold marks a paid subscription rather than a card design — see the
  /// website's `PLAN_ACCENT`, which this has to agree with.
  static const premium = Color(0xFFD9C48F);
}
