/// Port of `src/lib/format.ts` — space-grouped thousands, so'm suffix.
String formatNumber(num n) {
  final digits = n.round().toString();
  final buffer = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) buffer.write(' ');
    buffer.write(digits[i]);
  }
  return buffer.toString();
}

String formatUZS(num n) => "${formatNumber(n)} so'm";

/// "14:20" for today, "Kecha", then a plain date.
String formatLeadTime(DateTime at) {
  final now = DateTime.now();
  final local = at.toLocal();
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(local.year, local.month, local.day);
  final diff = today.difference(day).inDays;
  if (diff == 0) {
    final h = local.hour.toString().padLeft(2, '0');
    final m = local.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
  if (diff == 1) return 'Kecha';
  return '${local.day}.${local.month.toString().padLeft(2, '0')}';
}
