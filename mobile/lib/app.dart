import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'brand/palette.dart';
import 'core/deep_links.dart';
import 'router.dart';
import 'state/session_controller.dart';

final _routerProvider = Provider<GoRouter>((ref) => buildRouter(ref));

class FlexApp extends ConsumerStatefulWidget {
  const FlexApp({super.key});

  @override
  ConsumerState<FlexApp> createState() => _FlexAppState();
}

class _FlexAppState extends ConsumerState<FlexApp> {
  late final DeepLinks _links;

  @override
  void initState() {
    super.initState();
    // Started once, for the life of the app: a sign-in link can arrive while
    // the app is cold, and while it is already open in front of somebody.
    _links = DeepLinks(
      (token) => ref.read(sessionProvider.notifier).confirm(token),
    )..listen();
  }

  @override
  void dispose() {
    _links.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Flex',
      debugShowCheckedModeBanner: false,
      routerConfig: ref.watch(_routerProvider),
      theme: _theme(),
    );
  }

  ThemeData _theme() {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: Brand.white,
      colorScheme: ColorScheme.fromSeed(
        seedColor: Brand.lime,
        // Lime is a surface, never a foreground: it sits at 1.2:1 on white and
        // would be unreadable as text or as an icon.
        primary: Brand.black,
        surface: Brand.white,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Brand.white,
        surfaceTintColor: Brand.white,
        foregroundColor: Brand.black,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontSize: 19,
          fontWeight: FontWeight.w600,
          color: Brand.black,
        ),
      ),
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: Brand.black,
        contentTextStyle: TextStyle(color: Brand.white),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
