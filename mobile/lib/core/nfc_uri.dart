import 'dart:convert';
import 'dart:typed_data';

import 'package:ndef_record/ndef_record.dart';

/// Builds the NDEF record that goes on a card.
///
/// There is no helper for this in the library, and the format is easy to get
/// subtly wrong in a way that only shows up on the physical object — a tag
/// written badly is scrap, because a card is programmed once and then posted to
/// somebody. So it is built here, by hand, against the specification, and
/// tested.
///
/// An NDEF URI record is a well-known record of type "U" whose payload is one
/// abbreviation byte followed by the rest of the address in UTF-8. The
/// abbreviation is what keeps a tag small: the whole of "https://" is one byte,
/// which matters on an NTAG213 with 144 usable bytes.

/// The abbreviation codes from the NFC Forum URI Record Type Definition. Only
/// the two we could ever write are here; anything else would be an address this
/// product does not hand out.
const _httpsPrefix = 0x04; // "https://"
const _httpPrefix = 0x03; // "http://"

/// The URI record for one address.
///
/// Throws [ArgumentError] on anything that is not an http(s) address. That is
/// deliberate: the only caller passes an address this app built from a number
/// it owns, so a failure here is a bug in the app rather than bad input, and it
/// should be loud rather than written to somebody's card.
NdefRecord uriRecord(String url) {
  final (prefix, rest) = _split(url);

  final payload = Uint8List.fromList([prefix, ...utf8.encode(rest)]);

  return NdefRecord(
    typeNameFormat: TypeNameFormat.wellKnown,
    // "U", the well-known type for a URI record.
    type: Uint8List.fromList([0x55]),
    // Empty: an identifier is for referring to a record from another record,
    // and there is only one here.
    identifier: Uint8List(0),
    payload: payload,
  );
}

(int, String) _split(String url) {
  if (url.startsWith('https://')) {
    return (_httpsPrefix, url.substring('https://'.length));
  }
  if (url.startsWith('http://')) {
    return (_httpPrefix, url.substring('http://'.length));
  }
  throw ArgumentError.value(url, 'url', 'faqat http yoki https manzil yozish mumkin');
}

/// How many bytes the tag has to hold for this record.
///
/// Checked before writing, because the failure otherwise happens halfway
/// through — leaving a tag that is neither the old address nor the new one.
int recordSize(String url) => uriRecord(url).byteLength;
