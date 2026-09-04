import 'package:flutter/material.dart';

import '../theme/mynt_theme.dart';

enum AppTab { profile, leads, analytics, settings }

/// The owner-side bottom bar. Only these three surfaces plus settings live
/// behind it — the buying flow is not tabbed.
class AppTabBar extends StatelessWidget {
  const AppTabBar({super.key, required this.current, required this.onSelect});

  final AppTab current;
  final ValueChanged<AppTab> onSelect;

  static const _items = <(AppTab, IconData, String)>[
    (AppTab.profile, Icons.person_outline, 'Profil'),
    (AppTab.leads, Icons.inbox_outlined, 'Leadlar'),
    (AppTab.analytics, Icons.bar_chart_rounded, 'Analitika'),
    (AppTab.settings, Icons.tune_rounded, 'Sozlamalar'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: MyntColors.white,
        border: Border(top: BorderSide(color: Color(0x12000000))),
      ),
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
      child: Row(
        children: [
          for (final (tab, icon, label) in _items)
            Expanded(
              child: _TabButton(
                icon: icon,
                label: label,
                active: tab == current,
                onTap: () => onSelect(tab),
              ),
            ),
        ],
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = active ? MyntColors.black : MyntColors.inkAt(0.35);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(MyntRadii.control),
      child: SizedBox(
        height: 56,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 21, color: color),
            const SizedBox(height: 5),
            Text(
              label,
              style: MyntTypography.body(
                size: 10,
                weight: active ? FontWeight.w600 : FontWeight.w500,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
