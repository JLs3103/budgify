# run: flask backend for Smart Budget
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from database import init_db, db
from models import User

# init: create Flask app & enable CORS
app = Flask(__name__, static_folder='../Frontend', static_url_path='')
CORS(app)

# init: initialize database
init_db(app)

# route: serve static frontend at "/"
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

# route: POST /register - handle user registration
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    full_name = data.get('full_name')
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    confirm_password = data.get('confirm_password')

    # validate: check required fields
    if not all([full_name, username, email, password, confirm_password]):
        return jsonify({'message': 'All fields are required'}), 400

    # validate: check password rules
    if len(password) < 8:
        return jsonify({'message': 'Password must be at least 8 characters long'}), 400

    if password != confirm_password:
        return jsonify({'message': 'Passwords do not match'}), 400

    # validate: check uniqueness
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already exists'}), 409

    # create: new user and save
    user = User(full_name=full_name, username=username, email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

# route: POST /login - handle user login
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # validate: check input
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    # auth: verify user
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid email or password'}), 401

    # response: send user info
    return jsonify({
        'message': 'Login successful',
        'user': {
            'id': user.id,
            'full_name': user.full_name,
            'username': user.username,
            'email': user.email
        }
    }), 200

# run: start app on port 5000 (for Docker)
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)