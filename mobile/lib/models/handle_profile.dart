class ProfileLink {
  const ProfileLink({required this.label, required this.href});

  factory ProfileLink.fromJson(Map<String, dynamic> json) => ProfileLink(
        label: json['label'] as String? ?? '',
        href: json['href'] as String? ?? '',
      );

  final String label;
  final String href;

  Map<String, dynamic> toJson() => {'label': label, 'href': href};
}

enum HandleStatus { available, claimed }

class HandleProfile {
  const HandleProfile({
    required this.normalized,
    required this.status,
    this.ownerName,
    this.bio,
    this.avatarUrl,
    this.links = const [],
    this.ownerId,
    this.claimedAt,
  });

  factory HandleProfile.fromRow(Map<String, dynamic> row) {
    final rawLinks = row['links'];
    return HandleProfile(
      normalized: row['normalized'] as String,
      status: row['status'] == 'claimed'
          ? HandleStatus.claimed
          : HandleStatus.available,
      ownerName: row['owner_name'] as String?,
      bio: row['bio'] as String?,
      avatarUrl: row['avatar_url'] as String?,
      links: rawLinks is List
          ? rawLinks
              .whereType<Map<String, dynamic>>()
              .map(ProfileLink.fromJson)
              .toList()
          : const [],
      ownerId: row['owner_id'] as String?,
      claimedAt: row['claimed_at'] == null
          ? null
          : DateTime.parse(row['claimed_at'] as String),
    );
  }

  final String normalized;
  final HandleStatus status;
  final String? ownerName;
  final String? bio;
  final String? avatarUrl;
  final List<ProfileLink> links;
  final String? ownerId;
  final DateTime? claimedAt;

  bool get isClaimed => status == HandleStatus.claimed;

  /// "Azizbek Ismoilov" -> "AI". Falls back to the handle itself so the
  /// avatar is never blank.
  String get initials {
    final name = ownerName?.trim();
    if (name == null || name.isEmpty) return normalized.substring(0, 2);
    return name
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .take(2)
        .map((part) => part[0].toUpperCase())
        .join();
  }
}
