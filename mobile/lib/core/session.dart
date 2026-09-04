import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Where the session lives on the phone.
///
/// Keystore on Android, Keychain on iOS — not shared preferences, which is a
/// plain XML file that any process running as the same user can read and that
/// a rooted phone hands over entirely. What is stored is the same opaque token
/// the backend issued; the app never decodes it and never logs it.
///
/// The manifest turns off backup and device transfer for the same reason. A
/// session restored onto another phone is an account handed over without
/// anybody signing in.
class SessionStore {
  SessionStore([FlutterSecureStorage? storage])
      : _storage = storage ??
            const FlutterSecureStorage(
              iOptions: IOSOptions(
                // Not synced to iCloud, and unreadable until the phone has been
                // unlocked once since boot. A session belongs to this device.
                accessibility: KeychainAccessibility.first_unlock_this_device,
                synchronizable: false,
              ),
            );

  static const _key = 'flex.session';

  final FlutterSecureStorage _storage;

  Future<String?> read() async {
    try {
      return await _storage.read(key: _key);
    } on Exception {
      // A keystore that refuses to answer — a phone mid-upgrade, a corrupted
      // entry — means signed out, not broken. The person signs in again.
      return null;
    }
  }

  Future<void> write(String token) => _storage.write(key: _key, value: token);

  Future<void> clear() => _storage.delete(key: _key);
}
