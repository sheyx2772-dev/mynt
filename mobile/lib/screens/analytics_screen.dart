import 'package:flutter/material.dart';

import '../app.dart';
import '../models/analytics.dart';
import '../models/handle_profile.dart';
import '../theme/mynt_theme.dart';
import '../widgets/app_tab_bar.dart';
import '../widgets/mynt_background.dart';
import '../widgets/mynt_marks.dart';
import 'leads_screen.dart' show navigateToTab;

/// One measure per chart, one hue per chart. Nothing here is categorical,
/// so nothing here is multi-coloured — the bars carry magnitude, the text
/// carries identity.
class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  static const _windows = [(7, '7 kun'), (30, '30 kun')];

  int _days = 7;
  Future<(HandleProfile?, AnalyticsSummary)>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<(HandleProfile?, AnalyticsSummary)> _load() async {
    final services = MyntServices.of(context);
    final mine = await services.handles.mine();
    if (mine == null) return (null, AnalyticsSummary.empty);
    final summary = await services.analytics.forHandle(
      mine.normalized,
      window: Duration(days: _days),
    );
    return (mine, summary);
  }

  @override
  Widget build(BuildContext context) {
    return MyntScaffold(
      showGrid: false,
      glows: const [Alignment(1.3, -1.2)],
      bottomBar: AppTabBar(
        current: AppTab.analytics,
        onSelect: (tab) => navigateToTab(context, tab),
      ),
      child: FutureBuilder<(HandleProfile?, AnalyticsSummary)>(
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
          final (mine, summary) =
              snapshot.data ?? (null, AnalyticsSummary.empty);
          if (mine == null) {
            return Center(
              child: Text(
                'Avval handle band qiling.',
                style: MyntTypography.body(
                  size: 14,
                  color: MyntColors.inkAt(0.6),
                ),
              ),
            );
          }

          return ListView(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Analitika',
                    style: MyntTypography.display(size: 26, letterSpacing: -0.03),
                  ),
                  Row(
                    children: [
                      for (final (days, label) in _windows) ...[
                        _WindowChip(
                          label: label,
                          active: _days == days,
                          onTap: () => setState(() {
                            _days = days;
                            _future = _load();
                          }),
                        ),
                        if (days != _windows.last.$1) const SizedBox(width: 6),
                      ],
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text(
                'Profil tashriflari',
                style: MyntTypography.body(
                  size: 12,
                  weight: FontWeight.w500,
                  color: MyntColors.inkAt(0.45),
                ),
              ),
              const SizedBox(height: 6),
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    summary.views.toString(),
                    style: MyntTypography.tabular(
                      size: 46,
                      weight: FontWeight.w600,
                      displayFace: true,
                      letterSpacing: -0.035,
                    ),
                  ),
                  const SizedBox(width: 10),
                  if (summary.viewsDelta != null) _Delta(value: summary.viewsDelta!),
                ],
              ),
              const SizedBox(height: 26),
              _DailyChart(daily: summary.daily),
              const SizedBox(height: 30),
              const Eyebrow('Havolalar bosilishi'),
              const SizedBox(height: 14),
              if (summary.linkClicks.isEmpty)
                Text(
                  'Hali hech kim havolani bosmagan.',
                  style: MyntTypography.body(
                    size: 13,
                    color: MyntColors.inkAt(0.45),
                  ),
                )
              else
                _RankedBars(items: summary.linkClicks),
              const SizedBox(height: 24),
              if (summary.regions.isNotEmpty) _Regions(regions: summary.regions),
              const SizedBox(height: 12),
            ],
          );
        },
      ),
    );
  }
}

class _WindowChip extends StatelessWidget {
  const _WindowChip({
    required this.label,
    required this.active,
    required this.onTap,
  });

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(MyntRadii.pill),
      child: Container(
        height: 34,
        padding: const EdgeInsets.symmetric(horizontal: 13),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active ? MyntColors.black : MyntColors.white,
          borderRadius: BorderRadius.circular(MyntRadii.pill),
          border: Border.all(
            color: active ? MyntColors.black : MyntColors.hairline,
          ),
        ),
        child: Text(
          label,
          style: MyntTypography.tabular(
            size: 12,
            color: active ? MyntColors.white : MyntColors.inkAt(0.6),
          ),
        ),
      ),
    );
  }
}

class _Delta extends StatelessWidget {
  const _Delta({required this.value});

  final double value;

