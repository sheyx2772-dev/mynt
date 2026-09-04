import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../app.dart';
import '../core/pricing.dart';
import '../data/handle_repository.dart';
import '../models/handle_profile.dart';
import '../theme/mynt_theme.dart';
import '../widgets/mynt_background.dart';
import '../widgets/mynt_buttons.dart';
import '../widgets/mynt_cards.dart';
import '../widgets/mynt_fields.dart';
import '../widgets/mynt_marks.dart';

/// Binds a physical card's serial to the signed-in user's handle. Reading
/// the serial off the chip needs a platform NFC plugin; until that is wired
/// the serial is typed, which is also the fallback on phones without NFC.
class ActivateCardScreen extends StatefulWidget {
  const ActivateCardScreen({super.key});

  @override
  State<ActivateCardScreen> createState() => _ActivateCardScreenState();
}

class _ActivateCardScreenState extends State<ActivateCardScreen> {
  final _serial = TextEditingController();

  Future<HandleProfile?>? _mine;
  bool _busy = false;
  String? _error;
  bool _done = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _mine ??= MyntServices.of(context).handles.mine();
  }

  @override
  void dispose() {
    _serial.dispose();
    super.dispose();
  }

  Future<void> _activate(String handle) async {
    final serial = parseGenesisSerial(_serial.text.trim());
    if (serial == null) {
      setState(() => _error = 'Seriya raqami 6 ta raqamdan iborat (000247).');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await MyntServices.of(context)
          .handles
          .activateCard(serial: serial, handle: handle);
      if (mounted) setState(() => _done = true);
    } on HandleFailure catch (failure) {
      if (mounted) setState(() => _error = failure.message);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MyntScaffold(
      showGrid: false,
      glows: const [Alignment(1.3, -0.4)],
      child: FutureBuilder<HandleProfile?>(
        future: _mine,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(
                color: MyntColors.black,
                strokeWidth: 2.4,
              ),
            );
          }
          final handle = snapshot.data?.normalized;
          if (handle == null) return const _NoHandleYet();
          if (_done) return _Activated(handle: handle);
          return _Form(
            handle: handle,
            serial: _serial,
            busy: _busy,
            error: _error,
            onActivate: () => _activate(handle),
          );
        },
      ),
    );
  }
}

class _Form extends StatelessWidget {
  const _Form({
    required this.handle,
    required this.serial,
    required this.busy,
    required this.error,
    required this.onActivate,
  });

  final String handle;
  final TextEditingController serial;
  final bool busy;
  final String? error;
  final VoidCallback onActivate;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Align(alignment: Alignment.centerLeft, child: BackPill()),
        const SizedBox(height: 24),
        Text(
          'Kartangiz yetib keldi.',
          style: MyntTypography.display(size: 30, height: 1.1, letterSpacing: -0.03),
        ),
        const SizedBox(height: 10),
        Text(
          'Seriya raqamini kiriting — karta handleʼingizga bogʻlanadi. '
          'Boshqa hech qanday sozlash kerak emas.',
          style: MyntTypography.body(
            size: 14,
            height: 1.55,
            color: MyntColors.inkAt(0.55),
          ),
        ),
        const SizedBox(height: 30),
        Center(child: PhysicalCard(handle: handle)),
        const SizedBox(height: 30),
        MyntTextField(
          controller: serial,
          hint: '000247',
          keyboardType: TextInputType.number,
        ),
        if (error != null) ...[
          const SizedBox(height: 12),
          Text(
            error!,
            style: MyntTypography.body(size: 13, color: const Color(0xFFB91C1C)),
          ),
        ],
        const Spacer(),
        LimeButton(
          label: 'Aktivlashtirish',
          busy: busy,
          onPressed: busy ? null : onActivate,
        ),
      ],
    );
  }
}

/// The card itself, drawn to the same spec as the physical print.
class PhysicalCard extends StatelessWidget {
  const PhysicalCard({super.key, required this.handle, this.serial});

  final String handle;
  final String? serial;

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: -0.07,
      child: SizedBox(
        width: 300,
        height: 188,
        child: MyntDarkCard(
          radius: 18,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  MyntWordmark(size: 22, onDark: true),
                  NfcMark(size: 26),
                ],
              ),
              const Spacer(),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: Text(
                      handle,
                      style: MyntTypography.tabular(
                        size: 27,
                        weight: FontWeight.w600,
                        color: MyntColors.white,
                        displayFace: true,
                      ),
                    ),
                  ),
                  Text(
                    '#${serial ?? "000247"}',
                    style: MyntTypography.tabular(
                      size: 11,
                      weight: FontWeight.w400,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Activated extends StatelessWidget {
  const _Activated({required this.handle});

  final String handle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Spacer(),
        const Center(
          child: Icon(Icons.check_circle_rounded, size: 72, color: MyntColors.lime),
        ),
        const SizedBox(height: 24),
        Text(
          'Karta faollashtirildi.',
          textAlign: TextAlign.center,
          style: MyntTypography.display(size: 28, letterSpacing: -0.03),
        ),
        const SizedBox(height: 10),
        Text(
          'Endi har tegizishda mynt.uz/$handle ochiladi.',
          textAlign: TextAlign.center,
          style: MyntTypography.body(
            size: 14,
            height: 1.55,
            color: MyntColors.inkAt(0.55),
          ),
        ),
        const Spacer(),
        LimeButton(
          label: 'Tegizishni sinab koʻrish',
          onPressed: () => context.push('/tap/$handle'),
        ),
        const SizedBox(height: 10),
        OutlineButton(
          label: 'Leadlarga oʻtish',
          onPressed: () => context.go('/app/leads'),
        ),
      ],
    );
  }
}

class _NoHandleYet extends StatelessWidget {
  const _NoHandleYet();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Avval handle band qiling.',
            style: MyntTypography.display(size: 22),
          ),
          const SizedBox(height: 10),
          Text(
            'Karta handleʼga bogʻlanadi, shuning uchun tartib shunday.',
            textAlign: TextAlign.center,
            style: MyntTypography.body(
              size: 13,
              height: 1.55,
              color: MyntColors.inkAt(0.55),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: 220,
            child: LimeButton(
              label: 'Handle tanlash',
              onPressed: () => context.go('/'),
            ),
          ),
        ],
      ),
    );
  }
}
