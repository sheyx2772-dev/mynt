import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/analytics.dart';

class AnalyticsRepository {
  AnalyticsRepository(this._db);

  final SupabaseClient _db;

  /// Bucketing happens here rather than in Postgres because the prototype
  /// has no aggregate RPC yet. That is fine at prototype volumes and wrong
  /// at real ones — once a handle sees thousands of events a day this
  /// should become a database view or an RPC, not a bigger `limit`.
  static const _rowCap = 5000;

  Future<AnalyticsSummary> forHandle(
    String handle, {
    Duration window = const Duration(days: 7),
  }) async {
    final now = DateTime.now().toUtc();
    final windowStart = now.subtract(window);
    final previousStart = windowStart.subtract(window);

    final rows = await _db
        .from('profile_events')
        .select('kind, link_label, region, created_at')
        .eq('handle', handle)
        .gte('created_at', previousStart.toIso8601String())
        .order('created_at', ascending: false)
        .limit(_rowCap);

    var views = 0;
    var taps = 0;
    var previousViews = 0;
    final linkClicks = <String, int>{};
    final regions = <String, int>{};
    final dailyBuckets = <DateTime, int>{};

    for (final row in rows) {
      final at = DateTime.parse(row['created_at'] as String).toUtc();
      final kind = row['kind'] as String;
      final inCurrentWindow = at.isAfter(windowStart);

      if (kind == 'view') {
        if (inCurrentWindow) {
          views++;
          final day = DateTime.utc(at.year, at.month, at.day);
          dailyBuckets[day] = (dailyBuckets[day] ?? 0) + 1;
        } else {
          previousViews++;
        }
      } else if (kind == 'tap' && inCurrentWindow) {
        taps++;
      } else if (kind == 'link_click' && inCurrentWindow) {
        final label = row['link_label'] as String?;
        if (label != null && label.isNotEmpty) {
          linkClicks[label] = (linkClicks[label] ?? 0) + 1;
        }
      }

      final region = row['region'] as String?;
      if (inCurrentWindow && region != null && region.isNotEmpty) {
        regions[region] = (regions[region] ?? 0) + 1;
      }
    }

    // Every day in the window gets a bar, including the quiet ones — a
    // chart that silently drops empty days misreads as unbroken activity.
    final today = DateTime.utc(now.year, now.month, now.day);
    final days = window.inDays == 0 ? 1 : window.inDays;
    final daily = <DailyCount>[
      for (var i = days - 1; i >= 0; i--)
        () {
          final day = today.subtract(Duration(days: i));
          return DailyCount(day, dailyBuckets[day] ?? 0);
        }(),
    ];

    return AnalyticsSummary(
      views: views,
      taps: taps,
      leads: 0,
      daily: daily,
      linkClicks: _ranked(linkClicks),
      regions: _ranked(regions),
      previousViews: previousViews,
    );
  }

  /// Recorded by whoever is looking at the profile, not by its owner.
  Future<void> record({
    required String handle,
    required String kind,
    String? linkLabel,
    String? region,
  }) async {
    await _db.from('profile_events').insert({
      'handle': handle,
      'kind': kind,
      if (linkLabel != null) 'link_label': linkLabel,
      if (region != null) 'region': region,
    });
  }

  List<LabelledCount> _ranked(Map<String, int> counts) {
    final entries = counts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    return [for (final e in entries) LabelledCount(e.key, e.value)];
  }
}
