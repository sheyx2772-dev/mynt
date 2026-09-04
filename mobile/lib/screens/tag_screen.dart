import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../brand/palette.dart';
import '../core/config.dart';
import '../core/nfc_writer.dart';
import '../widgets/nfc_panel.dart';
import '../widgets/qr_panel.dart';

/// Putting a number onto something somebody can carry.
///
/// The two ways: writing it to an NFC tag, and showing it as a QR code. This is
/// the screen that justifies the app existing at all — a browser cannot write
/// an NFC tag on either platform, so everything else here could have stayed a
/// web page and this could not.
class TagScreen extends ConsumerStatefulWidget {
  const TagScreen({super.key, required this.number});

  final String number;

  @override
  ConsumerState<TagScreen> createState() => _TagScreenState();
}

class _TagScreenState extends ConsumerState<TagScreen> {
  final _writer = NfcWriter();
  NfcState _state = const NfcIdle();

  @override
  void dispose() {
    // The reader stays powered while a session is open, so leaving the screen
    // has to close it. Otherwise it keeps scanning in the owner's pocket.
    _writer.cancel();
    super.dispose();
  }

  Future<void> _write() async {
    await _writer.write(
      Config.tagUrl(widget.number),
      onState: (state) {
        if (mounted) setState(() => _state = state);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final url = Config.tagUrl(widget.number);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Kartaga yozish'),
        backgroundColor: Brand.white,
        surfaceTintColor: Brand.white,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 40),
        children: [
          _WhatGetsWritten(url: url),
          const SizedBox(height: 28),
          NfcPanel(state: _state, onWrite: _write, onCancel: () async {
            await _writer.cancel();
            if (mounted) setState(() => _state = const NfcIdle());
          }),
          const SizedBox(height: 36),
          const Divider(height: 1),
          const SizedBox(height: 28),
          QrPanel(number: widget.number),
        ],
      ),
    );
  }
}

class _WhatGetsWritten extends StatelessWidget {
  const _WhatGetsWritten({required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Tegga yoziladigan manzil',
          style: TextStyle(fontSize: 13, color: Brand.black.withValues(alpha: 0.5)),
        ),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Brand.black.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(12),
          ),
          child: SelectableText(
            url,
            style: const TextStyle(fontSize: 13, fontFamily: 'monospace', color: Brand.black),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          // The marker is the whole reason the owner can tell a tap from a
          // visit, so it is explained rather than left looking like noise.
          '?src=nfc — bu belgi kartani tegizish bilan oddiy tashrifni ajratadi. '
          'Statistikada shu ko\'rinadi.',
          style: TextStyle(fontSize: 12, height: 1.5, color: Brand.black.withValues(alpha: 0.45)),
        ),
      ],
    );
  }
}
