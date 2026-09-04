enum GenesisStatus { unsold, claimed }

class GenesisCard {
  const GenesisCard({
    required this.serial,
    required this.status,
    this.ownerName,
    this.ownerHandle,
    this.mintedAt,
  });

  factory GenesisCard.fromRow(Map<String, dynamic> row) => GenesisCard(
        serial: row['normalized'] as String,
        status: row['status'] == 'claimed'
            ? GenesisStatus.claimed
            : GenesisStatus.unsold,
        ownerName: row['owner_name'] as String?,
        ownerHandle: row['owner_handle'] as String?,
        mintedAt: row['minted_at'] == null
            ? null
            : DateTime.parse(row['minted_at'] as String),
      );

  final String serial;
  final GenesisStatus status;
  final String? ownerName;
  final String? ownerHandle;
  final DateTime? mintedAt;

  bool get isClaimed => status == GenesisStatus.claimed;
}
