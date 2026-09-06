import 'package:flutter_test/flutter_test.dart';

import 'package:flex/core/config.dart';
import 'package:flex/core/deep_links.dart';

/// A sign-in link carries a token worth an account for fifteen minutes, and it
/// arrives from outside the app. These are the links that must not be acted on.
void main() {
  late List<String> spent;
  late List<String> orders;
  late DeepLinks links;

  setUp(() {
    spent = [];
    orders = [];
    links = DeepLinks(onSignIn: spent.add, onOrder: orders.add);
  });

  test('a link from our own site signs in', () {
    links.handle(Uri.parse('${Config.siteBaseUrl}/kirish/tasdiq?t=abc123'));
    expect(spent, ['abc123']);
  });

  test('a link from anywhere else is ignored', () {
    // The convincing ones: a lookalike domain, a subdomain, and the right host
    // over plain http where the token could be read off the wire.
    for (final url in [
      'https://flex-nfc.uz.evil.com/kirish/tasdiq?t=stolen',
      'https://evil.com/kirish/tasdiq?t=stolen',
      'https://kirish.flex-nfc.uz/kirish/tasdiq?t=stolen',
      'http://flex-nfc.uz/kirish/tasdiq?t=stolen',
      'flex://kirish/tasdiq?t=stolen',
    ]) {
      links.handle(Uri.parse(url));
    }
    expect(spent, isEmpty);
  });

  test('a link to any other path on our site spends no token', () {
    // Being on the right host is not enough. Only one path spends a token.
    for (final path in ['/', '/MYN042', '/kirish', '/kirish/tasdiq/x']) {
      links.handle(Uri.parse('${Config.siteBaseUrl}$path?t=abc123'));
    }
    expect(spent, isEmpty);
  });

  test('a return from a payment opens that order', () {
    links.handle(Uri.parse('${Config.siteBaseUrl}/buyurtma/order-9'));
    expect(orders, ['order-9']);
    // The order id carries no authority — it is read back over an
    // authenticated request — but it is still not a sign-in token.
    expect(spent, isEmpty);
  });

  test('an order link from anywhere else is ignored', () {
    links.handle(Uri.parse('https://evil.com/buyurtma/order-9'));
    links.handle(Uri.parse('${Config.siteBaseUrl}/buyurtma/'));
    links.handle(Uri.parse('${Config.siteBaseUrl}/buyurtma/a/b'));
    expect(orders, isEmpty);
  });

  test('a link with no token does nothing', () {
    links.handle(Uri.parse('${Config.siteBaseUrl}/kirish/tasdiq'));
    links.handle(Uri.parse('${Config.siteBaseUrl}/kirish/tasdiq?t='));
    expect(spent, isEmpty);
  });
}
