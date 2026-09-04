import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../brand/palette.dart';
import '../core/models/lead.dart';

/// One contact, and the ways to answer it.

class LeadCard extends StatelessWidget {
  const LeadCard({super.key, required this.lead, required this.onDelete});

  final Lead lead;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Brand.black.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  lead.name,
                  style: const TextStyle(
                      fontSize: 17, fontWeight: FontWeight.w600, color: Brand.black),
                ),
              ),
              if (lead.source.isNotEmpty) _SourceTag(source: lead.source),
              IconButton(
                onPressed: onDelete,
                visualDensity: VisualDensity.compact,
                icon: Icon(Icons.delete_outline,
                    size: 20, color: Brand.black.withValues(alpha: 0.35)),
              ),
            ],
          ),
          if (lead.company.isNotEmpty)
            Text(lead.company,
                style: TextStyle(fontSize: 14, color: Brand.black.withValues(alpha: 0.6))),
          if (lead.note.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(lead.note,
                style: TextStyle(
                    fontSize: 14, height: 1.5, color: Brand.black.withValues(alpha: 0.7))),
          ],
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (lead.hasPhone) ...[
                _Reach(icon: Icons.call, label: lead.phone, uri: 'tel:${lead.phone}'),
                _Reach(icon: Icons.sms_outlined, label: 'SMS', uri: 'sms:${lead.phone}'),
              ],
              if (lead.hasEmail)
                _Reach(icon: Icons.mail_outline, label: lead.email, uri: 'mailto:${lead.email}'),
            ],
          ),
        ],
      ),
    );
  }
}

class _SourceTag extends StatelessWidget {
  const _SourceTag({required this.source});

  final String source;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: Brand.lime.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          source.toUpperCase(),
          style: const TextStyle(
              fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.5, color: Brand.black),
        ),
      );
}

/// One way to reach the person, as a tap.
class _Reach extends StatelessWidget {
  const _Reach({required this.icon, required this.label, required this.uri});

  final IconData icon;
  final String label;

  /// A tel:, sms: or mailto: address built from what the person typed into the
  /// form. The backend refused anything that was not a phone or an address
  /// before storing it, which is what makes this safe to hand to the platform.
  final String uri;

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      avatar: Icon(icon, size: 16, color: Brand.limeInk),
      label: Text(label, style: const TextStyle(fontSize: 13)),
      backgroundColor: Brand.white,
      side: BorderSide(color: Brand.black.withValues(alpha: 0.12)),
      onPressed: () => launchUrl(Uri.parse(uri)),
    );
  }
}
