enum LeadSource { nfc, qr, link }

LeadSource _sourceFrom(String? raw) => switch (raw) {
      'qr' => LeadSource.qr,
      'link' => LeadSource.link,
      _ => LeadSource.nfc,
    };

extension LeadSourceLabel on LeadSource {
  String get label => switch (this) {
        LeadSource.nfc => 'NFC',
        LeadSource.qr => 'QR',
        LeadSource.link => 'Havola',
      };

  String get wire => name;
}

class Lead {
  const Lead({
    required this.id,
    required this.handle,
    required this.name,
    required this.source,
    required this.createdAt,
    this.phone,
    this.company,
    this.note,
  });

  factory Lead.fromRow(Map<String, dynamic> row) => Lead(
        id: row['id'] as String,
        handle: row['handle'] as String,
        name: row['name'] as String,
        source: _sourceFrom(row['source'] as String?),
        createdAt: DateTime.parse(row['created_at'] as String),
        phone: row['phone'] as String?,
        company: row['company'] as String?,
        note: row['note'] as String?,
      );

  final String id;
  final String handle;
  final String name;
  final LeadSource source;
  final DateTime createdAt;
  final String? phone;
  final String? company;
  final String? note;

  String get initials => name
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .take(2)
      .map((part) => part[0].toUpperCase())
      .join();

  /// "Uzum Market · +998 90 123 45 67", skipping whichever half is missing.
  String get subtitle =>
      [company, phone].where((v) => v != null && v.isNotEmpty).join(' · ');
}
