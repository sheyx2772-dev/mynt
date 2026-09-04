import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/lead.dart';

class LeadRepository {
  LeadRepository(this._db);

  final SupabaseClient _db;

  /// Only the handle's owner gets rows back — enforced by the
  /// "owner reads own leads" policy, not by this query.
  Future<List<Lead>> forHandle(String handle, {int limit = 100}) async {
    final rows = await _db
        .from('leads')
        .select('id, handle, name, phone, company, note, source, created_at')
        .eq('handle', handle)
        .order('created_at', ascending: false)
        .limit(limit);
    return rows.map(Lead.fromRow).toList();
  }

  /// Written by the visitor who tapped the card — anonymous by definition.
  Future<void> create({
    required String handle,
    required String name,
    required LeadSource source,
    String? phone,
    String? company,
    String? genesisSerial,
  }) async {
    await _db.from('leads').insert({
      'handle': handle,
      'name': name,
      'source': source.wire,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
      if (company != null && company.isNotEmpty) 'company': company,
      if (genesisSerial != null) 'genesis_serial': genesisSerial,
    });
  }
}
