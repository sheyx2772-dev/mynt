import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../brand/palette.dart';
import '../state/providers.dart';
import '../state/session_controller.dart';
import '../widgets/states.dart';

/// What this account owns. The screen the app opens on.
class NumbersScreen extends ConsumerWidget {
  const NumbersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final numbers = ref.watch(myNumbersProvider);
    final email = ref.watch(sessionProvider).value;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Raqamlarim'),
        backgroundColor: Brand.white,
        surfaceTintColor: Brand.white,
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            onSelected: (value) {
              if (value == 'chiqish') ref.read(sessionProvider.notifier).signOut();
            },
            itemBuilder: (context) => [
              if (email != null)
                PopupMenuItem(enabled: false, child: Text(email)),
              const PopupMenuItem(value: 'chiqish', child: Text('Chiqish')),
            ],
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/olish'),
        backgroundColor: Brand.lime,
        foregroundColor: Brand.black,
        icon: const Icon(Icons.add),
        label: const Text('Raqam olish'),
      ),
      body: RefreshIndicator(
        color: Brand.limeInk,
        onRefresh: () async => ref.invalidate(myNumbersProvider),
        child: numbers.when(
          loading: () => const Waiting(),
          error: (error, _) => Failed(
            error: error,
            onRetry: () => ref.invalidate(myNumbersProvider),
          ),
          data: (list) => list.isEmpty
              ? const _NothingYet()
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                  itemCount: list.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, i) => _NumberTile(
                    number: list[i].number,
                    name: list[i].displayName,
                    views: list[i].viewCount,
                    premium: list[i].isPremium,
                    onTap: () => context.push('/raqam/${list[i].number}'),
                  ),
                ),
        ),
      ),
    );
  }
}

/// An empty cabinet is not an error — it is somebody who has not bought a
/// number yet, and the screen says what to do about it.
class _NothingYet extends StatelessWidget {
  const _NothingYet();

  @override
  Widget build(BuildContext context) {
    // A ListView so the pull-to-refresh above still works with nothing in it.
    return ListView(
      children: const [
        SizedBox(height: 80),
        Empty(
          title: 'Hali raqamingiz yo\'q',
          detail: 'Uch harf va uch raqam tanlang — masalan MYN042. '
              'Pastdagi tugmadan boshlang.',
        ),
      ],
    );
  }
}

class _NumberTile extends StatelessWidget {
  const _NumberTile({
    required this.number,
    required this.name,
    required this.views,
    required this.premium,
    required this.onTap,
  });

  final String number;
  final String name;
  final int views;
  final bool premium;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Brand.black.withValues(alpha: 0.03),
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          number,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1,
                            color: Brand.black,
                          ),
                        ),
                        if (premium) ...[
                          const SizedBox(width: 8),
                          const _PremiumDot(),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      name,
                      style: TextStyle(fontSize: 14, color: Brand.black.withValues(alpha: 0.6)),
                    ),
                  ],
                ),
              ),
              Text(
                '$views',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Brand.black.withValues(alpha: 0.35),
                ),
              ),
              const SizedBox(width: 4),
              Icon(Icons.visibility_outlined,
                  size: 16, color: Brand.black.withValues(alpha: 0.35)),
            ],
          ),
        ),
      ),
    );
  }
}

/// Gold marks a paid subscription rather than a card design — the same rule the
/// website follows, so the two never disagree about what gold means.
class _PremiumDot extends StatelessWidget {
  const _PremiumDot();

  @override
  Widget build(BuildContext context) => Container(
        width: 8,
        height: 8,
        decoration: const BoxDecoration(color: Brand.premium, shape: BoxShape.circle),
      );
}
