import 'dart:io';

import 'package:ndef_record/ndef_record.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'package:nfc_manager/nfc_manager_android.dart';
import 'package:nfc_manager/nfc_manager_ios.dart';

import 'nfc_uri.dart';

/// Where a write has got to. A sealed type, so a screen that handles three of
/// the four states does not compile.
sealed class NfcState {
  const NfcState();
}

class NfcIdle extends NfcState {
  const NfcIdle();
}

class NfcWaiting extends NfcState {
  const NfcWaiting();
}

class NfcDone extends NfcState {
  const NfcDone();
}

class NfcFailed extends NfcState {
  const NfcFailed(this.message);
  final String message;
}

/// Writing an address to a tag.
///
/// The session is the thing to be careful with: it powers the reader, and one
/// left open keeps scanning in somebody's pocket. Every path out of here —
/// success, failure, the screen closing — closes it.
class NfcWriter {
  bool _open = false;

  Future<void> cancel() async {
    if (!_open) return;
    _open = false;
    await NfcManager.instance.stopSession();
  }

  /// Writes [url] to the next tag held against the phone.
  ///
  /// Reports progress through [onState] rather than returning, because the
  /// interesting part is the waiting: the person has to be told to hold the
  /// card there, and told the moment it worked.
  Future<void> write(String url, {required void Function(NfcState) onState}) async {
    // Three answers, and they need three different sentences: a phone with no
    // NFC at all cannot be helped, a phone with it switched off can, and only
    // the third is ready to write.
    switch (await NfcManager.instance.checkAvailability()) {
      case NfcAvailability.unsupported:
        onState(const NfcFailed('Bu telefonda NFC yo\'q.'));
        return;
      case NfcAvailability.disabled:
        onState(NfcFailed(
          Platform.isIOS
              ? 'NFC mavjud emas.'
              : 'NFC o\'chirilgan. Sozlamalardan yoqing va qaytadan urining.',
        ));
        return;
      case NfcAvailability.enabled:
        break;
    }

    // Built before the session opens. An address this app cannot turn into a
    // record is a bug, and finding out while somebody is holding a card
    // against their phone is the wrong moment.
    final NdefMessage message;
    try {
      message = NdefMessage(records: [uriRecord(url)]);
    } on ArgumentError {
      onState(const NfcFailed('Manzil noto\'g\'ri. Bu dasturdagi xato.'));
      return;
    }

    _open = true;
    onState(const NfcWaiting());

    await NfcManager.instance.startSession(
      // The tag families the cards this product sells actually use. Polling for
      // families we never write to only makes the reader answer to more things.
      pollingOptions: {NfcPollingOption.iso14443, NfcPollingOption.iso15693},
      onDiscovered: (tag) async {
        final result = await _writeTo(tag, message);
        onState(result);
        await cancel();
      },
    );
  }

  Future<NfcState> _writeTo(NfcTag tag, NdefMessage message) async {
    try {
      if (Platform.isAndroid) return await _writeAndroid(tag, message);
      if (Platform.isIOS) return await _writeIos(tag, message);
      return const NfcFailed('Bu platformada yozish mavjud emas.');
    } on Exception {
      // The platform exception carries a vendor error code that means nothing
      // to the person holding the card. What they need is what to do next.
      return const NfcFailed('Yozib bo\'lmadi. Kartani qaytadan tegizib ko\'ring.');
    }
  }

  Future<NfcState> _writeAndroid(NfcTag tag, NdefMessage message) async {
    final ndef = NdefAndroid.from(tag);
    if (ndef == null) {
      return const NfcFailed('Bu teg NDEF formatida emas.');
    }
    if (!ndef.isWritable) {
      // Some tags are locked at the factory, and some are locked deliberately
      // after writing. Either way this one will never take an address.
      return const NfcFailed('Bu teg faqat o\'qish uchun — unga yozib bo\'lmaydi.');
    }
    if (ndef.maxSize < message.byteLength) {
      // Checked before writing, because a write that runs out of room leaves a
      // tag that is neither the old address nor the new one.
      return NfcFailed(
        'Teg kichik: ${message.byteLength} bayt kerak, ${ndef.maxSize} bayt bor.',
      );
    }

    await ndef.writeNdefMessage(message);
    return const NfcDone();
  }

  Future<NfcState> _writeIos(NfcTag tag, NdefMessage message) async {
    final ndef = NdefIos.from(tag);
    if (ndef == null) {
      return const NfcFailed('Bu teg NDEF formatida emas.');
    }
    if (ndef.status == NdefStatusIos.readOnly) {
      return const NfcFailed('Bu teg faqat o\'qish uchun.');
    }
    if (ndef.capacity < message.byteLength) {
      return NfcFailed(
        'Teg kichik: ${message.byteLength} bayt kerak, ${ndef.capacity} bayt bor.',
      );
    }

    await ndef.writeNdef(message);
    return const NfcDone();
  }
}
