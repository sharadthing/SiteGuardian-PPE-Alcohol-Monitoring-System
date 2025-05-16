import 'package:flutter/material.dart';
import 'accesscode-back.dart';
import 'signup_front.dart';

class AccessCodeScreen extends StatefulWidget {
  const AccessCodeScreen({super.key});

  @override
  _AccessCodeScreenState createState() => _AccessCodeScreenState();
}

class _AccessCodeScreenState extends State<AccessCodeScreen> {
  final TextEditingController accessCodeController = TextEditingController();
  bool isLoading = false;

  Future<void> _handleAccessCodeVerification() async {
    setState(() => isLoading = true);

    try {
      bool isValid = await verifyAccessCode(accessCodeController.text.trim());

      if (isValid) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => SignupScreen()),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Invalid Access Code!")),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error: ${e.toString()}")),
      );
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  void dispose() {
    accessCodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Access Code Verification'),
        backgroundColor: Colors.teal,
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextField(
              controller: accessCodeController,
              decoration: InputDecoration(
                labelText: 'Access Code',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.vpn_key),
              ),
            ),
            SizedBox(height: 20),
            isLoading
                ? CircularProgressIndicator()
                : ElevatedButton(
              onPressed: _handleAccessCodeVerification,
              child: Text('Verify'),
            ),
          ],
        ),
      ),
    );
  }
}