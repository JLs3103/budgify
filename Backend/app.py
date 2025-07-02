from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from database import init_db, db
from models import User

app = Flask(__name__, static_folder='../Frontend', static_url_path='')
CORS(app)  # Izinkan frontend mengakses API dari browser

# Inisialisasi database
init_db(app)

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    full_name = data.get('full_name')
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # Validasi input
    if not all([full_name, username, email, password]):
        return jsonify({'message': 'All fields are required'}), 400

    # Cek apakah email/username sudah terdaftar
    if User.query.filter((User.email == email) | (User.username == username)).first():
        return jsonify({'message': 'Email or username already exists'}), 409

    # Simpan user baru
    user = User(full_name=full_name, username=username, email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Validasi input
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid email or password'}), 401

    return jsonify({'message': 'Login successful', 'user': {
        'id': user.id,
        'full_name': user.full_name,
        'username': user.username,
        'email': user.email
    }}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)