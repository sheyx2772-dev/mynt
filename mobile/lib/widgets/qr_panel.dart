import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../brand/palette.dart';
import '../core/config.dart';

/// For phones without NFC, and for printing on the card itself.
class QrPanel extends StatelessWidget {
  const QrPanel({super.key, required this.number});

  final String number;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          'Yoki QR kod',
          style: TextStyle(fontSize: 13, color: Brand.black.withValues(alpha: 0.5)),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Brand.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Brand.black.withValues(alpha: 0.1)),
          ),
          child: QrImageView(
            // A different marker from the tag: the site issues `qr` for this,
            // so an owner can tell the two apart in their statistics.
            data: '${Config.profileUrl(number)}?src=qr',
            size: 200,
            backgroundColor: Brand.white,
            eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Brand.black),
            dataModuleStyle: const QrDataModuleStyle(
              dataModuleShape: QrDataModuleShape.square,
              color: Brand.black,
            ),
          ),
        ),
      ],
    );
  }
}
