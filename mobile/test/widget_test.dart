import 'package:flutter_test/flutter_test.dart';

import 'package:flex/core/config.dart';
import 'package:flex/core/money.dart';

void main() {
  group('Config', () {
    // The one string in this app that ends up printed on a physical object. A
    // tag written with the wrong one is scrap, so the format is asserted.
    test('a tag carries the marker the owner sees in their statistics', () {
      expect(Config.tagUrl('MYN042'), 'https://flex-nfc.uz/MYN042?src=nfc');
    });

    test('a shared profile link carries no marker of its own', () {
      expect(Config.profileUrl('MYN042'), 'https://flex-nfc.uz/MYN042');
    });

    test('an API path is built under the version prefix', () {
      expect(Config.api('/sogliq').toString(), 'https://flex-nfc.uz/v1/sogliq');
    });
  });

  group('som', () {
    test('groups by three with a space, as prices are written here', () {
      // 120000000 on a screen is unreadable, and a comma is not the separator
      // used in Uzbekistan.
      expect(som(120000000), "120 000 000 so'm");
      expect(som(100000), "100 000 so'm");
      expect(som(500), "500 so'm");
      expect(som(0), "0 so'm");
      expect(som(1000), "1 000 so'm");
    });
  });
}
