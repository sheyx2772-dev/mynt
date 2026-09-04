import 'package:flutter/material.dart';

import '../brand/palette.dart';
import '../core/models/stats.dart';

/// Daily visits, as bars.
///
/// Drawn rather than charted with a library: it is a row of rectangles, and a
/// charting dependency for that is a megabyte and an API to learn. The series
/// arrives zero-filled from the backend, so a quiet day is a short bar rather
/// than a missing one — a chart that silently drops empty days reads as though
/// the quiet period never happened.
class StatsChart extends StatelessWidget {
  const StatsChart({super.key, required this.days});

  final List<DayStat> days;

  @override
  Widget build(BuildContext context) {
    if (days.isEmpty) return const SizedBox.shrink();

    final peak = days.fold(1, (top, d) => d.views > top ? d.views : top);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 120,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              for (final day in days)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 1),
                    child: Container(
                      // A day with no visits still gets two pixels, so the row
                      // reads as a series of days rather than as a gap.
                      height: day.views == 0 ? 2 : 6 + (114 * day.views / peak),
                      decoration: BoxDecoration(
                        color: day.views == 0
                            ? Brand.black.withValues(alpha: 0.08)
                            : Brand.lime,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(3)),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _Label(days.first.day),
            _Label(days.last.day),
          ],
        ),
      ],
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.day);

  final String day;

  @override
  Widget build(BuildContext context) {
    // "2026-09-04" is the API's form; a person reads the day and the month.
    final parts = day.split('-');
    final text = parts.length == 3 ? '${parts[2]}.${parts[1]}' : day;

    return Text(
      text,
      style: TextStyle(fontSize: 11, color: Brand.black.withValues(alpha: 0.4)),
    );
  }
}
