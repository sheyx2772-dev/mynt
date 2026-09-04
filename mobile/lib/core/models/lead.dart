/// A contact somebody left on a profile.
class Lead {
  const Lead({
    required this.id,
    required this.name,
    required this.phone,
    required this.email,
    required this.company,
    required this.note,
    required this.source,
    required this.createdAt,
  });

  final int id;
  final String name;
  final String phone;
  final String email;
  final String company;
  final String note;

  /// How they arrived: a tap, a QR code, a shared link — or nothing, when the
  /// visit came from somewhere we did not issue a link for.
  final String source;

  final DateTime createdAt;

  bool get hasPhone => phone.isNotEmpty;
  bool get hasEmail => email.isNotEmpty;

  factory Lead.fromJson(Map<String, dynamic> json) => Lead(
        id: (json['id'] as num?)?.toInt() ?? 0,
        name: json['ism'] as String? ?? '',
        phone: json['telefon'] as String? ?? '',
        email: json['email'] as String? ?? '',
        company: json['kompaniya'] as String? ?? '',
        note: json['izoh'] as String? ?? '',
        source: json['manba'] as String? ?? '',
        // A timestamp that will not parse becomes now rather than throwing: a
        // list of contacts is worth more than the exactness of one date.
        createdAt: DateTime.tryParse(json['vaqt'] as String? ?? '') ?? DateTime.now(),
      );
}
