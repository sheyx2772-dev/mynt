/// What a number costs, and what buying one produced.
library;

/// The answer to "is AAA777 free, and what does it cost".
class NumberState {
  const NumberState({
    required this.number,
    required this.available,
    required this.price,
    required this.letterReason,
    required this.digitReason,
  });

  final String number;
  final bool available;
  final int price;

  /// Why it costs what it costs. Shown to the buyer before they pay, because a
  /// price with no explanation reads as one somebody made up.
  final String letterReason;
  final String digitReason;

  factory NumberState.fromJson(Map<String, dynamic> json) => NumberState(
        number: json['raqam'] as String? ?? '',
        available: json['bosh'] as bool? ?? false,
        price: (json['narx'] as num?)?.toInt() ?? 0,
        letterReason: json['harflar'] as String? ?? '',
        digitReason: json['raqamlar'] as String? ?? '',
      );
}

class Order {
  const Order({
    required this.id,
    required this.number,
    required this.amount,
    required this.status,
    required this.paymeUrl,
    required this.clickUrl,
    required this.reservedUntil,
  });

  final String id;
  final String number;
  final int amount;
  final String status;

  /// Where to pay. Empty when no provider is configured, in which case the
  /// number is already claimed and there is nothing to pay.
  final String paymeUrl;
  final String clickUrl;

  final DateTime? reservedUntil;

  bool get isPaid => status == 'paid';
  bool get needsPayment => paymeUrl.isNotEmpty || clickUrl.isNotEmpty;

  factory Order.fromJson(Map<String, dynamic> json) {
    final checkout = json['tolov'] as Map<String, dynamic>? ?? const {};
    return Order(
      id: json['id'] as String? ?? '',
      number: json['raqam'] as String? ?? '',
      amount: (json['summa'] as num?)?.toInt() ?? 0,
      status: json['holat'] as String? ?? 'pending',
      paymeUrl: checkout['payme'] as String? ?? '',
      clickUrl: checkout['click'] as String? ?? '',
      reservedUntil: DateTime.tryParse(json['band_muddati'] as String? ?? ''),
    );
  }
}
