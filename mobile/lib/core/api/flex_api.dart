import '../models/handle.dart';
import '../models/lead.dart';
import '../models/purchase.dart';
import '../models/stats.dart';
import 'client.dart';

/// Every call this app makes, named after what it is for.
///
/// A thin layer on purpose: it turns a path and a body into a model and does
/// nothing else. Anything that decides — who owns what, what a plan allows,
/// whether a link is safe to render — is decided on the server, because this
/// file ships inside an app anybody can download and read.
class FlexApi {
  const FlexApi(this._client);

  final ApiClient _client;

  // Kirish -------------------------------------------------------------------

  /// Sends a six-digit code to a phone.
  ///
  /// The answer is the same whether the number has an account or not — an
  /// endpoint that says "no such account" is an endpoint that tells a stranger
  /// which numbers are worth attacking. A number with no account gets one.
  /// Returns the code itself when the backend is a development one with no SMS
  /// provider, and an empty string every other time. A production server never
  /// puts it in the body, so there is nothing here to switch off later.
  Future<String> requestCode(String phone) async {
    final body = await _client.post('/kirish/telefon', body: {'telefon': phone});
    return body['kod'] as String? ?? '';
  }

  /// Trades the code for a session, and says who it belongs to.
  ///
  /// The token is returned in the body rather than only as a cookie: this is
  /// an app, not a browser, and it keeps the token in the phone's keystore.
  Future<String> confirmCode(String phone, String code) async {
    final body = await _client.post(
      '/kirish/telefon/tasdiq',
      body: {'telefon': phone, 'kod': code},
    );
    return body['token'] as String? ?? '';
  }

  /// Spends a sign-in link. Kept for the address that arrives from a browser —
  /// the website still signs people in this way, and a person who started
  /// there lands in the app through a deep link.
  Future<String> confirmLink(String token) async {
    final body = await _client.post('/kirish/tasdiq', body: {'token': token});
    return body['token'] as String? ?? '';
  }

  Future<String> whoAmI() async {
    final body = await _client.get('/men');
    final account = body['account'] as Map<String, dynamic>? ?? const {};
    return account['email'] as String? ?? '';
  }

  Future<void> signOut() => _client.post('/chiqish');

  // Raqamlar -----------------------------------------------------------------

  Future<List<Handle>> myNumbers() async {
    final body = await _client.get('/raqamlar');
    return (body['raqamlar'] as List? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(Handle.fromJson)
        .toList();
  }

  Future<Handle> number(String number) async {
    final body = await _client.get('/raqamlar/$number');
    return Handle.fromJson(body['raqam'] as Map<String, dynamic>? ?? const {});
  }

  /// Saves a profile. The body is passed through as the form built it — the
  /// server rebuilds every link from validated parts and refuses what it
  /// cannot, so there is nothing useful to check twice here.
  Future<Handle> saveProfile(String number, Map<String, dynamic> profile) async {
    final body = await _client.put('/raqamlar/$number/profil', body: profile);
    return Handle.fromJson(body['raqam'] as Map<String, dynamic>? ?? const {});
  }

  // Vizitkalar ---------------------------------------------------------------

  Future<List<Lead>> leads(String number) async {
    final body = await _client.get('/raqamlar/$number/vizitkalar');
    return (body['vizitkalar'] as List? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(Lead.fromJson)
        .toList();
  }

  Future<void> deleteLead(String number, int id) =>
      _client.delete('/raqamlar/$number/vizitkalar/$id');

  // Statistika ---------------------------------------------------------------

  Future<Stats> stats(String number, {int days = 30}) async {
    final body = await _client.get(
      '/raqamlar/$number/statistika',
      query: {'kun': days},
    );
    return Stats.fromJson(body['hisobot'] as Map<String, dynamic>? ?? const {});
  }

  // Sotib olish ---------------------------------------------------------------

  /// What a number costs, and whether anybody has it. No session needed — the
  /// whole product is somebody trying a number and being told.
  Future<NumberState> check(String number) async {
    final body = await _client.get('/qidirish/$number');
    return NumberState.fromJson(body);
  }

  /// Takes a number off the market for thirty minutes and opens an order.
  Future<Order> buy(String number, String name) async {
    final body = await _client.post('/qidirish/$number/olish', body: {'ism': name});
    return Order.fromJson(body['buyurtma'] as Map<String, dynamic>? ?? const {});
  }

  /// Whether an order has been paid. Asked again after the buyer comes back
  /// from a provider's page, because the confirmation reaches the server on a
  /// callback rather than through the phone.
  Future<Order> order(String id) async {
    final body = await _client.get('/buyurtmalar/$id');
    return Order.fromJson(body['buyurtma'] as Map<String, dynamic>? ?? const {});
  }
}
