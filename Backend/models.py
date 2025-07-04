# import: database instance & password hashing utils
from database import db
from werkzeug.security import generate_password_hash, check_password_hash

# class: User model - represents a registered user
class User(db.Model):
    __tablename__ = 'users'

    # field: primary key ID
    id = db.Column(db.Integer, primary_key=True)

    # field: full name of user
    full_name = db.Column(db.String(100), nullable=False)

    # field: unique username
    username = db.Column(db.String(50), unique=True, nullable=False)

    # field: unique email
    email = db.Column(db.String(100), unique=True, nullable=False)

    # field: hashed password
    password_hash = db.Column(db.String(128), nullable=False)

    # method: hash & store password
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    # method: verify input password against hash
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)