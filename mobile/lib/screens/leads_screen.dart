import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../brand/palette.dart';
import '../core/api/errors.dart';
import '../core/models/lead.dart';
import '../state/providers.dart';
import '../widgets/lead_card.dart';
import '../widgets/states.dart';

/// The contacts people left on a card.
///
/// The screen a phone is genuinely better at than a browser: every row here
/// ends in a call or a message, and the thing that makes the call is already
/// in the hand holding this.
class LeadsScreen extends ConsumerWidget {
  const LeadsScreen({super.key, required this.number});

  final String number;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leads = ref.watch(leadsProvider(number));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Vizitkalar'),
        backgroundColor: Brand.white,
        surfaceTintColor: Brand.white,
      ),
      body: RefreshIndicator(
        color: Brand.limeInk,
        onRefresh: () async => ref.invalidate(leadsProvider(number)),
        child: leads.when(
          loading: () => const Waiting(),
          error: (error, _) => Failed(
            error: error,
            onRetry: () => ref.invalidate(leadsProvider(number)),
          ),
          data: (list) => list.isEmpty
              ? ListView(children: const [
                  SizedBox(height: 80),
                  Empty(
                    title: 'Hali kontakt yo\'q',
                    detail: 'Kartangizni tegizgan odam profildagi forma orqali '
                        'o\'z ma\'lumotini qoldirsa, u shu yerda paydo bo\'ladi.',
                  ),
                ])
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                  itemCount: list.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, i) => LeadCard(
                    lead: list[i],
                    onDelete: () => _delete(context, ref, list[i]),
                  ),
                ),
        ),
      ),
    );
  }

  Future<void> _delete(BuildContext context, WidgetRef ref, Lead lead) async {
    // Somebody's contact details, removed on request — so it asks first. There
    // is no undo, and the person who left them cannot leave them again.
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('O\'chirilsinmi?'),
        content: Text('${lead.name} qoldirgan ma\'lumot butunlay o\'chadi.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Yo\'q'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: const Color(0xFFB91C1C)),
            child: const Text('O\'chirish'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await ref.read(apiProvider).deleteLead(number, lead.id);
      ref.invalidate(leadsProvider(number));
    } on ApiException catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.message)),
        );
      }
    }
  }
}
