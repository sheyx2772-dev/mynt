import 'package:flutter_test/flutter_test.dart';

import 'package:flex/core/config.dart';

void main() {
  group('Config', () {
    // The one string in this app that ends up printed on a physical object. A
    // tag written with the wrong one is scrap, so the format is asserted.
    test('a tag carries the marker the owner sees in their statistics', () {
      expect(Config.tagUrl('MYN042'), 'https://flex.com.uz/MYN042?src=nfc');
    });

    test('a shared profile link carries no marker of its own', () {
      expect(Config.profileUrl('MYN042'), 'https://flex.com.uz/MYN042');
    });

    test('an API path is built under the version prefix', () {
      expect(Config.api('/sogliq').toString(), 'https://flex.com.uz/v1/sogliq');
    });
  });
}
