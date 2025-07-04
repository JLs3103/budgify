# init: setup SQLAlchemy instance
from flask_sqlalchemy import SQLAlchemy

# init: create db object (global)
db = SQLAlchemy()

# func: bind db to Flask app & create tables
def init_db(app):
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)

    # run: create all tables within app context
    with app.app_context():
        db.create_all()