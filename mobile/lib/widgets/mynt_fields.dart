import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/mynt_theme.dart';

/// The paired handle input: three letters, a hairline, three digits on a
/// lime wash. Both halves are real inputs — this is the thing people play
/// with before they buy.
class HandleField extends StatelessWidget {
  const HandleField({
    super.key,
    required this.letters,
    required this.digits,
    required this.onLettersChanged,
    required this.onDigitsChanged,
    this.fieldWidth = 84,
    this.fieldHeight = 54,
    this.fontSize = 24,
  });

  final TextEditingController letters;
  final TextEditingController digits;
  final ValueChanged<String> onLettersChanged;
  final ValueChanged<String> onDigitsChanged;
  final double fieldWidth;
  final double fieldHeight;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(fieldHeight * 0.3),
        border: Border.all(color: MyntColors.black.withValues(alpha: 0.9), width: 2),
        boxShadow: const [
          BoxShadow(
            color: Color(0x660E0A1B),
            blurRadius: 16,
            spreadRadius: -8,
            offset: Offset(0, 6),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _Cell(
            controller: letters,
            onChanged: onLettersChanged,
            width: fieldWidth,
            height: fieldHeight,
            fontSize: fontSize,
            fill: Colors.transparent,
            formatters: [
              LengthLimitingTextInputFormatter(3),
              FilteringTextInputFormatter.allow(RegExp('[a-zA-Z]')),
              _UpperCaseFormatter(),
            ],
            keyboardType: TextInputType.text,
            semanticLabel: 'Harflar',
          ),
          Container(width: 1, height: fieldHeight, color: MyntColors.hairline),
          _Cell(
            controller: digits,
            onChanged: onDigitsChanged,
            width: fieldWidth,
            height: fieldHeight,
            fontSize: fontSize,
            fill: MyntColors.lime.withValues(alpha: 0.12),
            formatters: [
              LengthLimitingTextInputFormatter(3),
              FilteringTextInputFormatter.digitsOnly,
            ],
            keyboardType: TextInputType.number,
            semanticLabel: 'Raqamlar',
          ),
        ],
      ),
    );
  }
}

class _Cell extends StatelessWidget {
  const _Cell({
    required this.controller,
    required this.onChanged,
    required this.width,
    required this.height,
    required this.fontSize,
    required this.fill,
    required this.formatters,
    required this.keyboardType,
    required this.semanticLabel,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final double width;
  final double height;
  final double fontSize;
  final Color fill;
  final List<TextInputFormatter> formatters;
  final TextInputType keyboardType;
  final String semanticLabel;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: semanticLabel,
      child: Container(
        width: width,
        height: height,
        color: fill,
        alignment: Alignment.center,
        child: TextField(
          controller: controller,
          onChanged: onChanged,
          inputFormatters: formatters,
          keyboardType: keyboardType,
          textAlign: TextAlign.center,
          cursorColor: MyntColors.black,
          style: MyntTypography.tabular(
            size: fontSize,
            weight: FontWeight.w600,
            displayFace: true,
          ),
          decoration: const InputDecoration(
            border: InputBorder.none,
            isCollapsed: true,
            contentPadding: EdgeInsets.zero,
          ),
        ),
      ),
    );
  }
}

class _UpperCaseFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    return newValue.copyWith(text: newValue.text.toUpperCase());
  }
}

/// The standard form field: 12px radius, hairline border, faint fill.
class MyntTextField extends StatelessWidget {
  const MyntTextField({
    super.key,
    required this.hint,
    this.controller,
    this.maxLines = 1,
    this.keyboardType,
    this.textCapitalization = TextCapitalization.none,
    this.prefix,
  });

  final String hint;
  final TextEditingController? controller;
  final int maxLines;
  final TextInputType? keyboardType;
  final TextCapitalization textCapitalization;
  final String? prefix;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      cursorColor: MyntColors.black,
      style: MyntTypography.body(size: 14),
      decoration: InputDecoration(
        hintText: hint,
        prefixText: prefix,
        prefixStyle: MyntTypography.body(size: 14, color: MyntColors.inkAt(0.5)),
        hintStyle: MyntTypography.body(size: 14, color: MyntColors.inkAt(0.38)),
        filled: true,
        fillColor: MyntColors.fieldFill,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        border: _border(MyntColors.hairline),
        enabledBorder: _border(MyntColors.hairline),
        focusedBorder: _border(MyntColors.inkAt(0.3)),
      ),
    );
  }

  OutlineInputBorder _border(Color color) => OutlineInputBorder(
        borderRadius: BorderRadius.circular(MyntRadii.field),
        borderSide: BorderSide(color: color),
      );
}

/// Initials on a coloured disc — the stand-in whenever there is no avatar.
class InitialsAvatar extends StatelessWidget {
  const InitialsAvatar({
    super.key,
    required this.initials,
    this.size = 64,
    this.background = MyntColors.lime,
    this.foreground = MyntColors.black,
    this.imageUrl,
  });

  final String initials;
  final double size;
  final Color background;
  final Color foreground;
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return ClipOval(
        child: Image.network(
          imageUrl!,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _fallback(),
        ),
      );
    }
    return _fallback();
  }

  Widget _fallback() => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: background, shape: BoxShape.circle),
        alignment: Alignment.center,
        child: Text(
          initials,
          style: MyntTypography.display(size: size * 0.31, color: foreground),
        ),
      );
}
