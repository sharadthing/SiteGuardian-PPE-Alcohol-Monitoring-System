from flask import Flask, render_template, redirect, url_for, request # Import necessary modules

def create_app():
    app = Flask(__name__)
    
    # Imports and registers blueprints
    # This imports the worker blueprint from routes_logic.py and registers it with the app
    from routes_logic import worker_bp
    app.register_blueprint(worker_bp)
    
    @app.route('/') # Home route
    def home():
        # This route renders the home page (index.html)
        return render_template('index.html') # Render the home page
    
    @app.route('/clock') # Clock route
    def clock():
        # This route handles the clock-in and clock-out page
        worker_id = request.args.get('worker_id') # Get worker ID from query parameters
        name = request.args.get('name') # Get worker name from query parameters
        if not worker_id or not name:
            # Redirect to the home page if worker ID or name is missing
            return redirect(url_for('home'))
        # Render the clock page with the worker ID and name
        return render_template('clock.html', worker_id=worker_id, name=name) # Render the clock page with worker ID and name
    
    @app.route('/scan') # Scan route
    def scan():
        # This route handles the PPE scan page
        worker_id = request.args.get('worker_id') # Get worker ID from query parameters
        if not worker_id:
            # Redirect to the home page if worker ID is missing
            return redirect(url_for('home'))
        # Render the scan page with the worker ID
        return render_template('scan.html', worker_id=worker_id) # Render the scan page with worker ID
    
    @app.route('/success') # Success route
    def success():
        # This route handles the success page after PPE compliance is confirmed
        worker_id = request.args.get('worker_id') # Get worker ID from query parameters
        # Render the success page with the worker ID
        return render_template('success.html', worker_id=worker_id) # Render the success page with worker ID
    
    @app.route('/alcohol') # Alcohol route
    def alcohol_monitor(): 
        # This route handles the alcohol monitoring page
        return render_template('alcohol.html') # Render the alcohol monitoring page
    
    return app

if __name__ == '__main__':
    # This block runs the Flask app when the script is executed directly
    app = create_app() # Create the Flask app instance
    app.run(host='0.0.0.0', port=5000, debug=True) # Run the Flask app on port 5000 on all interfaces