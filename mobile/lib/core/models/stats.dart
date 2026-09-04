/// What a number did, as aggregates. Nothing here identifies a visitor,
/// because nothing that identifies one is stored.
class Stats {
  const Stats({
    required this.days,
    required this.links,
    required this.sources,
    required this.totalViews,
    required this.totalClicks,
  });

  final List<DayStat> days;
  final List<LabelledCount> links;

  /// Where visits arrived from. `togridan` is everything we did not issue a
  /// link for — somebody typing the address, or a browser that sent no
  /// referrer — and it is the number that tells an owner whether the card
  /// itself is what is bringing people.
  final List<LabelledCount> sources;

  final int totalViews;
  final int totalClicks;

  /// The tallest bar, which the chart scales to. One rather than zero, so an
  /// empty history divides safely.
  int get peak => days.fold(1, (top, d) => d.views > top ? d.views : top);

  factory Stats.fromJson(Map<String, dynamic> json) => Stats(
        days: _list(json['kunlar']).map(DayStat.fromJson).toList(),
        links: _list(json['havolalar'])
            .map((l) => LabelledCount(
                  label: l['havola'] as String? ?? '',
                  count: (l['bosishlar'] as num?)?.toInt() ?? 0,
                ))
            .toList(),
        sources: _list(json['manbalar'])
            .map((s) => LabelledCount(
                  label: s['manba'] as String? ?? '',
                  count: (s['korishlar'] as num?)?.toInt() ?? 0,
                ))
            .toList(),
        totalViews: (json['jami_korishlar'] as num?)?.toInt() ?? 0,
        totalClicks: (json['jami_bosishlar'] as num?)?.toInt() ?? 0,
      );
}

class DayStat {
  const DayStat({required this.day, required this.views, required this.clicks});

  final String day;
  final int views;
  final int clicks;

  factory DayStat.fromJson(Map<String, dynamic> json) => DayStat(
        day: json['kun'] as String? ?? '',
        views: (json['korishlar'] as num?)?.toInt() ?? 0,
        clicks: (json['bosishlar'] as num?)?.toInt() ?? 0,
      );
}

class LabelledCount {
  const LabelledCount({required this.label, required this.count});

  final String label;
  final int count;
}

List<Map<String, dynamic>> _list(Object? raw) =>
    (raw as List? ?? const []).whereType<Map<String, dynamic>>().toList();
