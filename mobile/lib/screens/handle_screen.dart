import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../app.dart';
import '../core/formatting.dart';
import '../core/pricing.dart';
import '../models/handle_profile.dart';
import '../theme/mynt_theme.dart';
import '../widgets/mynt_background.dart';
import '../widgets/mynt_buttons.dart';
import '../widgets/mynt_cards.dart';
import '../widgets/mynt_fields.dart';
import '../widgets/mynt_marks.dart';

/// One screen, two states: the handle is free (price breakdown + claim) or
/// it is taken (who has it + near alternatives). They share a shell because
/// the URL is the same thing either way — mynt.uz/AZI121.
class HandleScreen extends StatefulWidget {
  const HandleScreen({super.key, required this.handle});

  final String handle;

  @override
  State<HandleScreen> createState() => _HandleScreenState();
}

class _HandleScreenState extends State<HandleScreen> {
  Future<HandleProfile?>? _future;

  // MyntServices is an InheritedWidget, so it can only be read from here —
  // not from initState.
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= MyntServices.of(context).handles.fetch(widget.handle);
  }

  @override
  Widget build(BuildContext context) {
    final parsed = parseHandle(widget.handle);

    return MyntScaffold(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const BackPill(),
              const SizedBox(width: 12),
              const MyntWordmark(),
            ],
          ),
          const SizedBox(height: 24),
          Expanded(
            child: parsed == null
                ? _InvalidHandle(raw: widget.handle)
                : FutureBuilder<HandleProfile?>(
                    future: _future,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(
                          child: CircularProgressIndicator(
                            color: MyntColors.black,
                            strokeWidth: 2.4,
                          ),
                        );
                      }
                      if (snapshot.hasError) {
                        return _LoadFailed(
                          onRetry: () => setState(() {
                            _future = MyntServices.of(context)
                                .handles
                                .fetch(widget.handle);
                          }),
                        );
                      }
                      final profile = snapshot.data;
                      if (profile != null && profile.isClaimed) {
                        return _TakenView(parsed: parsed, profile: profile);
                      }
                      return _AvailableView(parsed: parsed);
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _AvailableView extends StatelessWidget {
  const _AvailableView({required this.parsed});

  final ParsedHandle parsed;

  @override
  Widget build(BuildContext context) {
    final lr = letterRarity(parsed.letters);
    final dr = digitRarity(parsed.digits);

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyntCard(
            child: Column(
              children: [
                const Center(child: StatusPill(label: "Bo'sh")),
                const SizedBox(height: 14),
                Text(
                  parsed.normalized,
                  style: MyntTypography.tabular(
                    size: 40,
                    weight: FontWeight.w600,
                    displayFace: true,
                    letterSpacing: -0.03,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'mynt.uz/${parsed.normalized}',
                  style: MyntTypography.tabular(
                    size: 13,
                    weight: FontWeight.w400,
                    color: MyntColors.inkAt(0.45),
                  ),
                ),
                const SizedBox(height: 22),
                BreakdownRow(
                  label: 'Harf kamyobligi',
                  reason: lr.reason,
                  value: '×${lr.multiplier}',
                ),
                BreakdownRow(
                  label: 'Raqam kamyobligi',
                  reason: dr.reason,
                  value: '×${dr.multiplier}',
                ),
                BreakdownRow(
                  label: 'Bazaviy narx',
                  value: formatUZS(basePrice),
                  muted: true,
                ),
                TotalRow(label: 'Jami', value: formatUZS(parsed.price)),
                const SizedBox(height: 18),
                LimeButton(
                  label: 'Band qilish',
                  onPressed: () => context.push('/claim/${parsed.normalized}'),
                ),
                const SizedBox(height: 10),
                Text(
                  "Handle to'lov tasdiqlangandan keyin biriktiriladi.",
                  textAlign: TextAlign.center,
                  style: MyntTypography.body(
                    size: 11,
                    height: 1.5,
                    color: MyntColors.inkAt(0.4),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _Alternatives(parsed: parsed),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _TakenView extends StatelessWidget {
  const _TakenView({required this.parsed, required this.profile});

  final ParsedHandle parsed;
  final HandleProfile profile;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyntCard(
            child: Column(
              children: [
                const Center(
                  child: StatusPill(label: 'Band qilingan', available: false),
                ),
                const SizedBox(height: 14),
                Text(
                  parsed.normalized,
                  style: MyntTypography.tabular(
                    size: 40,
                    weight: FontWeight.w600,
                    displayFace: true,
                    color: MyntColors.inkAt(0.45),
                    letterSpacing: -0.03,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'mynt.uz/${parsed.normalized}',
                  style: MyntTypography.tabular(
                    size: 13,
                    weight: FontWeight.w400,
                    color: MyntColors.inkAt(0.35),
                  ),
                ),
                const SizedBox(height: 22),
                InkWell(
                  onTap: () => context.push('/p/${parsed.normalized}'),
                  borderRadius: BorderRadius.circular(MyntRadii.control),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: MyntColors.inkAt(0.03),
                      borderRadius: BorderRadius.circular(MyntRadii.control),
                    ),
                    child: Row(
                      children: [
                        InitialsAvatar(
                          initials: profile.initials,
                          size: 40,
                          background: MyntColors.black,
                          foreground: MyntColors.lime,
                          imageUrl: profile.avatarUrl,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                profile.ownerName ?? parsed.normalized,
                                style: MyntTypography.body(
                                  size: 14,
                                  weight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _ownedSince(profile),
                                style: MyntTypography.body(
                                  size: 12,
                                  color: MyntColors.inkAt(0.45),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          Icons.chevron_right,
                          size: 18,
                          color: MyntColors.inkAt(0.3),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                OutlineButton(
                  label: "Bo'shasa xabar bering",
                  onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      backgroundColor: MyntColors.black,
                      behavior: SnackBarBehavior.floating,
                      content: Text(
                        "Bo'shaganda sizga xabar beramiz.",
                        style: MyntTypography.body(
                          size: 13,
                          color: MyntColors.white,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          _Alternatives(parsed: parsed),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  String _ownedSince(HandleProfile profile) {
    final at = profile.claimedAt;
    if (at == null) return 'Egasi bor';
    return '${at.year}-yildan beri egasi';
  }
}

/// Near-miss handles, priced with the same formula. Generated rather than
/// queried so the screen still has somewhere to send you when the database
/// has almost nothing in it.
class _Alternatives extends StatelessWidget {
  const _Alternatives({required this.parsed});

  final ParsedHandle parsed;

  List<ParsedHandle> get _candidates {
    final base = parsed.digits;
    final seeds = <String>{
      '${base[0]}${base[1]}${(int.parse(base[2]) + 1) % 10}',
      '${(int.parse(base[0]) + 1) % 10}${base[1]}${base[2]}',
      '${base[2]}${base[1]}${base[0]}',
    }..remove(base);
    return [
      for (final digits in seeds.take(3)) ParsedHandle(parsed.letters, digits),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final candidates = _candidates;
    if (candidates.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Eyebrow('Yaqin variantlar'),
        const SizedBox(height: 10),
        for (final candidate in candidates) ...[
          _AlternativeRow(candidate: candidate),
          const SizedBox(height: 8),
        ],
      ],
    );
  }
}

class _AlternativeRow extends StatelessWidget {
  const _AlternativeRow({required this.candidate});

  final ParsedHandle candidate;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.pushReplacement('/handle/${candidate.normalized}'),
      borderRadius: BorderRadius.circular(MyntRadii.control),
      child: Container(
        height: 56,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: MyntColors.white,
          borderRadius: BorderRadius.circular(MyntRadii.control),
          border: Border.all(color: MyntColors.hairline),
        ),
        child: Row(
          children: [
            Text(
              candidate.normalized,
              style: MyntTypography.tabular(
                size: 15,
                weight: FontWeight.w600,
                displayFace: true,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                digitRarity(candidate.digits).reason,
                style: MyntTypography.body(
                  size: 11,
                  color: MyntColors.inkAt(0.4),
                ),
              ),
            ),
            Text(
              formatUZS(candidate.price),
              style: MyntTypography.tabular(size: 13),
            ),
          ],
        ),
      ),
    );
  }
}

class _InvalidHandle extends StatelessWidget {
  const _InvalidHandle({required this.raw});

  final String raw;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        '"$raw" noto\'g\'ri format.\n\n'
        'Shaxsiy handle 3 harf + 3 raqamdan iborat (masalan MYN042), '
        'MYNT CARD seriya raqami esa 6 ta raqamdan (masalan 000001).',
        textAlign: TextAlign.center,
        style: MyntTypography.body(
          size: 14,
          height: 1.6,
          color: MyntColors.inkAt(0.6),
        ),
      ),
    );
  }
}

class _LoadFailed extends StatelessWidget {
  const _LoadFailed({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Ma\'lumotni yuklab bo\'lmadi.',
            style: MyntTypography.body(size: 14, color: MyntColors.inkAt(0.6)),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: 180,
            child: OutlineButton(label: 'Qayta urinish', onPressed: onRetry),
          ),
        ],
      ),
    );
  }
}
