import 'package:flutter/material.dart';

import '../brand/palette.dart';
import '../core/nfc_writer.dart';
import 'buttons.dart';

/// The three things the writer can be doing, on screen.

class NfcPanel extends StatelessWidget {
  const NfcPanel({super.key, required this.state, required this.onWrite, required this.onCancel});

  final NfcState state;
  final VoidCallback onWrite;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    return switch (state) {
      NfcIdle() => LimeButton(label: 'NFC tegga yozish', onPressed: onWrite),
      NfcWaiting() => Column(
          children: [
            const _Pulse(),
            const SizedBox(height: 16),
            const Text(
              'Telefonni tegga tegizing',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Brand.black),
            ),
            const SizedBox(height: 20),
            OutlineButton(label: 'Bekor qilish', onPressed: onCancel),
          ],
        ),
      NfcDone() => _Result(
          icon: Icons.check_circle,
          colour: Brand.limeInk,
          title: 'Yozildi',
          detail: 'Endi kartani telefonga tegizib tekshiring.',
          onAgain: onWrite,
        ),
      NfcFailed(:final message) => _Result(
          icon: Icons.error_outline,
          colour: const Color(0xFFB91C1C),
          title: 'Yozilmadi',
          detail: message,
          onAgain: onWrite,
        ),
    };
  }
}

class _Result extends StatelessWidget {
  const _Result({
    required this.icon,
    required this.colour,
    required this.title,
    required this.detail,
    required this.onAgain,
  });

  final IconData icon;
  final Color colour;
  final String title;
  final String detail;
  final VoidCallback onAgain;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 40, color: colour),
        const SizedBox(height: 12),
        Text(title,
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: Brand.black)),
        const SizedBox(height: 6),
        Text(
          detail,
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 14, height: 1.5, color: Brand.black.withValues(alpha: 0.6)),
        ),
        const SizedBox(height: 20),
        OutlineButton(label: 'Yana yozish', onPressed: onAgain),
      ],
    );
  }
}

class _Pulse extends StatelessWidget {
  const _Pulse();

  @override
  Widget build(BuildContext context) => Container(
        width: 72,
        height: 72,
        decoration: BoxDecoration(
          color: Brand.lime.withValues(alpha: 0.25),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.nfc, size: 34, color: Brand.black),
      );
}

