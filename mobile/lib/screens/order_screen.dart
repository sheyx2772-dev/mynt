import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../brand/palette.dart';
import '../core/api/errors.dart';
import '../core/models/purchase.dart';
import '../core/money.dart';
import '../state/providers.dart';
import '../widgets/buttons.dart';
import '../widgets/states.dart';

/// Where somebody lands after paying.
///
/// The confirmation does not come through the phone — it arrives on the
/// website's callback from the provider — so this screen asks the server
/// instead, and keeps asking for a short while. A bank confirmation takes a few
/// seconds and occasionally a few minutes; a screen that answered once would
/// tell most buyers their payment had not gone through.
class OrderScreen extends ConsumerStatefulWidget {
  const OrderScreen({super.key, required this.id});

  final String id;

  @override
  ConsumerState<OrderScreen> createState() => _OrderScreenState();
}

class _OrderScreenState extends ConsumerState<OrderScreen> {
  /// Every three seconds for a minute. Long enough for a bank, short enough
  /// that a phone left on this screen is not asking all afternoon.
  static const _every = Duration(seconds: 3);
  static const _attempts = 20;

  Order? _order;
  Object? _error;
  Timer? _timer;
  int _tries = 0;

  @override
  void initState() {
    super.initState();
    _ask();
    _timer = Timer.periodic(_every, (_) => _ask());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _ask() async {
    if (!mounted) return;

    try {
      final order = await ref.read(apiProvider).order(widget.id);
      if (!mounted) return;

      setState(() {
        _order = order;
        _error = null;
      });

      // Stop as soon as there is an answer, rather than running the clock out.
      if (order.status != 'pending') {
        _timer?.cancel();
        ref.invalidate(myNumbersProvider);
      }
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error);
    }

    if (++_tries >= _attempts) _timer?.cancel();
  }

  @override
  Widget build(BuildContext context) {
    final order = _order;

    return Scaffold(
      appBar: AppBar(title: const Text('Buyurtma')),
      body: Padding(
        padding: const EdgeInsets.all(28),
        child: Center(
          child: switch ((order, _error)) {
            (null, final e?) => Failed(error: e, onRetry: _ask),
            (null, _) => const Waiting(),
            (final o?, _) => _Result(order: o, waiting: _timer?.isActive ?? false),
          },
        ),
      ),
    );
  }
}

class _Result extends StatelessWidget {
  const _Result({required this.order, required this.waiting});

  final Order order;
  final bool waiting;

  @override
  Widget build(BuildContext context) {
    final (icon, colour, title, detail) = switch (order.status) {
      'paid' => (
          Icons.check_circle,
          Brand.limeInk,
          '${order.number} sizniki',
          'Kabinetda profilini to\'ldiring va kartaga yozing.',
        ),
      'pending' when waiting => (
          Icons.hourglass_empty,
          Brand.black,
          'To\'lov tekshirilmoqda',
          'Bank tasdig\'i bir necha daqiqa olishi mumkin.',
        ),
      'pending' => (
          Icons.hourglass_empty,
          Brand.black,
          'Hali tasdiqlanmadi',
          'To\'lov o\'tgan bo\'lsa, biroz kutib qayta tekshiring.',
        ),
      _ => (
          Icons.cancel_outlined,
          const Color(0xFFB91C1C),
          'Buyurtma bekor qilindi',
          'Raqam yana bo\'shadi. Qaytadan urinib ko\'rishingiz mumkin.',
        ),
    };

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 44, color: colour),
        const SizedBox(height: 14),
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Brand.black),
        ),
        const SizedBox(height: 6),
        Text(
          detail,
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 14, height: 1.5, color: Brand.black.withValues(alpha: 0.6)),
        ),
        const SizedBox(height: 10),
        Text(
          som(order.amount),
          style: TextStyle(fontSize: 13, color: Brand.black.withValues(alpha: 0.4)),
        ),
        const SizedBox(height: 28),
        OutlineButton(
          label: order.status == 'paid' ? 'Raqamga o\'tish' : 'Raqamlarim',
          onPressed: () => order.status == 'paid'
              ? context.go('/raqam/${order.number}')
              : context.go('/'),
        ),
      ],
    );
  }
}
