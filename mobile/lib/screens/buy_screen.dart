import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../brand/palette.dart';
import '../core/api/errors.dart';
import '../core/models/purchase.dart';
import '../state/providers.dart';
import '../widgets/buttons.dart';
import '../widgets/checkout_sheet.dart';
import '../widgets/number_quote.dart';

/// Buying a number, which is the only screen that starts with a keyboard.
///
/// Three letters and three digits, and the price appears with the reason for
/// it. Nothing about the price is computed here — the server quotes it, and the
/// server charges it, so the two cannot differ.
class BuyScreen extends ConsumerStatefulWidget {
  const BuyScreen({super.key});

  @override
  ConsumerState<BuyScreen> createState() => _BuyScreenState();
}

class _BuyScreenState extends ConsumerState<BuyScreen> {
  final _input = TextEditingController();
  NumberState? _quote;
  bool _checking = false;
  String? _problem;

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  Future<void> _check() async {
    final number = _input.text.trim().toUpperCase();
    // Checked here only to avoid a round trip for something obviously not a
    // number. The server checks it again, which is the check that counts.
    if (!RegExp(r'^[A-Z]{3}[0-9]{3}$').hasMatch(number)) {
      setState(() {
        _quote = null;
        _problem = 'Uch harf va uch raqam. Masalan MYN042.';
      });
      return;
    }

    setState(() {
      _checking = true;
      _problem = null;
    });

    try {
      final quote = await ref.read(apiProvider).check(number);
      if (mounted) setState(() => _quote = quote);
    } on ApiException catch (error) {
      if (mounted) setState(() => _problem = error.message);
    } finally {
      if (mounted) setState(() => _checking = false);
    }
  }

  Future<void> _buy(NumberState quote) async {
    final name = await _askForName();
    if (name == null || !mounted) return;

    try {
      final order = await ref.read(apiProvider).buy(quote.number, name);
      // The cabinet holds a copy of what this account owns, and a reserved
      // number belongs in it straight away.
      ref.invalidate(myNumbersProvider);

      if (!mounted) return;
      if (order.needsPayment) {
        await showCheckoutSheet(context, order);
        // Straight to the order, which asks the server whether the payment
        // landed. Leaving somebody on a search box after they paid is how a
        // successful purchase looks like a failed one.
        if (mounted) context.pushReplacement('/buyurtma/${order.id}');
        return;
      } else {
        // No provider configured: the number is already theirs.
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${order.number} sizniki')),
        );
      }
      if (mounted) Navigator.of(context).pop();
    } on ApiException catch (error) {
      if (mounted) setState(() => _problem = error.message);
    }
  }

  /// The name on the card, and nothing else. Asking for fourteen profile fields
  /// before somebody has paid is how a purchase gets abandoned; the rest is
  /// edited afterwards.
  Future<String?> _askForName() {
    final name = TextEditingController();

    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Kartada qanday ism tursin?'),
        content: TextField(
          controller: name,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(hintText: 'Aziz Karimov'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Bekor qilish'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, name.text.trim()),
            child: const Text('Davom etish'),
          ),
        ],
      ),
    ).whenComplete(name.dispose);
  }

  @override
  Widget build(BuildContext context) {
    final quote = _quote;

    return Scaffold(
      appBar: AppBar(title: const Text('Raqam olish')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 40),
        children: [
          TextField(
            controller: _input,
            autofocus: true,
            textCapitalization: TextCapitalization.characters,
            autocorrect: false,
            maxLength: 6,
            onSubmitted: (_) => _check(),
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              letterSpacing: 6,
              color: Brand.black,
            ),
            textAlign: TextAlign.center,
            decoration: InputDecoration(
              hintText: 'AAA000',
              counterText: '',
              filled: true,
              fillColor: Brand.black.withValues(alpha: 0.04),
              contentPadding: const EdgeInsets.symmetric(vertical: 20),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 12),
          LimeButton(label: 'Tekshirish', busy: _checking, onPressed: _check),
          if (_problem != null) ...[
            const SizedBox(height: 16),
            Text(
              _problem!,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: Color(0xFFB91C1C)),
            ),
          ],
          if (quote != null) ...[
            const SizedBox(height: 28),
            NumberQuote(quote: quote, onBuy: () => _buy(quote)),
          ],
        ],
      ),
    );
  }
}
