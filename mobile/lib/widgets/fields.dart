import 'package:flutter/material.dart';

import '../brand/palette.dart';

/// One labelled text field, which is most of the profile form.
///
/// A widget rather than a helper function so that each field keeps its own
/// focus and its own controller lifetime, and so a form is a list of these
/// rather than a hundred lines of identical decoration.
class Field extends StatelessWidget {
  const Field({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.help,
    this.prefix,
    this.keyboardType,
    this.maxLines = 1,
    this.maxLength,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;

  /// A line under the field, for the ones where what to type is not obvious.
  final String? help;

  /// Shown inside the field, before what is typed — "@" for a username, so
  /// nobody types it themselves and ends up with two.
  final String? prefix;

  final TextInputType? keyboardType;
  final int maxLines;
  final int? maxLength;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Brand.black.withValues(alpha: 0.6),
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: controller,
            keyboardType: keyboardType,
            maxLines: maxLines,
            maxLength: maxLength,
            autocorrect: maxLines > 1,
            style: const TextStyle(fontSize: 16, color: Brand.black),
            decoration: InputDecoration(
              hintText: hint,
              prefixText: prefix,
              counterText: '',
              filled: true,
              fillColor: Brand.black.withValues(alpha: 0.04),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          if (help != null) ...[
            const SizedBox(height: 6),
            Text(
              help!,
              style: TextStyle(fontSize: 12, height: 1.4, color: Brand.black.withValues(alpha: 0.45)),
            ),
          ],
        ],
      ),
    );
  }
}

/// A heading inside a form, where one group of fields ends and another begins.
class FormSection extends StatelessWidget {
  const FormSection(this.title, {super.key});

  final String title;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 12, bottom: 16),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 12,
            letterSpacing: 1.5,
            fontWeight: FontWeight.w700,
            color: Brand.black.withValues(alpha: 0.35),
          ),
        ),
      );
}
