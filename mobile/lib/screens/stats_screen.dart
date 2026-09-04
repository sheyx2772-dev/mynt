import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../brand/palette.dart';
import '../core/models/stats.dart';
import '../state/providers.dart';
import '../widgets/states.dart';
import '../widgets/stats_chart.dart';

/// What a number did.
///
/// The number that matters most is the source breakdown. A tap on a card
/// arrives as a direct navigation with no referrer, indistinguishable from
/// somebody typing the address — so without it an owner can see that their
/// profile was visited and never learn whether the card they paid for is the
/// thing bringing people.
class StatsScreen extends ConsumerWidget {
  const StatsScreen({super.key, required this.number});

  final String number;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(statsProvider(number));
    final days = ref.watch(statsDaysProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Statistika'),
        backgroundColor: Brand.white,
        surfaceTintColor: Brand.white,
      ),
      body: stats.when(
        loading: () => const Waiting(),
        error: (error, _) => Failed(
          error: error,
          onRetry: () => ref.invalidate(statsProvider(number)),
        ),
        data: (data) => ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
          children: [
            _Window(
              days: days,
              onChanged: (value) => ref.read(statsDaysProvider.notifier).set(value),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(child: _Total(label: 'Ko\'rishlar', value: data.totalViews)),
                const SizedBox(width: 12),
                Expanded(child: _Total(label: 'Bosishlar', value: data.totalClicks)),
              ],
            ),
            const SizedBox(height: 28),
            StatsChart(days: data.days),
            const SizedBox(height: 32),
            _Breakdown(
              title: 'Qayerdan kelgan',
              rows: data.sources,
              // The stored values are short codes; this is where they become
              // something a person reads.
              rename: _sourceName,
            ),
            const SizedBox(height: 28),
            _Breakdown(title: 'Havolalar', rows: data.links),
          ],
        ),
      ),
    );
  }

  static String _sourceName(String source) => switch (source) {
        'nfc' => 'Karta tegizilgan',
        'qr' => 'QR kod',
        'share' => 'Ulashilgan havola',
        // Everything we did not issue a link for: somebody typing the address,
        // or a browser that sent no referrer.
        'togridan' => 'To\'g\'ridan-to\'g\'ri',
        _ => source,
      };
}

class _Window extends StatelessWidget {
  const _Window({required this.days, required this.onChanged});

  final int days;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return SegmentedButton<int>(
      segments: const [
        ButtonSegment(value: 7, label: Text('7 kun')),
        ButtonSegment(value: 30, label: Text('30 kun')),
        ButtonSegment(value: 90, label: Text('90 kun')),
      ],
      selected: {days},
      showSelectedIcon: false,
      onSelectionChanged: (selected) => onChanged(selected.first),
      style: SegmentedButton.styleFrom(
        selectedBackgroundColor: Brand.lime,
        selectedForegroundColor: Brand.black,
        side: BorderSide(color: Brand.black.withValues(alpha: 0.12)),
      ),
    );
  }
}

class _Total extends StatelessWidget {
  const _Total({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      decoration: BoxDecoration(
        color: Brand.black.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$value',
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              color: Brand.black,
              // Digits of the same width, so a number changing does not shift
              // the label under it.
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 2),
          Text(label,
              style: TextStyle(fontSize: 13, color: Brand.black.withValues(alpha: 0.55))),
        ],
      ),
    );
  }
}

class _Breakdown extends StatelessWidget {
  const _Breakdown({required this.title, required this.rows, this.rename});

  final String title;
  final List<LabelledCount> rows;
  final String Function(String)? rename;

  @override
  Widget build(BuildContext context) {
    if (rows.isEmpty) return const SizedBox.shrink();

    final top = rows.fold(1, (best, r) => r.count > best ? r.count : best);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: TextStyle(
                fontSize: 12,
                letterSpacing: 1.5,
                fontWeight: FontWeight.w700,
                color: Brand.black.withValues(alpha: 0.35))),
        const SizedBox(height: 14),
        for (final row in rows) ...[
          Row(
            children: [
              Expanded(
                child: Text(rename?.call(row.label) ?? row.label,
                    style: const TextStyle(fontSize: 14, color: Brand.black)),
              ),
              Text('${row.count}',
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Brand.black.withValues(alpha: 0.6))),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: row.count / top,
              minHeight: 6,
              backgroundColor: Brand.black.withValues(alpha: 0.06),
              valueColor: const AlwaysStoppedAnimation(Brand.lime),
            ),
          ),
          const SizedBox(height: 14),
        ],
      ],
    );
  }
}
