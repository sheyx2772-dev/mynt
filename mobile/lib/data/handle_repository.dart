import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/config.dart';
import '../models/genesis_card.dart';
import '../models/handle_profile.dart';

class HandleRepository {
  HandleRepository(this._db, {http.Client? httpClient})
      : _http = httpClient ?? http.Client();

  final SupabaseClient _db;
  final http.Client _http;

  static const _columns =
      'normalized, status, owner_name, bio, avatar_url, links, owner_id, claimed_at';

  /// A handle row, or null when nobody has claimed it yet. Readable by
  /// anyone — this is what a tapped card resolves to.
  Future<HandleProfile?> fetch(String normalized) async {
    final row = await _db
        .from('handles')
        .select(_columns)
        .eq('normalized', normalized)
        .maybeSingle();
    return row == null ? null : HandleProfile.fromRow(row);
  }

  /// The signed-in user's own handle. Returns null before they claim one.
  Future<HandleProfile?> mine() async {
    final userId = _db.auth.currentUser?.id;
    if (userId == null) return null;
    final row = await _db
        .from('handles')
        .select(_columns)
        .eq('owner_id', userId)
        .eq('status', 'claimed')
        .maybeSingle();
    return row == null ? null : HandleProfile.fromRow(row);
  }

  /// Allowed by the "owner updates own handle" policy — the handle itself
  /// is not editable, only what hangs off it.
  Future<void> updateProfile({
    required String normalized,
    required String ownerName,
    required String bio,
    required List<ProfileLink> links,
    String? avatarUrl,
  }) async {
    await _db.from('handles').update({
      'owner_name': ownerName,
      'bio': bio,
      'links': links.map((l) => l.toJson()).toList(),
      if (avatarUrl != null) 'avatar_url': avatarUrl,
    }).eq('normalized', normalized);
  }

  Future<GenesisCard?> fetchGenesis(String serial) async {
    final row = await _db
        .from('genesis_cards')
        .select('normalized, status, owner_name, owner_handle, minted_at')
        .eq('normalized', serial)
        .maybeSingle();
    return row == null ? null : GenesisCard.fromRow(row);
  }

  /// Claiming decides ownership, so it runs on the server with the
  /// service_role key — the client only carries the user's access token.
  Future<HandleProfile> claim({
    required String letters,
    required String digits,
    required String ownerName,
    String bio = '',
    List<ProfileLink> links = const [],
  }) async {
    final token = _db.auth.currentSession?.accessToken;
    if (token == null) {
      throw const HandleFailure('Avval hisobingizga kiring.');
    }

    final response = await _http.post(
      Uri.parse('${MyntConfig.apiBaseUrl}/api/claim'),
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'letters': letters,
        'digits': digits,
        'name': ownerName,
        'bio': bio,
        'links': links.map((l) => l.toJson()).toList(),
      }),
    );

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode != 200) {
      throw HandleFailure(body['error'] as String? ?? 'Xatolik yuz berdi.');
    }
    return HandleProfile.fromRow(body['handle'] as Map<String, dynamic>);
  }

  /// Binds a physical card's serial to the caller's handle. Server-side for
  /// the same reason as claiming: the serial decides who owns the card.
  Future<GenesisCard> activateCard({
    required String serial,
    required String handle,
  }) async {
    final token = _db.auth.currentSession?.accessToken;
    if (token == null) {
      throw const HandleFailure('Avval hisobingizga kiring.');
    }

    final response = await _http.post(
      Uri.parse('${MyntConfig.apiBaseUrl}/api/genesis/activate'),
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer $token',
      },
      body: jsonEncode({'serial': serial, 'handle': handle}),
    );

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode != 200) {
      throw HandleFailure(body['error'] as String? ?? 'Xatolik yuz berdi.');
    }
    return GenesisCard.fromRow(body['card'] as Map<String, dynamic>);
  }
}

class HandleFailure implements Exception {
  const HandleFailure(this.message);
  final String message;

  @override
  String toString() => message;
}
