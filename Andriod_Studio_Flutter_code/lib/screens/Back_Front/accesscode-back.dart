import 'dart:convert';
import 'package:http/http.dart' as http;

Future<bool> verifyAccessCode(String accessCode) async {
  try {
    final url = Uri.parse("http://192.168.0.28:5001/api/validate-access-code");
    final response = await http.post(
      url,
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"access_code": accessCode}),
    );

    // Handle response based on status code only
    if (response.statusCode == 200) {
      return true; // Access code is valid
    }
    return false; // Access code is invalid
  } catch (e) {
    throw Exception("Failed to validate access code: ${e.toString()}");
  }
}