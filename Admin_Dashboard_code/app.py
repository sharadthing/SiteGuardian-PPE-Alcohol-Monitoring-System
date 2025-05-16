from flask import Flask, render_template
from flask_cors import CORS
from routes import bp as routes_bp
import socket

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Register Blueprint
app.register_blueprint(routes_bp, url_prefix='/api')

@app.route('/')
def index():
    return render_template('index.html')

# Run the Flask application
if __name__ == "__main__":
    try:
        # Get the local IP address of your machine
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)

        # Run on all interfaces (0.0.0.0) or specific local IP if needed
        app.run(host='0.0.0.0', port=5001, debug=True)
        # OR if you want to bind directly to local IP:
        # app.run(host=local_ip, port=5000, debug=True)
    except Exception as e:
        print(f"Error running the app: {str(e)}")
