import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// The palette is lifted verbatim from the web app's `src/app/globals.css`
/// so the two clients cannot drift apart.
abstract final class MyntColors {
  static const lime = Color(0xFFABFF09);
  static const black = Color(0xFF0E0A1B);
  static const white = Color(0xFFFFFFFF);

  /// Ink at the opacities the web app uses (`text-mynt-black/55` etc).
  static const ink = black;
  static Color inkAt(double opacity) => black.withValues(alpha: opacity);

  /// Hairlines and fills are `black/10`, `black/[0.02]` on the web —
  /// pure black, not mynt-black, which is why these are not `inkAt`.
  static const hairline = Color(0x1A000000);
  static const hairlineSoft = Color(0x0F000000);
  static const fieldFill = Color(0x05000000);

  /// Positive delta / "available" green. Darker than lime so it passes
  /// contrast as text, which lime does not.
  static const positive = Color(0xFF4D7C0F);
}

abstract final class MyntRadii {
  static const card = 28.0;
  static const panel = 22.0;
  static const control = 14.0;
  static const field = 12.0;
  static const pill = 9999.0;
}

abstract final class MyntShadows {
  static const card = [
    BoxShadow(
      color: Color(0x400E0A1B),
      blurRadius: 60,
      spreadRadius: -30,
      offset: Offset(0, 30),
    ),
  ];

  static const darkCard = [
    BoxShadow(
      color: Color(0x8C0E0A1B),
      blurRadius: 70,
      spreadRadius: -25,
      offset: Offset(0, 35),
    ),
  ];

  static const limeGlow = [
    BoxShadow(
      color: Color(0xA6ABFF09),
      blurRadius: 30,
      spreadRadius: -10,
      offset: Offset(0, 12),
    ),
  ];
}

abstract final class MyntTypography {
  /// Space Grotesk — headings, numbers, the wordmark.
  static TextStyle display({
    required double size,
    FontWeight weight = FontWeight.w600,
    Color color = MyntColors.black,
    double letterSpacing = -0.02,
    double? height,
  }) {
    return GoogleFonts.spaceGrotesk(
      fontSize: size,
      fontWeight: weight,
      color: color,
      letterSpacing: size * letterSpacing,
      height: height,
    );
  }

  /// Inter — body copy.
  static TextStyle body({
    required double size,
    FontWeight weight = FontWeight.w400,
    Color color = MyntColors.black,
    double? height,
  }) {
    return GoogleFonts.inter(
      fontSize: size,
      fontWeight: weight,
      color: color,
      height: height,
    );
  }

  /// Tabular figures — handles, prices, serials, counts. Anything that
  /// should not jitter as digits change.
  static TextStyle tabular({
    required double size,
    FontWeight weight = FontWeight.w500,
    Color color = MyntColors.black,
    bool displayFace = false,
    double letterSpacing = -0.02,
  }) {
    final base = displayFace
        ? GoogleFonts.spaceGrotesk(
            fontSize: size,
            fontWeight: weight,
            color: color,
            letterSpacing: size * letterSpacing,
          )
        : GoogleFonts.inter(fontSize: size, fontWeight: weight, color: color);
    return base.copyWith(fontFeatures: const [FontFeature.tabularFigures()]);
  }

  /// The small uppercase section label used above every list on the web.
  static TextStyle eyebrow({Color? color}) => GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.99,
        color: color ?? MyntColors.inkAt(0.35),
      );
}

ThemeData buildMyntTheme() {
  final base = ThemeData.light(useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: MyntColors.white,
    colorScheme: base.colorScheme.copyWith(
      primary: MyntColors.black,
      secondary: MyntColors.lime,
      surface: MyntColors.white,
      onSurface: MyntColors.black,
    ),
    textTheme: GoogleFonts.interTextTheme(base.textTheme).apply(
      bodyColor: MyntColors.black,
      displayColor: MyntColors.black,
    ),
    splashFactory: InkSparkle.splashFactory,
  );
}
