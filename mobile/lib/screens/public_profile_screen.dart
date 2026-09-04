import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../app.dart';
import '../models/handle_profile.dart';
import '../theme/mynt_theme.dart';
import '../widgets/mynt_background.dart';
import '../widgets/mynt_buttons.dart';
import '../widgets/mynt_cards.dart';
import '../widgets/mynt_fields.dart';
import '../widgets/mynt_marks.dart';

/// What a tapped card resolves to. Read by strangers, so it asks for no
/// session and writes only an anonymous view event.
class PublicProfileScreen extends StatefulWidget {
  const PublicProfileScreen({super.key, required this.handle});

  final String handle;

  @override
  State<PublicProfileScreen> createState() => _PublicProfileScreenState();
}

class _PublicProfileScreenState extends State<PublicProfileScreen> {
  Future<HandleProfile?>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_future != null) return;
    final services = MyntServices.of(context);
    _future = services.handles.fetch(widget.handle);
    // Fire-and-forget: a failed analytics write must never break the page
    // a stranger is looking at.
    services.analytics
        .record(handle: widget.handle, kind: 'view')
        .catchError((_) {});
  }

  void _recordClick(String label) {
    MyntServices.of(context)
        .analytics
        .record(handle: widget.handle, kind: 'link_click', linkLabel: label)
        .catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    return MyntScaffold(
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
      child: FutureBuilder<HandleProfile?>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(
                color: MyntColors.black,
                strokeWidth: 2.4,
              ),
            );
          }
          final profile = snapshot.data;
          if (profile == null || !profile.isClaimed) {
            return _UnclaimedNotice(handle: widget.handle);
          }
          return _Profile(profile: profile, onLinkTap: _recordClick);
        },
      ),
    );
  }
}

class _Profile extends StatelessWidget {
  const _Profile({required this.profile, required this.onLinkTap});

  final HandleProfile profile;
  final ValueChanged<String> onLinkTap;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Align(alignment: Alignment.centerLeft, child: MyntWordmark(size: 24)),
          const SizedBox(height: 40),
          MyntDarkCard(
            padding: const EdgeInsets.all(32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                InitialsAvatar(
                  initials: profile.initials,
                  imageUrl: profile.avatarUrl,
                ),
                const SizedBox(height: 20),
                Text(
                  profile.ownerName ?? profile.normalized,
                  style: MyntTypography.display(size: 24, color: MyntColors.white),
                ),
                const SizedBox(height: 4),
                Text(
                  'mynt.uz/${profile.normalized}',
                  style: MyntTypography.tabular(
                    size: 13,
                    weight: FontWeight.w400,
                    color: Colors.white.withValues(alpha: 0.5),
                  ),
                ),
                if ((profile.bio ?? '').isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text(
                    profile.bio!,
                    style: MyntTypography.body(
                      size: 14,
                      height: 1.55,
                      color: Colors.white.withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 24),
          LimeButton(
            label: 'Kontaktni saqlash',
            onPressed: () => context.push('/exchange/${profile.normalized}'),
          ),
          const SizedBox(height: 24),
          for (final link in profile.links) ...[
            _LinkRow(link: link, onTap: () => onLinkTap(link.label)),
            const SizedBox(height: 12),
          ],
          const SizedBox(height: 16),
          Center(
            child: Text(
              'mynt bilan yaratilgan',
              style: MyntTypography.body(size: 11, color: MyntColors.inkAt(0.35)),
            ),
          ),
        ],
      ),
    );
  }
}

class _LinkRow extends StatelessWidget {
  const _LinkRow({required this.link, required this.onTap});

  final ProfileLink link;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(MyntRadii.control),
      child: Container(
        height: 52,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: MyntColors.white,
          borderRadius: BorderRadius.circular(MyntRadii.control),
          border: Border.all(color: MyntColors.hairline),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                link.label,
                style: MyntTypography.body(size: 14, weight: FontWeight.w500),
              ),
            ),
            Icon(Icons.chevron_right, size: 18, color: MyntColors.inkAt(0.3)),
          ],
        ),
      ),
    );
  }
}

class _UnclaimedNotice extends StatelessWidget {
  const _UnclaimedNotice({required this.handle});

  final String handle;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            handle,
            style: MyntTypography.tabular(
              size: 34,
              weight: FontWeight.w600,
              displayFace: true,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Bu handle hali band qilinmagan.',
            style: MyntTypography.body(size: 14, color: MyntColors.inkAt(0.55)),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: 220,
            child: LimeButton(
              label: 'Band qilish',
              onPressed: () => context.push('/handle/$handle'),
            ),
          ),
        ],
      ),
    );
  }
}
