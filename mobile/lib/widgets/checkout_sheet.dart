import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../brand/palette.dart';
import '../core/models/purchase.dart';
import '../core/money.dart';
import 'buttons.dart';

/// Where to pay for a reserved number.
///
/// The payment happens on the provider's own page, in a browser, and the
/// confirmation reaches the server on a callback rather than through the phone.
/// So this sheet hands somebody off and stops; the order's status is asked for
/// again when they come back, and the cabinet is where they see it settle.
///
/// Deliberately not a web view. A payment page inside an app is a page whose
/// address the person cannot see, which is the shape every phishing screen has
/// — and the bank apps these redirect into cannot be reached from one anyway.
Future<void> showCheckoutSheet(BuildContext context, Order order) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Brand.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (context) => _Checkout(order: order),
  );
}

class _Checkout extends StatelessWidget {
  const _Checkout({required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${order.number} band qilindi',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Brand.black),
            ),
            const SizedBox(height: 6),
            Text(
              '${som(order.amount)} — to\'lovni tanlang',
              style: TextStyle(fontSize: 15, color: Brand.black.withValues(alpha: 0.6)),
            ),
            const SizedBox(height: 22),
            if (order.paymeUrl.isNotEmpty) ...[
              LimeButton(
                label: 'Payme orqali to\'lash',
                onPressed: () => _open(order.paymeUrl),
              ),
              const SizedBox(height: 10),
            ],
            if (order.clickUrl.isNotEmpty)
              OutlineButton(
                label: 'Click orqali to\'lash',
                onPressed: () => _open(order.clickUrl),
              ),
            const SizedBox(height: 18),
            Text(
              'To\'lovdan keyin raqam kabinetingizda paydo bo\'ladi. '
              'Agar 30 daqiqada to\'lanmasa, band qilish bekor bo\'ladi.',
              style: TextStyle(fontSize: 12, height: 1.5, color: Brand.black.withValues(alpha: 0.45)),
            ),
          ],
        ),
      ),
    );
  }

  /// Opens the provider's page outside the app, where its address is visible
  /// and where a bank app can take over.
  void _open(String url) {
    launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }
}
