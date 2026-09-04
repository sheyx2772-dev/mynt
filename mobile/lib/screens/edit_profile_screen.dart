import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../app.dart';
import '../models/handle_profile.dart';
import '../theme/mynt_theme.dart';
import '../widgets/app_tab_bar.dart';
import '../widgets/mynt_background.dart';
import '../widgets/mynt_buttons.dart';
import '../widgets/mynt_fields.dart';
import '../widgets/mynt_marks.dart';
import 'leads_screen.dart' show navigateToTab;

/// The owner editing what their handle says. The handle itself is not here —
/// it is bought once and never changes; only the profile hanging off it does.
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _name = TextEditingController();
  final _bio = TextEditingController();
  final _links = <_LinkDraft>[];

  HandleProfile? _profile;
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_loading && _profile == null) _load();
  }

  @override
  void dispose() {
    _name.dispose();
    _bio.dispose();
    for (final draft in _links) {
      draft.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    final mine = await MyntServices.of(context).handles.mine();
    if (!mounted) return;
    setState(() {
      _profile = mine;
      _loading = false;
      if (mine != null) {
        _name.text = mine.ownerName ?? '';
        _bio.text = mine.bio ?? '';
        _links
          ..clear()
          ..addAll(mine.links.map(_LinkDraft.from));
      }
    });
  }

  Future<void> _save() async {
    final profile = _profile;
    if (profile == null) return;

    if (_name.text.trim().isEmpty) {
      setState(() => _error = 'Ism kiritish shart.');
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      await MyntServices.of(context).handles.updateProfile(
            normalized: profile.normalized,
            ownerName: _name.text.trim(),
            bio: _bio.text.trim(),
            links: _links
                .map((d) => d.toLink())
                .where((l) => l.label.isNotEmpty && l.href.isNotEmpty)
                .toList(),
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: MyntColors.black,
          behavior: SnackBarBehavior.floating,
          content: Text(
            'Saqlandi.',
            style: MyntTypography.body(size: 13, color: MyntColors.white),
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = 'Saqlanmadi: $error');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MyntScaffold(
      showGrid: false,
      glows: const [Alignment(-1.3, -1.2)],
      bottomBar: AppTabBar(
        current: AppTab.profile,
        onSelect: (tab) => navigateToTab(context, tab),
      ),
      child: _loading
          ? const Center(
              child: CircularProgressIndicator(
                color: MyntColors.black,
                strokeWidth: 2.4,
              ),
            )
          : _profile == null
              ? const _NoHandle()
              : _form(_profile!),
    );
  }

  Widget _form(HandleProfile profile) {
    return ListView(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const MyntWordmark(),
            InitialsAvatar(
              initials: profile.initials,
              size: 44,
              background: MyntColors.black,
              foreground: MyntColors.lime,
              imageUrl: profile.avatarUrl,
            ),
          ],
        ),
        const SizedBox(height: 24),
        Text(
          'Profil',
          style: MyntTypography.display(size: 30, letterSpacing: -0.03),
        ),
        const SizedBox(height: 8),
        Text(
          'mynt.uz/${profile.normalized}',
          style: MyntTypography.tabular(size: 13, color: MyntColors.inkAt(0.5)),
        ),
        const SizedBox(height: 22),
        MyntTextField(
          controller: _name,
          hint: 'Ismingiz *',
          textCapitalization: TextCapitalization.words,
        ),
        const SizedBox(height: 12),
        MyntTextField(
          controller: _bio,
          hint: 'Qisqa bio',
          maxLines: 3,
        ),
        const SizedBox(height: 26),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Havolalar',
              style: MyntTypography.body(size: 14, weight: FontWeight.w600),
            ),
            GestureDetector(
              onTap: () => setState(() => _links.add(_LinkDraft.empty())),
              child: Text(
                '+ qoʻshish',
                style: MyntTypography.body(
                  size: 13,
                  weight: FontWeight.w600,
                  color: MyntColors.black,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        if (_links.isEmpty)
          Text(
            'Telegram, Instagram, sayt — profilingizda tugma boʻlib chiqadi.',
            style: MyntTypography.body(
              size: 12,
              height: 1.5,
              color: MyntColors.inkAt(0.45),
            ),
          )
        else
          for (var i = 0; i < _links.length; i++) ...[
            _LinkRow(
              draft: _links[i],
              onRemove: () => setState(() => _links.removeAt(i).dispose()),
            ),
            const SizedBox(height: 10),
          ],
        if (_error != null) ...[
          const SizedBox(height: 14),
          Text(
            _error!,
            style: MyntTypography.body(size: 13, color: const Color(0xFFB91C1C)),
          ),
        ],
        const SizedBox(height: 26),
        LimeButton(
          label: 'Saqlash',
          busy: _saving,
          onPressed: _saving ? null : _save,
        ),
        const SizedBox(height: 10),
        OutlineButton(
          label: 'Sahifamni koʻrish',
          onPressed: () => context.push('/p/${profile.normalized}'),
        ),
        const SizedBox(height: 10),
        OutlineButton(
          label: 'QR kod',
          onPressed: () => context.push('/qr/${profile.normalized}'),
        ),
        const SizedBox(height: 14),
        GhostButton(
          label: 'Chiqish',
          onPressed: () async {
            final auth = MyntServices.of(context).auth;
            final router = GoRouter.of(context);
            await auth.signOut();
            if (mounted) router.go('/');
          },
        ),
        const SizedBox(height: 12),
      ],
    );
  }
}

/// One editable link. Kept as a pair of controllers so a half-typed row
/// survives rebuilds; empty rows are dropped at save time, not while typing.
class _LinkDraft {
  _LinkDraft({required String label, required String href})
      : label = TextEditingController(text: label),
        href = TextEditingController(text: href);

  factory _LinkDraft.from(ProfileLink link) =>
      _LinkDraft(label: link.label, href: link.href);

  factory _LinkDraft.empty() => _LinkDraft(label: '', href: '');

  final TextEditingController label;
  final TextEditingController href;

  ProfileLink toLink() => ProfileLink(
        label: label.text.trim(),
        href: href.text.trim(),
      );

  void dispose() {
    label.dispose();
    href.dispose();
  }
}

class _LinkRow extends StatelessWidget {
  const _LinkRow({required this.draft, required this.onRemove});

  final _LinkDraft draft;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: MyntTextField(controller: draft.label, hint: 'Nomi'),
        ),
        const SizedBox(width: 8),
        Expanded(
          flex: 3,
          child: MyntTextField(
            controller: draft.href,
            hint: 'https://',
            keyboardType: TextInputType.url,
          ),
        ),
        IconButton(
          onPressed: onRemove,
          icon: Icon(
            Icons.close_rounded,
            size: 18,
            color: MyntColors.inkAt(0.4),
          ),
          tooltip: 'Oʻchirish',
        ),
      ],
    );
  }
}

class _NoHandle extends StatelessWidget {
  const _NoHandle();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Hali handle yoʻq.',
            style: MyntTypography.display(size: 20),
          ),
          const SizedBox(height: 8),
          Text(
            'Avval oʻzingizga handle band qiling.',
            textAlign: TextAlign.center,
            style: MyntTypography.body(
              size: 13,
              height: 1.55,
              color: MyntColors.inkAt(0.5),
            ),
          ),
          const SizedBox(height: 18),
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
