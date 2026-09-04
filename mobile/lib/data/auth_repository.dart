import 'package:supabase_flutter/supabase_flutter.dart';

/// How a user proved who they are. Telegram is the one the design leads
/// with, and the one Supabase has no built-in provider for — see
/// [AuthRepository.telegramAvailability].
enum SignInChannel { phone, email }

class AuthRepository {
  AuthRepository(this._auth);

  final GoTrueClient _auth;

  Session? get session => _auth.currentSession;
  User? get user => _auth.currentUser;
  bool get isSignedIn => _auth.currentSession != null;

  Stream<AuthState> get changes => _auth.onAuthStateChange;

  /// Sends a one-time code. Phone needs an SMS provider configured in the
  /// Supabase dashboard; email works on a default project.
  Future<void> requestCode({
    required SignInChannel channel,
    required String destination,
  }) async {
    try {
      switch (channel) {
        case SignInChannel.phone:
          await _auth.signInWithOtp(phone: _normalizePhone(destination));
        case SignInChannel.email:
          await _auth.signInWithOtp(email: destination.trim());
      }
    } on AuthException catch (error) {
      throw AuthFailure(_readable(error));
    }
  }

  Future<void> verifyCode({
    required SignInChannel channel,
    required String destination,
    required String code,
  }) async {
    try {
      await _auth.verifyOTP(
        token: code.trim(),
        type: channel == SignInChannel.phone ? OtpType.sms : OtpType.email,
        phone: channel == SignInChannel.phone
            ? _normalizePhone(destination)
            : null,
        email: channel == SignInChannel.email ? destination.trim() : null,
      );
    } on AuthException catch (error) {
      throw AuthFailure(_readable(error));
    }
  }

  Future<void> signOut() => _auth.signOut();

  /// Telegram is not a Supabase provider. Making the design's primary
  /// button real needs a Telegram Login Widget plus an edge function that
  /// verifies its HMAC and mints a Supabase session. Until that exists the
  /// button says so rather than pretending.
  static const telegramAvailability =
      'Telegram orqali kirish uchun edge function kerak — hozircha telefon '
      'yoki email orqali kiring.';

  String _normalizePhone(String raw) {
    final digits = raw.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.startsWith('998')) return '+$digits';
    if (digits.length == 9) return '+998$digits';
    return '+$digits';
  }

  String _readable(AuthException error) {
    final message = error.message.toLowerCase();
    if (message.contains('rate') || message.contains('limit')) {
      return 'Juda ko\'p urinish. Bir oz kuting.';
    }
    if (message.contains('invalid') || message.contains('expired')) {
      return 'Kod noto\'g\'ri yoki muddati o\'tgan.';
    }
    if (message.contains('provider') || message.contains('disabled')) {
      return 'Bu kirish usuli Supabase loyihasida yoqilmagan.';
    }
    return error.message;
  }
}

class AuthFailure implements Exception {
  const AuthFailure(this.message);
  final String message;

  @override
  String toString() => message;
}
