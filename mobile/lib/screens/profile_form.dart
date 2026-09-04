import 'package:flutter/widgets.dart';

import '../core/models/handle.dart';

/// The controllers behind the profile form, and the body they turn into.
///
/// Separate from the screen because a form with fourteen fields is fourteen
/// controllers to create and dispose, and mixing that with the layout makes
/// both harder to read than either is alone.
class ProfileForm {
  ProfileForm._();

  final name = TextEditingController();
  final bio = TextEditingController();
  final position = TextEditingController();
  final company = TextEditingController();
  final city = TextEditingController();
  final tags = TextEditingController();
  final phone = TextEditingController();
  final email = TextEditingController();
  final telegram = TextEditingController();
  final instagram = TextEditingController();
  final whatsapp = TextEditingController();
  final website = TextEditingController();

  /// The card design and device the profile already has.
  ///
  /// Carried through untouched because this screen does not offer them, and a
  /// save that omitted them would silently reset both to the default. They are
  /// chosen on the website, where the card can actually be seen.
  late String cardDesign;
  late String deviceType;

  factory ProfileForm.from(Handle handle) {
    final form = ProfileForm._();

    form.name.text = handle.name;
    form.bio.text = handle.bio;
    form.position.text = handle.position;
    form.company.text = handle.company;
    form.city.text = handle.city;
    form.tags.text = handle.tags.join(', ');
    form.phone.text = handle.phone;
    form.email.text = handle.email;
    form.cardDesign = handle.cardDesign;
    form.deviceType = handle.deviceType;

    // Links come back as whole addresses and go out as the part a person
    // recognises, so each is unpicked from the address it was built into.
    form.telegram.text = _username(handle, 'Telegram');
    form.instagram.text = _username(handle, 'Instagram');
    form.whatsapp.text = _whatsapp(handle);
    form.website.text = _href(handle, 'Veb-sayt');

    return form;
  }

  Map<String, dynamic> toJson() => {
        'name': name.text,
        'bio': bio.text,
        'position': position.text,
        'company': company.text,
        'city': city.text,
        'tags': tags.text,
        'phone': phone.text,
        'contactEmail': email.text,
        'cardDesign': cardDesign,
        'deviceType': deviceType,
        'links': {
          'telegram': telegram.text,
          'instagram': instagram.text,
          'whatsapp': whatsapp.text,
          'website': website.text,
        },
      };

  void dispose() {
    for (final c in [
      name, bio, position, company, city, tags,
      phone, email, telegram, instagram, whatsapp, website,
    ]) {
      c.dispose();
    }
  }

  static String _href(Handle handle, String label) {
    for (final link in handle.links) {
      if (link.label == label) return link.href;
    }
    return '';
  }

  /// The last path segment of a platform address, which is the username.
  static String _username(Handle handle, String label) {
    final href = _href(handle, label);
    if (href.isEmpty) return '';
    return Uri.tryParse(href)?.pathSegments.lastOrNull ?? '';
  }

  /// wa.me carries the number in its path, and the field asks for a number.
  static String _whatsapp(Handle handle) {
    final digits = _username(handle, 'WhatsApp');
    return digits.isEmpty ? '' : '+$digits';
  }
}
