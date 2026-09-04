import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/mynt_theme.dart';
import '../widgets/mynt_background.dart';
import '../widgets/mynt_buttons.dart';
import '../widgets/mynt_fields.dart';

/// Step two of buying: what the profile will say. Nothing is written yet —
/// the handle is only taken once payment clears, so this screen just
/// collects and hands the values to checkout.
class ClaimProfileScreen extends StatefulWidget {
  const ClaimProfileScreen({super.key, required this.handle});

  final String handle;

  @override
  State<ClaimProfileScreen> createState() => _ClaimProfileScreenState();
}

class _ClaimProfileScreenState extends State<ClaimProfileScreen> {
  final _name = TextEditingController();
  final _bio = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _bio.dispose();
    super.dispose();
  }

  void _continue() {
    if (_name.text.trim().isEmpty) {
      setState(() => _error = 'Ism kiritish shart.');
      return;
    }
    setState(() => _error = null);
    final query = Uri(queryParameters: {
      'name': _name.text.trim(),
      'bio': _bio.text.trim(),
    }).query;
    context.push('/checkout/${widget.handle}?$query');
  }

  @override
  Widget build(BuildContext context) {
    return MyntScaffold(
      showGrid: false,
      glows: const [Alignment(-1.3, -1.2)],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const BackPill(),
              const _StepDots(current: 1),
            ],
          ),
          const SizedBox(height: 22),
          Text(
            'Profilingiz',
            style: MyntTypography.display(size: 30, height: 1.1, letterSpacing: -0.03),
          ),
          const SizedBox(height: 8),
          Text.rich(
            TextSpan(
              style: MyntTypography.body(
                size: 13,
                height: 1.5,
                color: MyntColors.inkAt(0.5),
              ),
              children: [
                const TextSpan(text: 'Bu maʼlumotlar '),
                TextSpan(
                  text: 'mynt.uz/${widget.handle}',
                  style: MyntTypography.tabular(size: 13, color: MyntColors.black),
                ),
                const TextSpan(text: ' sahifasida koʻrinadi.'),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          color: MyntColors.fieldFill,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: MyntColors.inkAt(0.18),
                            style: BorderStyle.solid,
                          ),
                        ),
                        child: Icon(
                          Icons.add,
                          size: 22,
                          color: MyntColors.inkAt(0.35),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Profil rasmi',
                              style: MyntTypography.body(
                                size: 14,
                                weight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'Ixtiyoriy · keyinroq ham qoʻshsa boʻladi',
                              style: MyntTypography.body(
                                size: 12,
                                color: MyntColors.inkAt(0.45),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 22),
                  MyntTextField(
                    controller: _name,
                    hint: 'Ismingiz *',
                    textCapitalization: TextCapitalization.words,
                  ),
                  const SizedBox(height: 12),
                  MyntTextField(
                    controller: _bio,
                    hint: 'Qisqa bio',
                    maxLines: 3,
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _error!,
                      style: MyntTypography.body(
                        size: 13,
                        color: const Color(0xFFB91C1C),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          LimeButton(label: 'Davom etish', onPressed: _continue),
          const SizedBox(height: 10),
          Text(
            'Keyinroq istalgan vaqtda oʻzgartira olasiz.',
            textAlign: TextAlign.center,
            style: MyntTypography.body(size: 11, color: MyntColors.inkAt(0.4)),
          ),
        ],
      ),
    );
  }
}

/// Three dashes: done, current, upcoming.
class _StepDots extends StatelessWidget {
  const _StepDots({required this.current});

  final int current;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < 3; i++) ...[
          Container(
            width: 22,
            height: 4,
            decoration: BoxDecoration(
              color: i < current
                  ? MyntColors.lime
                  : i == current
                      ? MyntColors.black
                      : MyntColors.inkAt(0.12),
              borderRadius: BorderRadius.circular(MyntRadii.pill),
            ),
          ),
          if (i < 2) const SizedBox(width: 6),
        ],
      ],
    );
  }
}
