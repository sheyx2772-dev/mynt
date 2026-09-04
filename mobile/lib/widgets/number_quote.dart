import 'package:flutter/material.dart';

import '../brand/palette.dart';
import '../core/models/purchase.dart';
import '../core/money.dart';
import 'buttons.dart';

/// What a number costs, and why.
///
/// The reasons are shown because the price is not obvious: three identical
/// letters multiply it by thirty and three identical digits by forty, so the
/// same six characters can be a hundred thousand so'm or a hundred and twenty
/// million. A price with no explanation reads as one somebody made up.
class NumberQuote extends StatelessWidget {
  const NumberQuote({super.key, required this.quote, required this.onBuy});

  final NumberState quote;
  final VoidCallback onBuy;

  @override
  Widget build(BuildContext context) {
    if (!quote.available) return _Taken(number: quote.number);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Brand.black.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            quote.number,
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              letterSpacing: 3,
              color: Brand.black,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            som(quote.price),
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w700,
              color: Brand.limeInk,
              // Digits of the same width, so the number does not shift as it
              // changes between searches.
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 18),
          _Reason(label: 'Harflar', reason: quote.letterReason),
          const SizedBox(height: 8),
          _Reason(label: 'Raqamlar', reason: quote.digitReason),
          const SizedBox(height: 22),
          LimeButton(label: 'Band qilish', onPressed: onBuy),
          const SizedBox(height: 10),
          Text(
            // Said before they commit, not after. A reservation that quietly
            // expires is worse than one somebody was warned about.
            'Raqam 30 daqiqaga band qilinadi. To\'lov tasdiqlanmasa, u yana bo\'shaydi.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, height: 1.4, color: Brand.black.withValues(alpha: 0.45)),
          ),
        ],
      ),
    );
  }
}

class _Reason extends StatelessWidget {
  const _Reason({required this.label, required this.reason});

  final String label;
  final String reason;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 72,
          child: Text(label,
              style: TextStyle(fontSize: 13, color: Brand.black.withValues(alpha: 0.45))),
        ),
        Expanded(
          child: Text(reason,
              style: const TextStyle(fontSize: 13, height: 1.4, color: Brand.black)),
        ),
      ],
    );
  }
}

class _Taken extends StatelessWidget {
  const _Taken({required this.number});

  final String number;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Brand.black.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Text(
            number,
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              letterSpacing: 3,
              color: Brand.black.withValues(alpha: 0.35),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Bu raqam band qilingan',
            style: TextStyle(fontSize: 15, color: Brand.black.withValues(alpha: 0.55)),
          ),
        ],
      ),
    );
  }
}
