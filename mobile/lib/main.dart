import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';
import 'core/config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (MyntConfig.isConfigured) {
    await Supabase.initialize(
      url: MyntConfig.supabaseUrl,
      publishableKey: MyntConfig.supabaseAnonKey,
    );
  }

  runApp(const MyntApp());
}
