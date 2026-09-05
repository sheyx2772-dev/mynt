import 'package:flutter_test/flutter_test.dart';
import 'package:flex/core/phone_format.dart';

void main() {
  test('an Uzbek number is grouped the way it is spoken', () {
    expect(PhoneFormatter.format('998901234567'), '+998 90 123 45 67');
  });

  test('grouping appears as the number is typed, never after', () {
    expect(PhoneFormatter.format('998'), '+998');
    expect(PhoneFormatter.format('9989'), '+998 9');
    expect(PhoneFormatter.format('99890'), '+998 90');
    expect(PhoneFormatter.format('998901'), '+998 90 1');
    expect(PhoneFormatter.format('99890123'), '+998 90 123');
    expect(PhoneFormatter.format('9989012345'), '+998 90 123 45');
  });

  test('other countries keep their own grouping', () {
    expect(PhoneFormatter.format('77019998877'), '+7 701 999 88 77');
    expect(PhoneFormatter.format('996555111222'), '+996 555 111 222');
  });

  test('an unknown dial code is left as digits rather than mangled', () {
    expect(PhoneFormatter.format('35312345678'), '+35312345678');
  });

  test('a digit past the pattern is kept, not dropped', () {
    // Losing a digit somebody typed is worse than an odd-looking group.
    expect(PhoneFormatter.format('9989012345678'), '+998 90 123 45 67 8');
  });
}
