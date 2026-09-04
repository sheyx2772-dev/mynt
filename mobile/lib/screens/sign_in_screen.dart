import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../app.dart';
import '../data/auth_repository.dart';
import '../theme/mynt_theme.dart';
import '../widgets/mynt_background.dart';
import '../widgets/mynt_buttons.dart';
import '../widgets/mynt_fields.dart';

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key, this.next});

  /// Where to go once signed in — set by the router's redirect.
  final String? next;

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _destination = TextEditingController();
  final _code = TextEditingController();

  SignInChannel _channel = SignInChannel.phone;
  bool _codeSent = false;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _destination.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action, {VoidCallback? onDone}) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
      if (!mounted) return;
      onDone?.call();
    } on AuthFailure catch (failure) {
      if (mounted) setState(() => _error = failure.message);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _sendCode() {
    final auth = MyntServices.of(context).auth;
    _run(
      () => auth.requestCode(
        channel: _channel,
        destination: _destination.text,
      ),
      onDone: () => setState(() => _codeSent = true),
    );
  }

  void _verify() {
    final auth = MyntServices.of(context).auth;
    _run(
      () => auth.verifyCode(
        channel: _channel,
        destination: _destination.text,
        code: _code.text,
      ),
      onDone: () => context.go(widget.next ?? '/'),
    );
  }

  void _explainTelegram() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: MyntColors.black,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 6),
        content: Text(
          AuthRepository.telegramAvailability,
          style: MyntTypography.body(size: 13, color: MyntColors.white, height: 1.5),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MyntScaffold(
      glows: const [Alignment(0, -1.25)],
      child: SingleChildScrollView(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minHeight: MediaQuery.sizeOf(context).height * 0.72,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 60),
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  color: MyntColors.black,
                  borderRadius: BorderRadius.circular(17),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x990E0A1B),
                      blurRadius: 40,
                      spreadRadius: -16,
                      offset: Offset(0, 18),
                    ),
                  ],
                ),
                child: Center(
                  child: Container(
                    width: 15,
                    height: 15,
                    decoration: const BoxDecoration(
                      color: MyntColors.lime,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 28),
              Text(
                _codeSent ? 'Kodni kiriting.' : "Handle'ingizni\nboshqaring.",
                style: MyntTypography.display(
                  size: 34,
                  height: 1.08,
                  letterSpacing: -0.035,
                ),
              ),
              const SizedBox(height: 14),
              Text(
                _codeSent
                    ? '${_destination.text} manziliga yuborilgan 6 xonali kod.'
                    : 'Profil, leadlar va NFC kartangiz — bitta hisobda. '
                        "Parol o'ylab topish shart emas.",
                style: MyntTypography.body(
                  size: 15,
                  height: 1.55,
                  color: MyntColors.inkAt(0.55),
                ),
              ),
              const SizedBox(height: 32),
              if (_codeSent) ..._codeStep() else ..._destinationStep(),
              if (_error != null) ...[
                const SizedBox(height: 14),
                Text(
                  _error!,
                  style: MyntTypography.body(
                    size: 13,
                    height: 1.5,
                    color: const Color(0xFFB91C1C),
                  ),
                ),
              ],
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _destinationStep() {
    final isPhone = _channel == SignInChannel.phone;
    return [
      LimeButton(
        label: 'Telegram bilan kirish',
        icon: const Icon(Icons.send_rounded, size: 18, color: MyntColors.black),
        onPressed: _explainTelegram,
      ),
      const SizedBox(height: 18),
      Row(
        children: [
          Expanded(child: Container(height: 1, color: MyntColors.hairline)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              'yoki',
              style: MyntTypography.body(size: 12, color: MyntColors.inkAt(0.4)),
            ),
          ),
          Expanded(child: Container(height: 1, color: MyntColors.hairline)),
        ],
      ),
      const SizedBox(height: 18),
      SegmentedButton<SignInChannel>(
        segments: const [
          ButtonSegment(value: SignInChannel.phone, label: Text('Telefon')),
          ButtonSegment(value: SignInChannel.email, label: Text('Email')),
        ],
        selected: {_channel},
        showSelectedIcon: false,
        onSelectionChanged: (selection) => setState(() {
          _channel = selection.first;
          _destination.clear();
          _error = null;
        }),
        style: SegmentedButton.styleFrom(
          backgroundColor: MyntColors.white,
          selectedBackgroundColor: MyntColors.black,
          selectedForegroundColor: MyntColors.white,
          foregroundColor: MyntColors.inkAt(0.6),
          side: const BorderSide(color: MyntColors.hairline),
        ),
      ),
      const SizedBox(height: 14),
      MyntTextField(
        controller: _destination,
        hint: isPhone ? '90 123 45 67' : 'siz@example.com',
        prefix: isPhone ? '+998 ' : null,
        keyboardType:
            isPhone ? TextInputType.phone : TextInputType.emailAddress,
      ),
      const SizedBox(height: 14),
      OutlineButton(label: 'Kod yuborish', onPressed: _busy ? null : _sendCode),
      const SizedBox(height: 18),
      Text(
        'Davom etish orqali Shartlar va Maxfiylik siyosatiga rozilik bildirasiz.',
        textAlign: TextAlign.center,
        style: MyntTypography.body(
          size: 11,
          height: 1.6,
          color: MyntColors.inkAt(0.4),
        ),
      ),
    ];
  }

  List<Widget> _codeStep() {
    return [
      MyntTextField(
        controller: _code,
        hint: '••••••',
        keyboardType: TextInputType.number,
      ),
      const SizedBox(height: 14),
      LimeButton(
        label: 'Tasdiqlash',
        busy: _busy,
        onPressed: _busy ? null : _verify,
      ),
      const SizedBox(height: 8),
      GhostButton(
        label: 'Boshqa raqam kiritish',
        onPressed: () => setState(() {
          _codeSent = false;
          _code.clear();
          _error = null;
        }),
      ),
    ];
  }
}
