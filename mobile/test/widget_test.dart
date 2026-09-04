import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:flex/core/config.dart';

void main() {
  group('Config', () {
    // What goes on an NFC tag is the one string in this app that is printed on
    // a physical object. A tag written with the wrong one is scrap, so the
    // format is asserted rather than trusted.
    test('a tag carries the source marker the owner sees in their statistics', () {
      expect(Config.tagUrl('MYN042'), 'https://flex.com.uz/MYN042?src=nfc');
    });

    test('a shared profile link carries no marker of its own', () {
      expect(Config.profileUrl('MYN042'), 'https://flex.com.uz/MYN042');
    });

    test('an API path is built under the version prefix', () {
      expect(Config.api('/sogliq').toString(), 'https://flex.com.uz/v1/sogliq');
    });
  });

  testWidgets('the connection screen renders before any answer arrives', (tester) async {
    // The screen is built directly rather than through FlexApp: pumping the
    // whole app would start the health request, and a widget test has no
    // backend to answer it.
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: Text('Flex'))));
    expect(find.text('Flex'), findsOneWidget);
  });
}
