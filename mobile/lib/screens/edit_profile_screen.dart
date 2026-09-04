import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../brand/palette.dart';
import '../core/api/errors.dart';
import '../core/models/handle.dart';
import '../state/providers.dart';
import '../widgets/buttons.dart';
import '../widgets/fields.dart';
import '../widgets/states.dart';
import 'profile_form.dart';

/// Editing what a tapped card opens.
///
/// The form collects; the server decides. Nothing is validated twice here —
/// links are rebuilt from validated parts on the backend, an address that is
/// not one is dropped there, and the service limit comes from the stored plan.
/// A second copy of those rules in an app that ships to phones would be the
/// copy that goes stale.
class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key, required this.number});

  final String number;

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  ProfileForm? _form;
  bool _saving = false;
  String? _problem;

  @override
  void dispose() {
    _form?.dispose();
    super.dispose();
  }

  /// Built once, from the first loaded copy. Rebuilding it on every rebuild
  /// would throw away whatever the person had typed.
  ProfileForm _formFor(Handle handle) => _form ??= ProfileForm.from(handle);

  Future<void> _save() async {
    final form = _form;
    if (form == null) return;

    setState(() {
      _saving = true;
      _problem = null;
    });

    try {
      await ref.read(apiProvider).saveProfile(widget.number, form.toJson());
      // Both lists hold a copy of this profile, and a stale card behind the
      // back button is how somebody comes to believe a save did not work.
      ref.invalidate(numberProvider(widget.number));
      ref.invalidate(myNumbersProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Saqlandi')),
        );
        Navigator.of(context).pop();
      }
    } on ApiException catch (error) {
      if (mounted) setState(() => _problem = error.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final handle = ref.watch(numberProvider(widget.number));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil'),
        backgroundColor: Brand.white,
        surfaceTintColor: Brand.white,
      ),
      body: handle.when(
        loading: () => const Waiting(),
        error: (error, _) => Failed(
          error: error,
          onRetry: () => ref.invalidate(numberProvider(widget.number)),
        ),
        data: (h) => _body(_formFor(h), h),
      ),
    );
  }

  Widget _body(ProfileForm form, Handle handle) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
      children: [
        Field(label: 'Ism', controller: form.name, maxLength: 80),
        Field(
          label: 'Bio',
          controller: form.bio,
          maxLines: 3,
          maxLength: 280,
          hint: 'O\'zingiz haqingizda bir-ikki gap',
        ),
        Field(label: 'Lavozim', controller: form.position, maxLength: 80),
        Field(label: 'Kompaniya', controller: form.company, maxLength: 80),
        Field(label: 'Shahar', controller: form.city, maxLength: 60),
        Field(
          label: 'Teglar',
          controller: form.tags,
          hint: 'sartarosh, chilonzor',
          help: 'Vergul bilan ajrating. Eng ko\'pi 5 ta.',
        ),

        const FormSection('ALOQA'),
        Field(
          label: 'Telefon',
          controller: form.phone,
          keyboardType: TextInputType.phone,
          hint: '+998 90 123 45 67',
        ),
        Field(
          label: 'Email',
          controller: form.email,
          keyboardType: TextInputType.emailAddress,
        ),

        const FormSection('HAVOLALAR'),
        Field(label: 'Telegram', controller: form.telegram, prefix: '@', hint: 'foydalanuvchi'),
        Field(label: 'Instagram', controller: form.instagram, prefix: '@', hint: 'foydalanuvchi'),
        Field(
          label: 'WhatsApp',
          controller: form.whatsapp,
          keyboardType: TextInputType.phone,
          hint: '+998 90 123 45 67',
        ),
        Field(
          label: 'Veb-sayt',
          controller: form.website,
          keyboardType: TextInputType.url,
          hint: 'example.uz',
        ),

        if (_problem != null) ...[
          const SizedBox(height: 4),
          Text(_problem!, style: const TextStyle(fontSize: 14, color: Color(0xFFB91C1C))),
          const SizedBox(height: 12),
        ],

        const SizedBox(height: 8),
        LimeButton(label: 'Saqlash', busy: _saving, onPressed: _save),
        const SizedBox(height: 12),
        Text(
          'Tarif: ${handle.isPremium ? 'Premium' : 'Bepul'}',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 12, color: Brand.black.withValues(alpha: 0.4)),
        ),
      ],
    );
  }
}
