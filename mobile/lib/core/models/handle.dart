/// One number, as the backend describes it.
///
/// Hand-written rather than generated from the OpenAPI document. A generator
/// would produce several hundred lines nobody has read, for a shape that is
/// twenty; the document is still the contract, and `admin/` does generate from
/// it, where the surface is wide enough to be worth it.
class Handle {
  const Handle({
    required this.number,
    required this.status,
    required this.name,
    required this.bio,
    required this.avatarUrl,
    required this.links,
    required this.services,
    required this.city,
    required this.email,
    required this.phone,
    required this.position,
    required this.company,
    required this.tags,
    required this.cardDesign,
    required this.deviceType,
    required this.plan,
    required this.viewCount,
  });

  final String number;
  final String status;
  final String name;
  final String bio;
  final String? avatarUrl;
  final List<ProfileLink> links;
  final List<Service> services;
  final String city;
  final String email;
  final String phone;
  final String position;
  final String company;
  final List<String> tags;
  final String cardDesign;
  final String deviceType;
  final String plan;
  final int viewCount;

  bool get isPremium => plan == 'premium';
  bool get isClaimed => status == 'claimed';

  /// What the owner is called on their own card, falling back to the number
  /// itself — a claimed profile with no name yet still has to be listed.
  String get displayName => name.isEmpty ? number : name;

  factory Handle.fromJson(Map<String, dynamic> json) => Handle(
        number: json['raqam'] as String? ?? '',
        status: json['holat'] as String? ?? 'available',
        name: json['ism'] as String? ?? '',
        bio: json['bio'] as String? ?? '',
        avatarUrl: json['rasm'] as String?,
        links: _list(json['havolalar']).map(ProfileLink.fromJson).toList(),
        services: _list(json['xizmatlar']).map(Service.fromJson).toList(),
        city: json['shahar'] as String? ?? '',
        email: json['email'] as String? ?? '',
        phone: json['telefon'] as String? ?? '',
        position: json['lavozim'] as String? ?? '',
        company: json['kompaniya'] as String? ?? '',
        tags: (json['teglar'] as List? ?? const []).map((t) => '$t').toList(),
        cardDesign: json['dizayn'] as String? ?? 'genesis',
        deviceType: json['qurilma'] as String? ?? 'card',
        plan: json['tarif'] as String? ?? 'free',
        viewCount: (json['korishlar'] as num?)?.toInt() ?? 0,
      );
}

class ProfileLink {
  const ProfileLink({required this.label, required this.href});

  final String label;
  final String href;

  factory ProfileLink.fromJson(Map<String, dynamic> json) => ProfileLink(
        label: json['label'] as String? ?? '',
        href: json['href'] as String? ?? '',
      );
}

class Service {
  const Service({required this.name, required this.price});

  final String name;
  final String price;

  factory Service.fromJson(Map<String, dynamic> json) => Service(
        name: json['name'] as String? ?? '',
        price: json['price'] as String? ?? '',
      );
}

/// Every list from the API is an array of objects; a field that is missing or
/// the wrong shape becomes an empty list rather than a crash on a screen.
List<Map<String, dynamic>> _list(Object? raw) =>
    (raw as List? ?? const []).whereType<Map<String, dynamic>>().toList();
