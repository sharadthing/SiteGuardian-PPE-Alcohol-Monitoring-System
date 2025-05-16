import 'dart:convert';
import 'package:http/http.dart' as http;

Future<bool> registerAdmin(
    String fullName,
    String email,
    String password,
    String retypePassword,
    String phoneNumber,
    bool termsAccepted,
    ) async {
  try {
    final url = Uri.parse("http://192.168.0.28:5001/api/admin/register");
    final response = await http.post(
      url,
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "full_name": fullName,
        "email": email,
        "password": password,
        "retype_password": retypePassword,
        "phone_number": phoneNumber,
        "terms_accepted": termsAccepted,
      }),
    );

    return response.statusCode == 201; // Success if status code is 201
  } catch (e) {
    throw Exception("Failed to register: ${e.toString()}");
  }
}