  @override
  Widget build(BuildContext context) {
    final up = value >= 0;
    final color = up ? MyntColors.positive : const Color(0xFFB91C1C);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(up ? Icons.arrow_upward : Icons.arrow_downward, size: 13, color: color),
        const SizedBox(width: 4),
        Text(
          '${(value.abs() * 100).round()}%',
          style: MyntTypography.tabular(size: 13, color: color),
        ),
      ],
    );
  }
}

/// Columns for every day in the window, empty days included — dropping a
/// quiet day would misread as unbroken activity. Only the peak is labelled.
class _DailyChart extends StatelessWidget {
  const _DailyChart({required this.daily});

  final List<DailyCount> daily;

  static const _weekdays = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

  @override
  Widget build(BuildContext context) {
    if (daily.isEmpty) return const SizedBox.shrink();
    final peak = daily.map((d) => d.count).reduce((a, b) => a > b ? a : b);
    final today = DateTime.now();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 110,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              for (final entry in daily) ...[
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if (entry.count == peak && peak > 0) ...[
                        Text(
                          entry.count.toString(),
                          style: MyntTypography.tabular(
                            size: 12,
                            weight: FontWeight.w600,
                            displayFace: true,
                          ),
                        ),
                        const SizedBox(height: 5),
                      ],
                      Container(
                        height: peak == 0 ? 2 : 90 * entry.count / peak + 2,
                        decoration: const BoxDecoration(
                          color: MyntColors.black,
                          borderRadius: BorderRadius.vertical(
                            top: Radius.circular(4),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                if (entry != daily.last) const SizedBox(width: 9),
              ],
            ],
          ),
        ),
        const SizedBox(height: 9),
        Row(
          children: [
            for (final entry in daily) ...[
              Expanded(
                child: Text(
                  _label(entry.day, today),
                  textAlign: TextAlign.center,
                  style: MyntTypography.tabular(
                    size: 11,
                    weight: _isToday(entry.day, today)
                        ? FontWeight.w600
                        : FontWeight.w400,
                    color: _isToday(entry.day, today)
                        ? MyntColors.black
                        : MyntColors.inkAt(0.4),
                  ),
                ),
              ),
              if (entry != daily.last) const SizedBox(width: 9),
            ],
          ],
        ),
      ],
    );
  }

  bool _isToday(DateTime day, DateTime today) =>
      day.year == today.year && day.month == today.month && day.day == today.day;

  String _label(DateTime day, DateTime today) {
    if (_isToday(day, today)) return 'Bugun';
    // A 30-day window has no room for weekday names on every column.
    if (daily.length > 10) return day.day.toString();
    return _weekdays[day.weekday - 1];
  }
}

/// Ranked magnitude: one measure, one colour, value labelled on every row
/// because there are only a handful of them.
class _RankedBars extends StatelessWidget {
  const _RankedBars({required this.items});

  final List<LabelledCount> items;

  @override
  Widget build(BuildContext context) {
    final peak = items.first.count;
    return Column(
      children: [
        for (final item in items) ...[
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      item.label,
                      style: MyntTypography.body(
                        size: 13,
                        weight: FontWeight.w500,
                      ),
                    ),
                  ),
                  Text(
                    item.count.toString(),
                    style: MyntTypography.tabular(
                      size: 14,
                      weight: FontWeight.w600,
                      displayFace: true,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 7),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: peak == 0 ? 0 : item.count / peak,
                  minHeight: 8,
                  backgroundColor: MyntColors.inkAt(0.06),
                  valueColor: const AlwaysStoppedAnimation(MyntColors.black),
                ),
              ),
            ],
          ),
          if (item != items.last) const SizedBox(height: 14),
        ],
      ],
    );
  }
}

class _Regions extends StatelessWidget {
  const _Regions({required this.regions});

  final List<LabelledCount> regions;

  @override
  Widget build(BuildContext context) {
    final total = regions.fold<int>(0, (sum, r) => sum + r.count);
    final top = regions.take(2).map((r) {
      final share = total == 0 ? 0 : (r.count * 100 / total).round();
      return '${r.label} $share%';
    }).join(' · ');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
      decoration: BoxDecoration(
        color: MyntColors.inkAt(0.03),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Text(
            'Hududlar',
            style: MyntTypography.body(size: 13, color: MyntColors.inkAt(0.6)),
          ),
          const Spacer(),
          Text(top, style: MyntTypography.tabular(size: 13)),
        ],
      ),
    );
  }
}
