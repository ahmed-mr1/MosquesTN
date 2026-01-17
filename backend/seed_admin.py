from app import create_app, db
from app.models.user import User

app = create_app()

with app.app_context():
    print("Checking for admin user...")
    admin = User.query.filter_by(username="admin").first()
    if not admin:
        admin = User(username="admin", email="admin@mosques.tn", role="admin")
        db.session.add(admin)
        db.session.commit()
        print("Admin user created (username: admin). Password for login is 'admin123'")
    else:
        print("Admin user already exists.")
        admin.role = "admin" # Ensure role is admin
        db.session.commit()
