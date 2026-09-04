import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../app.dart';
import '../core/formatting.dart';
import '../core/pricing.dart';
import '../data/handle_repository.dart';
import '../theme/mynt_theme.dart';
import '../widgets/mynt_background.dart';
import '../widgets/mynt_buttons.dart';
import '../widgets/mynt_cards.dart';
import '../widgets/mynt_marks.dart';

const _cardPrice = 149000;

enum PaymentMethod { payme, click, uzcard }

extension on PaymentMethod {
  String get label => switch (this) {
        PaymentMethod.payme => 'Payme',
        PaymentMethod.click => 'Click',
        PaymentMethod.uzcard => 'Uzcard / Humo',
      };

  String get note => switch (this) {
        PaymentMethod.uzcard => 'Bevosita karta',
        _ => 'Karta yoki hisob',
      };
}

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({
    super.key,
    required this.handle,
    required this.ownerName,
    required this.bio,
  });

  final String handle;
  final String ownerName;
  final String bio;

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  bool _withCard = true;
  PaymentMethod _method = PaymentMethod.payme;
  bool _busy = false;
  String? _error;

  int get _handlePrice {
    final parsed = parseHandle(widget.handle);
    return parsed?.price ?? basePrice;
  }

  int get _total => _handlePrice + (_withCard ? _cardPrice : 0);

  /// No payment provider is wired yet, so this goes straight to claiming.
  /// When Payme/Click land, the claim moves behind their callback and this
  /// button only opens the provider's sheet.
  Future<void> _pay() async {
    final parsed = parseHandle(widget.handle);
    if (parsed == null) return;

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      await MyntServices.of(context).handles.claim(
            letters: parsed.letters,
            digits: parsed.digits,
            ownerName: widget.ownerName,
            bio: widget.bio,
          );
      if (!mounted) return;
      context.go('/success/${widget.handle}');
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
      glows: const [Alignment(1.3, 1.3)],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const BackPill(),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (var i = 0; i < 3; i++) ...[
                    Container(
                      width: 22,
                      height: 4,
                      decoration: BoxDecoration(
                        color: i < 2 ? MyntColors.lime : MyntColors.black,
                        borderRadius: BorderRadius.circular(MyntRadii.pill),
                      ),
                    ),
                    if (i < 2) const SizedBox(width: 6),
                  ],
                ],
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            "To'lov",
            style: MyntTypography.display(size: 30, height: 1.1, letterSpacing: -0.03),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyntDarkCard(
                    radius: MyntRadii.panel,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'BUYURTMA',
                                style: MyntTypography.body(
                                  size: 11,
                                  color: Colors.white.withValues(alpha: 0.45),
                                ).copyWith(letterSpacing: 1),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                widget.handle,
                                style: MyntTypography.tabular(
                                  size: 24,
                                  weight: FontWeight.w600,
                                  color: MyntColors.white,
                                  displayFace: true,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const NfcMark(size: 30),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  MyntCard(
                    shadow: false,
                    radius: MyntRadii.panel,
                    padding: const EdgeInsets.fromLTRB(18, 4, 18, 16),
                    child: Column(
                      children: [
                        BreakdownRow(
                          label: 'Handle ${widget.handle}',
                          value: formatNumber(_handlePrice),
                          topBorder: false,
                        ),
                        _CardToggleRow(
                          on: _withCard,
                          onChanged: (value) => setState(() => _withCard = value),
                        ),
                        BreakdownRow(
                          label: 'Yetkazib berish',
                          value: 'Bepul',
                          muted: true,
                        ),
                        Container(
                          padding: const EdgeInsets.only(top: 14),
                          decoration: const BoxDecoration(
                            border: Border(
                              top: BorderSide(color: MyntColors.hairlineSoft),
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  'Jami',
                                  style: MyntTypography.display(size: 16),
                                ),
                              ),
                              Text(
                                formatUZS(_total),
                                style: MyntTypography.tabular(
                                  size: 20,
                                  weight: FontWeight.w600,
                                  displayFace: true,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  const Eyebrow("To'lov usuli"),
                  const SizedBox(height: 10),
                  for (final method in PaymentMethod.values) ...[
                    _MethodRow(
                      method: method,
                      selected: _method == method,
                      onTap: () => setState(() => _method = method),
                    ),
                    const SizedBox(height: 8),
                  ],
                  if (_error != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _error!,
                      style: MyntTypography.body(
                        size: 13,
                        height: 1.5,
                        color: const Color(0xFFB91C1C),
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),
          LimeButton(
            label: "${formatUZS(_total)} to'lash",
            busy: _busy,
            onPressed: _busy ? null : _pay,
          ),
          const SizedBox(height: 10),
          Text(
            "To'lov tizimi hali ulanmagan — bu bosqich hozircha handle'ni "
            'to\'g\'ridan-to\'g\'ri band qiladi.',
            textAlign: TextAlign.center,
            style: MyntTypography.body(
              size: 11,
              height: 1.5,
              color: MyntColors.inkAt(0.4),
            ),
          ),
        ],
      ),
    );
  }
}

class _CardToggleRow extends StatelessWidget {
  const _CardToggleRow({required this.on, required this.onChanged});

  final bool on;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: MyntColors.hairlineSoft)),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 46,
            height: 28,
            child: FittedBox(
              fit: BoxFit.fill,
              child: Switch(
                value: on,
                onChanged: onChanged,
                activeThumbColor: MyntColors.white,
                activeTrackColor: MyntColors.black,
                inactiveThumbColor: MyntColors.white,
                inactiveTrackColor: MyntColors.inkAt(0.16),
                trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'MYNT CARD',
                  style: MyntTypography.body(size: 14, weight: FontWeight.w500),
                ),
                const SizedBox(height: 2),
                Text(
                  'NFC karta, bepul yetkazish',
                  style: MyntTypography.body(
                    size: 11,
                    color: MyntColors.inkAt(0.45),
                  ),
                ),
              ],
            ),
          ),
          Text(
            on ? formatNumber(_cardPrice) : "Qo'shilmagan",
            style: MyntTypography.tabular(
              size: 14,
              weight: FontWeight.w400,
              color: on ? MyntColors.black : MyntColors.inkAt(0.35),
            ),
          ),
        ],
      ),
    );
  }
}

class _MethodRow extends StatelessWidget {
  const _MethodRow({
    required this.method,
    required this.selected,
    required this.onTap,
  });

  final PaymentMethod method;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(MyntRadii.control),
      child: Container(
        height: 52,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: MyntColors.white,
          borderRadius: BorderRadius.circular(MyntRadii.control),
          border: Border.all(
            color: selected ? MyntColors.black : MyntColors.hairline,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: selected ? MyntColors.black : MyntColors.inkAt(0.2),
                  width: 1.5,
                ),
              ),
              child: Center(
                child: Container(
                  width: 9,
                  height: 9,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: selected ? MyntColors.lime : Colors.transparent,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                method.label,
                style: MyntTypography.body(size: 14, weight: FontWeight.w500),
              ),
            ),
            Text(
              method.note,
              style: MyntTypography.body(size: 11, color: MyntColors.inkAt(0.4)),
            ),
          ],
        ),
      ),
    );
  }
}
