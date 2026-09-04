import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../app.dart';
import '../core/formatting.dart';
import '../models/handle_profile.dart';
import '../models/lead.dart';
import '../theme/mynt_theme.dart';
import '../widgets/app_tab_bar.dart';
import '../widgets/mynt_background.dart';
import '../widgets/mynt_fields.dart';
import '../widgets/mynt_marks.dart';

/// The owner's inbox. Rows come back only because the caller owns the
/// handle — the query does not filter by user, the RLS policy does.
class LeadsScreen extends StatefulWidget {
  const LeadsScreen({super.key});

  @override
  State<LeadsScreen> createState() => _LeadsScreenState();
}

class _LeadsScreenState extends State<LeadsScreen> {
  Future<(HandleProfile?, List<Lead>)>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<(HandleProfile?, List<Lead>)> _load() async {
    final services = MyntServices.of(context);
    final mine = await services.handles.mine();
    if (mine == null) return (null, <Lead>[]);
    final leads = await services.leads.forHandle(mine.normalized);
    return (mine, leads);
  }

  @override
  Widget build(BuildContext context) {
    return MyntScaffold(
      showGrid: false,
      glows: const [Alignment(-1.3, -1.2)],
      bottomBar: AppTabBar(
        current: AppTab.leads,
        onSelect: (tab) => navigateToTab(context, tab),
      ),
      child: FutureBuilder<(HandleProfile?, List<Lead>)>(
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
          final (mine, leads) = snapshot.data ?? (null, <Lead>[]);
          if (mine == null) return const _NoHandle();

          return RefreshIndicator(
            color: MyntColors.black,
            onRefresh: () async => setState(() => _future = _load()),
            child: ListView(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const MyntWordmark(),
                    InitialsAvatar(
                      initials: mine.initials,
                      size: 44,
                      background: MyntColors.black,
                      foreground: MyntColors.lime,
                      imageUrl: mine.avatarUrl,
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Text(
                  'Leadlar',
                  style: MyntTypography.display(size: 30, letterSpacing: -0.03),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: _StatTile(
                        value: leads.length.toString(),
                        label: 'jami kontakt',
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _StatTile(
                        value: _thisWeek(leads).toString(),
                        label: 'shu hafta',
                        highlight: true,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 22),
                if (leads.isEmpty)
                  const _EmptyLeads()
                else
                  for (final lead in leads) ...[
                    _LeadRow(lead: lead),
                    const SizedBox(height: 8),
                  ],
                const SizedBox(height: 12),
              ],
            ),
          );
        },
      ),
    );
  }

  int _thisWeek(List<Lead> leads) {
    final since = DateTime.now().subtract(const Duration(days: 7));
    return leads.where((l) => l.createdAt.isAfter(since)).length;
  }
}

void navigateToTab(BuildContext context, AppTab tab) {
  switch (tab) {
    case AppTab.profile:
      context.go('/app/profile');
    case AppTab.leads:
      context.go('/app/leads');
    case AppTab.analytics:
      context.go('/app/analytics');
    case AppTab.settings:
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: MyntColors.black,
          behavior: SnackBarBehavior.floating,
          content: Text(
            'Sozlamalar hali yozilmagan.',
            style: MyntTypography.body(size: 13, color: MyntColors.white),
          ),
        ),
      );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.value,
    required this.label,
    this.highlight = false,
  });

  final String value;
  final String label;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: highlight
            ? MyntColors.lime.withValues(alpha: 0.14)
            : MyntColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: MyntColors.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: MyntTypography.tabular(
              size: 26,
              weight: FontWeight.w600,
              displayFace: true,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: MyntTypography.body(size: 12, color: MyntColors.inkAt(0.45)),
          ),
        ],
      ),
    );
  }
}

class _LeadRow extends StatelessWidget {
  const _LeadRow({required this.lead});

  final Lead lead;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 68,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: MyntColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: MyntColors.hairline),
      ),
      child: Row(
        children: [
          InitialsAvatar(
            initials: lead.initials,
            size: 40,
            background: MyntColors.inkAt(0.06),
            foreground: MyntColors.black,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  lead.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: MyntTypography.body(size: 14, weight: FontWeight.w500),
                ),
                if (lead.subtitle.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    lead.subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: MyntTypography.body(
                      size: 12,
                      color: MyntColors.inkAt(0.45),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                formatLeadTime(lead.createdAt),
                style: MyntTypography.tabular(
                  size: 12,
                  weight: FontWeight.w400,
                  color: MyntColors.inkAt(0.4),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                lead.source.label,
                style: MyntTypography.body(
                  size: 10,
                  weight: FontWeight.w600,
                  color: MyntColors.inkAt(0.35),
                ).copyWith(letterSpacing: 0.6),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EmptyLeads extends StatelessWidget {
  const _EmptyLeads();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 36),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: MyntColors.hairline),
      ),
      child: Column(
        children: [
          Text(
            'Hali lead yoʻq.',
            style: MyntTypography.display(size: 18),
          ),
          const SizedBox(height: 8),
          Text(
            'Kimdir kartangizni tegizib, oʻz kontaktini qoldirsa, '
            'shu yerda paydo boʻladi.',
            textAlign: TextAlign.center,
            style: MyntTypography.body(
              size: 13,
              height: 1.55,
              color: MyntColors.inkAt(0.5),
            ),
          ),
        ],
      ),
    );
  }
}

class _NoHandle extends StatelessWidget {
  const _NoHandle();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        'Avval handle band qiling.',
        style: MyntTypography.body(size: 14, color: MyntColors.inkAt(0.6)),
      ),
    );
  }
}
