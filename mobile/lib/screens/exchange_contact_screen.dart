import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../app.dart';
import '../models/handle_profile.dart';
import '../models/lead.dart';
import '../theme/mynt_theme.dart';
import '../widgets/mynt_background.dart';
import '../widgets/mynt_buttons.dart';
import '../widgets/mynt_cards.dart';
import '../widgets/mynt_fields.dart';

/// The other half of a tap: the visitor got a contact, now they are asked
/// to leave one. This is the step that turns a business card into a lead.
class ExchangeContactScreen extends StatefulWidget {
  const ExchangeContactScreen({super.key, required this.handle});

  final String handle;

  @override
  State<ExchangeContactScreen> createState() => _ExchangeContactScreenState();
}

class _ExchangeContactScreenState extends State<ExchangeContactScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _company = TextEditingController();

  Future<HandleProfile?>? _owner;
  bool _busy = false;
  bool _sent = false;
  String? _error;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _owner ??= MyntServices.of(context).handles.fetch(widget.handle);
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _company.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_name.text.trim().isEmpty) {
      setState(() => _error = 'Ismingizni kiriting.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await MyntServices.of(context).leads.create(
            handle: widget.handle,
            name: _name.text.trim(),
            phone: _phone.text.trim(),
            company: _company.text.trim(),
            source: LeadSource.nfc,
          );
      if (mounted) setState(() => _sent = true);
    } catch (error) {
      if (mounted) setState(() => _error = 'Yuborib bo\'lmadi. Qayta urining.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MyntScaffold(
      showGrid: false,
      glows: const [Alignment(1.3, -1.2)],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          FutureBuilder<HandleProfile?>(
            future: _owner,
            builder: (context, snapshot) => _OwnerStrip(
              profile: snapshot.data,
              handle: widget.handle,
            ),
          ),
          const SizedBox(height: 28),
          if (_sent) ...[
            const Spacer(),
            Icon(Icons.check_circle_outline, size: 64, color: MyntColors.inkAt(0.8)),
            const SizedBox(height: 20),
            Text(
              'Yuborildi.',
              textAlign: TextAlign.center,
              style: MyntTypography.display(size: 28, letterSpacing: -0.03),
            ),
            const SizedBox(height: 10),
            Text(
              'Kontaktingiz faqat shu profil egasiga bordi.',
              textAlign: TextAlign.center,
              style: MyntTypography.body(
                size: 14,
                height: 1.55,
                color: MyntColors.inkAt(0.55),
              ),
            ),
            const Spacer(),
            OutlineButton(
              label: 'Profilga qaytish',
              onPressed: () => context.pop(),
            ),
          ] else ...[
            Text(
              "O'zingiznikini\nqoldirasizmi?",
              style: MyntTypography.display(
                size: 28,
                height: 1.14,
                letterSpacing: -0.03,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Siz bilan bogʻlana olishi uchun. Maʼlumot faqat unga boradi.',
              style: MyntTypography.body(
                size: 14,
                height: 1.55,
                color: MyntColors.inkAt(0.55),
              ),
            ),
            const SizedBox(height: 26),
            MyntTextField(
              controller: _name,
              hint: 'Ismingiz',
              textCapitalization: TextCapitalization.words,
            ),
            const SizedBox(height: 12),
            MyntTextField(
              controller: _phone,
              hint: 'Telefon raqam',
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 12),
            MyntTextField(controller: _company, hint: 'Kompaniya (ixtiyoriy)'),
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: MyntColors.lime.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(MyntRadii.control),
              ),
              child: Row(
                children: [
                  const Icon(Icons.lock_outline, size: 18, color: MyntColors.black),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Raqamingiz uchinchi shaxsga berilmaydi va reklama '
                      'uchun ishlatilmaydi.',
                      style: MyntTypography.body(
                        size: 12,
                        height: 1.45,
                        color: MyntColors.inkAt(0.65),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 14),
              Text(
                _error!,
                style: MyntTypography.body(
                  size: 13,
                  color: const Color(0xFFB91C1C),
                ),
              ),
            ],
            const Spacer(),
            LimeButton(
              label: 'Yuborish',
              busy: _busy,
              onPressed: _busy ? null : _submit,
            ),
            const SizedBox(height: 8),
            GhostButton(label: 'Kerak emas', onPressed: () => context.pop()),
          ],
        ],
      ),
    );
  }
}

class _OwnerStrip extends StatelessWidget {
  const _OwnerStrip({required this.profile, required this.handle});

  final HandleProfile? profile;
  final String handle;

  @override
  Widget build(BuildContext context) {
    return MyntDarkCard(
      radius: 20,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      child: Row(
        children: [
          InitialsAvatar(
            initials: profile?.initials ?? handle.substring(0, 2),
            size: 42,
            imageUrl: profile?.avatarUrl,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  profile?.ownerName ?? handle,
                  style: MyntTypography.display(size: 15, color: MyntColors.white),
                ),
                const SizedBox(height: 2),
                Text(
                  'Kontakti telefoningizga saqlandi',
                  style: MyntTypography.body(
                    size: 12,
                    color: Colors.white.withValues(alpha: 0.5),
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.check_rounded, size: 20, color: MyntColors.lime),
        ],
      ),
    );
  }
}
