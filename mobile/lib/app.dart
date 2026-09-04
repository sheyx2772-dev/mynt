import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/config.dart';
import 'data/analytics_repository.dart';
import 'data/auth_repository.dart';
import 'data/handle_repository.dart';
import 'data/lead_repository.dart';
import 'router.dart';
import 'theme/mynt_theme.dart';

/// Plain InheritedWidget rather than a state-management package: the app has
/// four repositories and no cross-screen shared state worth a container.
class MyntServices extends InheritedWidget {
  const MyntServices({
    super.key,
    required this.auth,
    required this.handles,
    required this.leads,
    required this.analytics,
    required super.child,
  });

  final AuthRepository auth;
  final HandleRepository handles;
  final LeadRepository leads;
  final AnalyticsRepository analytics;

  static MyntServices of(BuildContext context) {
    final services =
        context.dependOnInheritedWidgetOfExactType<MyntServices>();
    assert(services != null, 'MyntServices missing above this widget');
    return services!;
  }

  @override
  bool updateShouldNotify(MyntServices oldWidget) => false;
}

class MyntApp extends StatefulWidget {
  const MyntApp({super.key});

  @override
  State<MyntApp> createState() => _MyntAppState();
}

class _MyntAppState extends State<MyntApp> {
  late final AuthRepository _auth;
  late final HandleRepository _handles;
  late final LeadRepository _leads;
  late final AnalyticsRepository _analytics;

  @override
  void initState() {
    super.initState();
    final client = Supabase.instance.client;
    _auth = AuthRepository(client.auth);
    _handles = HandleRepository(client);
    _leads = LeadRepository(client);
    _analytics = AnalyticsRepository(client);
  }

  @override
  Widget build(BuildContext context) {
    if (!MyntConfig.isConfigured) return const _MissingConfigApp();

    return MyntServices(
      auth: _auth,
      handles: _handles,
      leads: _leads,
      analytics: _analytics,
      child: MaterialApp.router(
        title: 'Mynt',
        debugShowCheckedModeBanner: false,
        theme: buildMyntTheme(),
        routerConfig: buildRouter(_auth),
      ),
    );
  }
}

/// Without SUPABASE_URL / SUPABASE_ANON_KEY the app cannot do anything, so
/// it says exactly that instead of failing somewhere deeper.
class _MissingConfigApp extends StatelessWidget {
  const _MissingConfigApp();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: buildMyntTheme(),
      home: Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Sozlama yetishmayapti', style: MyntTypography.display(size: 22)),
                const SizedBox(height: 12),
                Text(
                  'SUPABASE_URL va SUPABASE_ANON_KEY berilmagan.\n'
                  'Ishga tushirish:\n\n'
                  'flutter run --dart-define-from-file=env.json',
                  textAlign: TextAlign.center,
                  style: MyntTypography.body(
                    size: 13,
                    height: 1.6,
                    color: MyntColors.inkAt(0.6),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
