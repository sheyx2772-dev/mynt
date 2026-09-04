import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../brand/palette.dart';
import '../core/api/errors.dart';
import '../state/providers.dart';
import '../state/session_controller.dart';
import '../widgets/buttons.dart';

/// Signing in, which is two steps and no password.
///
/// The address is typed here; the link arrives by mail and opens the app
/// again through the deep link in `main.dart`. Nothing on this screen holds a
/// secret, which is why it can be the only screen reachable signed out.
class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key, this.next});

  /// Where the person was going before they were asked to sign in.
  final String? next;

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _email = TextEditingController();
  bool _sending = false;
  bool _sent = false;
  String? _problem;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() {
      _sending = true;
      _problem = null;
    });

    try {
      await ref.read(apiProvider).requestLink(_email.text.trim());
      if (mounted) setState(() => _sent = true);
    } on ApiException catch (error) {
      if (mounted) setState(() => _problem = error.message);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // A link that failed — expired, already used — leaves the session in an
    // error state and the person back on this screen. Without this they would
    // be returned here with no explanation, and would go looking in their mail
    // for a link that will never work.
    final rejected = ref.watch(sessionProvider).error;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: _sent ? _linkSent() : _askForAddress(rejected),
          ),
        ),
      ),
    );
  }

  List<Widget> _askForAddress(Object? rejected) => [
        const _Wordmark(),
        const SizedBox(height: 28),
        const Text(
          'Kirish',
          style: TextStyle(fontSize: 30, fontWeight: FontWeight.w600, color: Brand.black),
        ),
        const SizedBox(height: 8),
        Text(
          'Parol yo\'q. Manzilingizga bir martalik havola yuboramiz.',
          style: TextStyle(fontSize: 15, height: 1.5, color: Brand.black.withValues(alpha: 0.6)),
        ),
        const SizedBox(height: 28),
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          autocorrect: false,
          // An address is not a name: capitalising the first letter is one more
          // thing to undo on a phone keyboard.
          textCapitalization: TextCapitalization.none,
          autofillHints: const [AutofillHints.email],
          onSubmitted: (_) => _send(),
          decoration: _fieldDecoration('siz@example.com'),
        ),
        if (_problem != null || rejected != null) ...[
          const SizedBox(height: 12),
          Text(
            _problem ??
                (rejected is ApiException
                    ? rejected.message
                    : 'Havola ishlamadi. Yangisini so\'rang.'),
            style: const TextStyle(fontSize: 14, color: Color(0xFFB91C1C)),
          ),
        ],
        const SizedBox(height: 20),
        LimeButton(label: 'Havola yuborish', busy: _sending, onPressed: _send),
      ];

  List<Widget> _linkSent() => [
        const _Wordmark(),
        const SizedBox(height: 28),
        const Text(
          'Xatingizni tekshiring',
          style: TextStyle(fontSize: 30, fontWeight: FontWeight.w600, color: Brand.black),
        ),
        const SizedBox(height: 10),
        Text(
          // Deliberately not "we sent a link to this address". The server
          // answers the same way whether an account exists, and the screen must
          // not claim more than the server said.
          'Agar manzil to\'g\'ri bo\'lsa, havola yuborildi. '
          'U 15 daqiqa amal qiladi va bir marta ishlaydi.',
          style: TextStyle(fontSize: 15, height: 1.5, color: Brand.black.withValues(alpha: 0.6)),
        ),
        const SizedBox(height: 24),
        OutlineButton(
          label: 'Boshqa manzil',
          onPressed: () => setState(() => _sent = false),
        ),
      ];

  InputDecoration _fieldDecoration(String hint) => InputDecoration(
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
