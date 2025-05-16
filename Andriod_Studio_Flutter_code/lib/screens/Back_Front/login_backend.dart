import 'dart:convert';
import 'package:http/http.dart' as http;

Future<bool> loginAdmin(String email, String password) async {
  try {
    final url = Uri.parse("http://192.168.0.28:5001/api/admin/login");
    final response = await http.post(
      url,
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"email": email, "password": password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['message'] == "Login successful";
    }
    return false;
  } catch (e) {
    throw Exception("Failed to login: ${e.toString()}");
  }
}