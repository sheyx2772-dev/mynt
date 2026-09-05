import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../brand/palette.dart';
import '../core/api/errors.dart';
import '../state/providers.dart';
import '../state/session_controller.dart';
import '../widgets/buttons.dart';

/// Signing in, which is a phone number and a code.
///
/// A number rather than an address because the phone is the thing everybody
/// here has and remembers, and because the card being sold is handed to people
/// who will never be asked for an email. The website still signs in by link;
/// somebody who starts there arrives through the deep link in `main.dart`.
///
/// Nothing on this screen holds a secret, which is why it can be the only
/// screen reachable signed out.
class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key, this.next});

  /// Where the person was going before they were asked to sign in.
  final String? next;

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  // The country this sells in today. Typed over rather than locked: the
  // backend stores a number in international form and reads the country from
  // the dial code, so a Kazakh number works the moment somebody types one.
  static const _defaultDialCode = '+998 ';

  final _phone = TextEditingController(text: _defaultDialCode);
  final _code = TextEditingController();
  final _codeFocus = FocusNode();

  bool _busy = false;
  String? _problem;

  /// The number a code was sent to. Non-null means the second step.
  String? _sentTo;

  @override
  void dispose() {
    _phone.dispose();
    _code.dispose();
    _codeFocus.dispose();
    super.dispose();
  }

  /// What the server wants: digits, with the dial code and no spaces.
  String get _normalised => _phone.text.replaceAll(RegExp(r'[^0-9]'), '');

  Future<void> _send() async {
    final phone = _normalised;
    // Nine digits after a three-digit dial code is the shortest real number
    // here. Checked so an obviously empty field does not spend an SMS.
    if (phone.length < 9) {
      setState(() => _problem = 'Raqamni to\'liq kiriting.');
      return;
    }

    setState(() {
      _busy = true;
      _problem = null;
    });

    try {
      await ref.read(apiProvider).requestCode(phone);
      if (!mounted) return;
      setState(() => _sentTo = phone);
      _codeFocus.requestFocus();
    } on ApiException catch (error) {
      if (mounted) setState(() => _problem = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _confirm() async {
    final code = _code.text.trim();
    if (code.length != 6) return;

    setState(() {
      _busy = true;
      _problem = null;
    });

    try {
      await ref.read(sessionProvider.notifier).confirmCode(_sentTo!, code);
      // Nothing to navigate to: the router sends a signed-in person on as soon
      // as the session provider carries an account.
    } on ApiException catch (error) {
      if (mounted) {
        setState(() {
          _problem = error.message;
          _code.clear();
        });
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // A link that failed — expired, already used — leaves the session in an
    // error state and the person back on this screen. Without this they would
    // be returned here with no explanation.
    final rejected = ref.watch(sessionProvider).error;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: _sentTo == null ? _askForNumber(rejected) : _askForCode(),
          ),
        ),
      ),
    );
  }

  List<Widget> _askForNumber(Object? rejected) => [
        const _Wordmark(),
        const SizedBox(height: 28),
        const _Title('Kirish'),
        const SizedBox(height: 8),
        _Lead('Telefon raqamingizga 6 xonali kod yuboramiz. Parol kerak emas.'),
        const SizedBox(height: 28),
        TextField(
          controller: _phone,
          keyboardType: TextInputType.phone,
          autofillHints: const [AutofillHints.telephoneNumber],
          onSubmitted: (_) => _send(),
          style: const TextStyle(fontSize: 18, letterSpacing: 0.5),
          decoration: _field('+998 90 123 45 67'),
        ),
        ..._problemLine(rejected),
        const SizedBox(height: 20),
        LimeButton(label: 'Kod yuborish', busy: _busy, onPressed: _send),
      ];

  List<Widget> _askForCode() => [
        const _Wordmark(),
        const SizedBox(height: 28),
        const _Title('Kodni kiriting'),
        const SizedBox(height: 8),
        _Lead('+$_sentTo raqamiga yuborildi. Kod 5 daqiqa amal qiladi.'),
        const SizedBox(height: 28),
        TextField(
          controller: _code,
          focusNode: _codeFocus,
          keyboardType: TextInputType.number,
          // Android reads the code straight out of the message with this, so
          // most people never see the SMS at all.
          autofillHints: const [AutofillHints.oneTimeCode],
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            LengthLimitingTextInputFormatter(6),
          ],
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 28, letterSpacing: 12, fontWeight: FontWeight.w600),
          // Six digits is the whole field, so there is nothing to press after
          // the last one.
          onChanged: (value) {
            if (value.length == 6) _confirm();
          },
          decoration: _field('••••••'),
        ),
        ..._problemLine(null),
        const SizedBox(height: 20),
        LimeButton(label: 'Kirish', busy: _busy, onPressed: _confirm),
        const SizedBox(height: 12),
        OutlineButton(
          label: 'Boshqa raqam',
          onPressed: () => setState(() {
            _sentTo = null;
            _code.clear();
            _problem = null;
          }),
        ),
      ];

  List<Widget> _problemLine(Object? rejected) {
    if (_problem == null && rejected == null) return const [];
    return [
      const SizedBox(height: 12),
      Text(
        _problem ??
            (rejected is ApiException ? rejected.message : 'Kirib bo\'lmadi. Qayta urining.'),
        style: const TextStyle(fontSize: 14, color: Color(0xFFB91C1C)),
      ),
    ];
  }

  InputDecoration _field(String hint) => InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: Brand.black.withValues(alpha: 0.04),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
      );
}

class _Title extends StatelessWidget {
  const _Title(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w600, color: Brand.black),
      );
}

class _Lead extends StatelessWidget {
  const _Lead(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Text(
        text,
        style: TextStyle(fontSize: 15, height: 1.5, color: Brand.black.withValues(alpha: 0.6)),
      );
}

class _Wordmark extends StatelessWidget {
  const _Wordmark();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: const BoxDecoration(color: Brand.lime, shape: BoxShape.circle),
        ),
        const SizedBox(width: 10),
        Text(
          'FLEX',
          style: TextStyle(
            fontSize: 13,
            letterSpacing: 4,
            fontWeight: FontWeight.w700,
            color: Brand.black.withValues(alpha: 0.7),
          ),
        ),
      ],
    );
  }
}
