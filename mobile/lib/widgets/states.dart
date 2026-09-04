import 'package:flutter/material.dart';

import '../brand/palette.dart';
import '../core/api/errors.dart';

/// The three things a screen shows when it has no content: waiting, nothing,
/// and something went wrong.
///
/// In one place because they were the three most-copied blocks in the app, and
/// because an error that reads differently on every screen teaches somebody
/// that errors are noise.

class Waiting extends StatelessWidget {
  const Waiting({super.key});

  @override
  Widget build(BuildContext context) => const Center(
        child: Padding(
          padding: EdgeInsets.all(48),
          child: CircularProgressIndicator(color: Brand.limeInk, strokeWidth: 2),
        ),
      );
}

/// Nothing here yet — which is usually not a problem but a stage.
class Empty extends StatelessWidget {
  const Empty({super.key, required this.title, this.detail});

  final String title;
  final String? detail;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: Brand.black),
            ),
            if (detail != null) ...[
              const SizedBox(height: 8),
              Text(
                detail!,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, height: 1.5, color: Brand.black.withValues(alpha: 0.55)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Something failed, and the person can try again.
class Failed extends StatelessWidget {
  const Failed({super.key, required this.error, this.onRetry});

  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    // Only an ApiException carries a sentence written to be read. Anything else
    // is a bug, and its message would be a Dart type name on somebody's phone.
    final message = error is ApiException
        ? (error as ApiException).message
        : ApiException.server.message;

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 15, height: 1.5, color: Brand.black.withValues(alpha: 0.7)),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 20),
              TextButton(
                onPressed: onRetry,
                style: TextButton.styleFrom(foregroundColor: Brand.limeInk),
                child: const Text('Qayta urinish'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
