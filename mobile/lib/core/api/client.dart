import 'package:dio/dio.dart';

import '../config.dart';
import '../session.dart';
import 'errors.dart';

/// The one way this app talks to the backend.
///
/// Everything goes through here so that three things are decided once: the
/// token is attached, the answer is turned into either data or an
/// [ApiException], and nothing carrying a token or a person's details is ever
/// printed.
class ApiClient {
  ApiClient(this._session, {Dio? dio}) : _dio = dio ?? Dio() {
    _dio.options = BaseOptions(
      baseUrl: '${Config.apiBaseUrl}${Config.apiPrefix}',
      // A phone is on a mobile network more often than not, and a request with
      // no deadline is a spinner that never stops.
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 20),
      sendTimeout: const Duration(seconds: 20),
      contentType: Headers.jsonContentType,
      // Every status is accepted here and judged in `_failure` below, so that
      // a 404 is a case the code handles rather than an exception thrown from
      // inside the transport.
      validateStatus: (_) => true,
    );

    _dio.interceptors.add(
      InterceptorsWrapper(onRequest: (options, handler) async {
        final token = await _session.read();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      }),
    );
  }

  final Dio _dio;
  final SessionStore _session;

  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? query}) =>
      _send(() => _dio.get<Map<String, dynamic>>(path, queryParameters: query));

  Future<Map<String, dynamic>> post(String path, {Object? body}) =>
      _send(() => _dio.post<Map<String, dynamic>>(path, data: body));

  Future<Map<String, dynamic>> put(String path, {Object? body}) =>
      _send(() => _dio.put<Map<String, dynamic>>(path, data: body));

  Future<Map<String, dynamic>> delete(String path) =>
      _send(() => _dio.delete<Map<String, dynamic>>(path));

  /// Runs a request and returns its body, or throws an [ApiException].
  Future<Map<String, dynamic>> _send(
    Future<Response<Map<String, dynamic>>> Function() request,
  ) async {
    final Response<Map<String, dynamic>> response;
    try {
      response = await request();
    } on DioException catch (error) {
      // Deliberately not inspecting the error further. A connection that failed
      // failed; which layer of the stack noticed is of no use to the person
      // holding the phone, and the object carries the whole request with it.
      throw error.type == DioExceptionType.badCertificate
          ? ApiException.server
          : ApiException.offline;
    }

    final status = response.statusCode ?? 0;
    if (status >= 200 && status < 300) {
      return response.data ?? const {};
    }

    throw _failure(status, response.data);
  }

  ApiException _failure(int status, Map<String, dynamic>? body) {
    // The API answers errors as RFC 9457 problem details; `detail` is the
    // sentence it wrote for a person, already in Uzbek.
    final detail = body?['detail'];
    final message = detail is String && detail.isNotEmpty ? detail : null;

    return switch (status) {
      401 => ApiException(ApiFailure.unauthorized, message ?? 'Avval hisobingizga kiring.'),
      403 || 404 => ApiException(ApiFailure.notFound, message ?? 'Topilmadi.'),
      422 => ApiException(ApiFailure.rejected, message ?? 'Ma\'lumot noto\'g\'ri.'),
      429 => ApiException(ApiFailure.tooMany, message ?? 'Juda ko\'p urinish. Biroz kuting.'),
      // Anything else, including a 500: the server's own words are not shown,
      // because a message written for a log can name a host or a query.
      _ => ApiException.server,
    };
  }
}
