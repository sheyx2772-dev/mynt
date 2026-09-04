import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../core/config.dart';
import '../theme/mynt_theme.dart';
import '../widgets/mynt_background.dart';
import '../widgets/mynt_buttons.dart';
import '../widgets/mynt_cards.dart';

/// The fallback path: NFC missing or switched off. Same destination, read
/// by a camera instead of a radio.
class QrScreen extends StatelessWidget {
  const QrScreen({super.key, required this.handle});

  final String handle;

  @override
  Widget build(BuildContext context) {
    final url = MyntConfig.profileUrl(handle);

    return MyntScaffold(
      glows: const [Alignment(-1.3, 1.3)],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Align(alignment: Alignment.centerLeft, child: BackPill()),
          const SizedBox(height: 26),
          Text(
            'NFC ishlamadimi?',
            style: MyntTypography.display(size: 28, height: 1.14, letterSpacing: -0.03),
          ),
          const SizedBox(height: 10),
          Text(
            'Baʼzi telefonlarda NFC yoʻq yoki oʻchirilgan. '
            'Kamerani QR’ga qarating — xuddi shu profil ochiladi.',
            style: MyntTypography.body(
              size: 14,
              height: 1.55,
              color: MyntColors.inkAt(0.55),
            ),
          ),
          const SizedBox(height: 28),
          MyntCard(
            padding: const EdgeInsets.all(28),
            child: Column(
              children: [
                QrImageView(
                  data: url,
                  size: 200,
                  version: QrVersions.auto,
                  eyeStyle: const QrEyeStyle(
                    eyeShape: QrEyeShape.square,
                    color: MyntColors.black,
                  ),
                  dataModuleStyle: const QrDataModuleStyle(
                    dataModuleShape: QrDataModuleShape.square,
                    color: MyntColors.black,
                  ),
                  embeddedImage: null,
                ),
                const SizedBox(height: 22),
                Text(
                  'mynt.uz/$handle',
                  style: MyntTypography.tabular(size: 15),
                ),
              ],
            ),
          ),
          const Spacer(),
          OutlineButton(
            label: 'Havolani nusxalash',
            icon: const Icon(Icons.copy_rounded, size: 17, color: MyntColors.black),
            onPressed: () async {
              await Clipboard.setData(ClipboardData(text: url));
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  backgroundColor: MyntColors.black,
                  behavior: SnackBarBehavior.floating,
                  content: Text(
                    'Nusxalandi',
                    style: MyntTypography.body(size: 13, color: MyntColors.white),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 12),
          Text(
            'Karta orqasidagi QR ham xuddi shu manzilga olib boradi.',
            textAlign: TextAlign.center,
            style: MyntTypography.body(
              size: 12,
              height: 1.5,
              color: MyntColors.inkAt(0.4),
            ),
          ),
        ],
      ),
    );
  }
}
