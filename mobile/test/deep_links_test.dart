import 'package:flutter_test/flutter_test.dart';

import 'package:flex/core/config.dart';
import 'package:flex/core/deep_links.dart';

/// A sign-in link carries a token worth an account for fifteen minutes, and it
/// arrives from outside the app. These are the links that must not be acted on.
void main() {
  late List<String> spent;
  late DeepLinks links;

  setUp(() {
    spent = [];
    links = DeepLinks(spent.add);
  });

  test('a link from our own site signs in', () {
    links.handle(Uri.parse('${Config.siteBaseUrl}/kirish/tasdiq?t=abc123'));
    expect(spent, ['abc123']);
  });

  test('a link from anywhere else is ignored', () {
    // The convincing ones: a lookalike domain, a subdomain, and the right host
    // over plain http where the token could be read off the wire.
    for (final url in [
      'https://flex.com.uz.evil.com/kirish/tasdiq?t=stolen',
      'https://evil.com/kirish/tasdiq?t=stolen',
      'https://kirish.flex.com.uz/kirish/tasdiq?t=stolen',
      'http://flex.com.uz/kirish/tasdiq?t=stolen',
      'flex://kirish/tasdiq?t=stolen',
    ]) {
      links.handle(Uri.parse(url));
    }
    expect(spent, isEmpty);
  });

  test('a link to any other path on our site is ignored', () {
    // Being on the right host is not enough. Only one path spends a token.
    for (final path in ['/', '/MYN042', '/kirish', '/kirish/tasdiq/x']) {
      links.handle(Uri.parse('${Config.siteBaseUrl}$path?t=abc123'));
    }
    expect(spent, isEmpty);
  });

  test('a link with no token does nothing', () {
    links.handle(Uri.parse('${Config.siteBaseUrl}/kirish/tasdiq'));
    links.handle(Uri.parse('${Config.siteBaseUrl}/kirish/tasdiq?t='));
    expect(spent, isEmpty);
  });
}
