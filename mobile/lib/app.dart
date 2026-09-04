import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'brand/palette.dart';
import 'core/config.dart';

/// The application, and for now one screen that tells the truth about it.
///
/// There are no product screens yet. What this does is exercise the whole chain
/// the real ones will use — the app asks the backend, the backend asks Postgres
/// — so that when a screen is written, every piece underneath it is known to be
/// connected. A phone that cannot reach the backend says so here, with the
/// address it tried, instead of failing later inside a form.

final _dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: '${Config.apiBaseUrl}${Config.apiPrefix}',
      // A phone is on a mobile network more often than not, and a request with
      // no deadline is a spinner that never stops.
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 20),
      // Anything but 2xx is an error the caller has to handle, rather than a
      // body that looks like data and is not.
      validateStatus: (status) => status != null && status >= 200 && status < 300,
    ),
  );
  ref.onDispose(dio.close);
  return dio;
});

final _healthProvider = FutureProvider<String>((ref) async {
  final response = await ref.watch(_dioProvider).get<Map<String, dynamic>>('/sogliq');
  return response.data?['database'] as String? ?? 'nomaʼlum';
});

class FlexApp extends StatelessWidget {
  const FlexApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flex',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: Brand.lime,
          primary: Brand.black,
          surface: Brand.white,
        ),
        scaffoldBackgroundColor: Brand.white,
      ),
      home: const _ConnectionScreen(),
    );
  }
}

class _ConnectionScreen extends ConsumerWidget {
  const _ConnectionScreen();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final health = ref.watch(_healthProvider);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'FLEX',
                style: TextStyle(
                  fontSize: 12,
                  letterSpacing: 4,
                  fontWeight: FontWeight.w600,
                  color: Brand.black.withValues(alpha: 0.4),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Ekranlar hali yozilmagan',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w600, color: Brand.black),
              ),
              const SizedBox(height: 10),
              Text(
                'Bu sahifa bitta narsani tekshiradi: telefon backend bilan, '
                'backend esa baza bilan gaplasha oladimi.',
                style: TextStyle(fontSize: 15, height: 1.5, color: Brand.black.withValues(alpha: 0.6)),
              ),
              const SizedBox(height: 32),
              health.when(
                loading: () => const Text('Tekshirilyapti…'),
                error: (_, _) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Backend javob bermadi.',
                      style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xFFB91C1C)),
                    ),
                    const SizedBox(height: 6),
                    // The address is shown because the usual cause is that it is
                    // the wrong one: an emulator needs 10.0.2.2 where a real
                    // phone needs the laptop's address on the Wi-Fi.
                    Text(
                      Config.apiBaseUrl,
                      style: TextStyle(fontSize: 13, color: Brand.black.withValues(alpha: 0.5)),
                    ),
                  ],
                ),
                data: (database) => Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(color: Brand.lime, shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Backend ishlayapti, baza — $database',
                      style: const TextStyle(fontSize: 15, color: Brand.black),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
