import 'package:flutter_test/flutter_test.dart';
import 'package:mynt/core/pricing.dart';

void main() {
  group('handle narxi', () {
    test('oddiy handle asosiy narxda qoladi', () {
      expect(priceForHandle('XKQ', '482'), 99000);
    });

    test('AAA000 eng qimmat kombinatsiya', () {
      expect(priceForHandle('AAA', '000'), greaterThan(priceForHandle('VIP', '007')));
    });

    test('nodir soʻz va nodir raqam koʻpaytiriladi', () {
      expect(priceForHandle('VIP', '007'), 99000 * 20 * 15);
    });
  });
}
