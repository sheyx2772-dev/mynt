import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../brand/palette.dart';
import '../core/config.dart';
import '../core/models/handle.dart';
import '../state/providers.dart';
import '../widgets/states.dart';

/// One number: what it looks like, and everything you can do with it.
class NumberScreen extends ConsumerWidget {
  const NumberScreen({super.key, required this.number});

  final String number;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final handle = ref.watch(numberProvider(number));

    return Scaffold(
      appBar: AppBar(
        title: Text(number),
        backgroundColor: Brand.white,
        surfaceTintColor: Brand.white,
      ),
      body: handle.when(
        loading: () => const Waiting(),
        error: (error, _) => Failed(
          error: error,
          onRetry: () => ref.invalidate(numberProvider(number)),
        ),
        data: (h) => ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            _Card(handle: h),
            const SizedBox(height: 24),
            _Action(
              icon: Icons.nfc,
              title: 'Kartaga yozish',
              detail: 'NFC tegga shu raqamning manzilini yozadi',
              onTap: () => context.push('/raqam/$number/teg'),
            ),
            _Action(
              icon: Icons.edit_outlined,
              title: 'Profilni tahrirlash',
              detail: 'Ism, bio, havolalar, shahar',
              onTap: () => context.push('/raqam/$number/tahrirlash'),
            ),
            _Action(
              icon: Icons.contact_page_outlined,
              title: 'Vizitkalar',
              detail: 'Sizga qoldirilgan kontaktlar',
              onTap: () => context.push('/raqam/$number/vizitkalar'),
            ),
            _Action(
              icon: Icons.insights_outlined,
              title: 'Statistika',
              detail: '${h.viewCount} ta ko\'rish',
              onTap: () => context.push('/raqam/$number/statistika'),
            ),
          ],
        ),
      ),
    );
  }
}

/// The card, drawn rather than fetched as an image, so it stays sharp at any
/// size and always shows this owner's own number.
class _Card extends StatelessWidget {
  const _Card({required this.handle});

  final Handle handle;

  @override
  Widget build(BuildContext context) {
    final accent = handle.isPremium ? Brand.premium : Brand.lime;

    return AspectRatio(
      // A bank card's proportions, which is what the object in a pocket is.
      aspectRatio: 1.586,
      child: Container(
        decoration: BoxDecoration(
          color: Brand.black,
          borderRadius: BorderRadius.circular(20),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 9,
                  height: 9,
                  decoration: BoxDecoration(color: accent, shape: BoxShape.circle),
                ),
                const SizedBox(width: 9),
                Text(
                  'FLEX',
                  style: TextStyle(
                    fontSize: 11,
                    letterSpacing: 3.5,
                    fontWeight: FontWeight.w700,
                    color: Brand.white.withValues(alpha: 0.75),
                  ),
                ),
                const Spacer(),
                Icon(Icons.wifi, size: 18, color: Brand.white.withValues(alpha: 0.4)),
              ],
            ),
            const Spacer(),
            Text(
              handle.number,
              style: TextStyle(
                fontSize: 34,
                fontWeight: FontWeight.w700,
                letterSpacing: 3,
                color: accent,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              handle.displayName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 14, color: Brand.white.withValues(alpha: 0.7)),
            ),
            const SizedBox(height: 2),
            Text(
              Config.profileUrl(handle.number).replaceFirst('https://', ''),
              style: TextStyle(fontSize: 11, color: Brand.white.withValues(alpha: 0.35)),
            ),
          ],
        ),
      ),
    );
  }
}

class _Action extends StatelessWidget {
  const _Action({
    required this.icon,
    required this.title,
    required this.detail,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String detail;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Brand.black.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
            child: Row(
              children: [
                Icon(icon, size: 22, color: Brand.limeInk),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: const TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w600, color: Brand.black)),
                      const SizedBox(height: 2),
                      Text(detail,
                          style: TextStyle(
                              fontSize: 13, color: Brand.black.withValues(alpha: 0.5))),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: Brand.black.withValues(alpha: 0.3)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
