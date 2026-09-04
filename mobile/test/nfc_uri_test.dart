import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:ndef_record/ndef_record.dart';

import 'package:flex/core/config.dart';
import 'package:flex/core/nfc_uri.dart';

// A card is programmed once and then posted to somebody. A record built wrongly
// is not a bug that gets retried — it is an object in the post that does not
// work, so the bytes are asserted rather than trusted.
void main() {
  test('the record is a well-known URI record', () {
    final record = uriRecord('https://flex.com.uz/MYN042?src=nfc');

    expect(record.typeNameFormat, TypeNameFormat.wellKnown);
    // "U" — the well-known type for a URI.
    expect(record.type, [0x55]);
    expect(record.identifier, isEmpty);
  });

  test('https is abbreviated to one byte', () {
    final record = uriRecord('https://flex.com.uz/MYN042?src=nfc');

    // 0x04 stands for the whole of "https://". On an NTAG213 with 144 usable
    // bytes, spending eight of them spelling it out is worth avoiding.
    expect(record.payload.first, 0x04);
    expect(
      utf8.decode(record.payload.sublist(1)),
      'flex.com.uz/MYN042?src=nfc',
    );
  });

  test('http gets its own prefix rather than being written out', () {
    final record = uriRecord('http://localhost:8090/MYN042');
    expect(record.payload.first, 0x03);
    expect(utf8.decode(record.payload.sublist(1)), 'localhost:8090/MYN042');
  });

  test('anything that is not an address is refused loudly', () {
    // The only caller builds this from a number the app owns, so reaching here
    // means a bug — and a bug must not become a card in the post.
    for (final bad in ['flex.com.uz', 'javascript:alert(1)', 'ftp://x.uz', '']) {
      expect(() => uriRecord(bad), throwsArgumentError, reason: bad);
    }
  });

  test('what a real card carries fits an NTAG213', () {
    // 144 bytes is the usable area of the cheapest tag anybody would use for
    // this. If a number ever stops fitting, it should fail here.
    expect(recordSize(Config.tagUrl('MYN042')), lessThan(144));
  });

  test('the address written is the one the site issues', () {
    // The `?src=nfc` marker is what lets an owner see that the card itself is
    // bringing people rather than a link somebody shared. Losing it makes a tap
    // indistinguishable from a plain visit.
    expect(Config.tagUrl('MYN042'), endsWith('?src=nfc'));
  });
}
