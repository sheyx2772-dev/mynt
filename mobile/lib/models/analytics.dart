/// One bar in the seven-day column chart.
class DailyCount {
  const DailyCount(this.day, this.count);
  final DateTime day;
  final int count;
}

class LabelledCount {
  const LabelledCount(this.label, this.count);
  final String label;
  final int count;
}

class AnalyticsSummary {
  const AnalyticsSummary({
    required this.views,
    required this.taps,
    required this.leads,
    required this.daily,
    required this.linkClicks,
    required this.regions,
    required this.previousViews,
  });

  static const empty = AnalyticsSummary(
    views: 0,
    taps: 0,
    leads: 0,
    daily: [],
    linkClicks: [],
    regions: [],
    previousViews: 0,
  );

  final int views;
  final int taps;
  final int leads;
  final List<DailyCount> daily;
  final List<LabelledCount> linkClicks;
  final List<LabelledCount> regions;

  /// Views over the preceding window of equal length, for the delta chip.
  final int previousViews;

  /// Null when there is no prior window to compare against — the UI hides
  /// the delta rather than showing a meaningless +100%.
  double? get viewsDelta {
    if (previousViews == 0) return null;
    return (views - previousViews) / previousViews;
  }

  int get peakDaily =>
      daily.isEmpty ? 0 : daily.map((d) => d.count).reduce((a, b) => a > b ? a : b);
}
