from app import create_app
from app.extensions import db
from app.models.user import User

app = create_app()

with app.app_context():
    print('Checking for admin user...')
    admin = User.query.filter_by(username='admin').first()
    
    if not admin:
        print('Creating admin user...')
        admin = User(username='admin', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print('Admin user created. Credentials: admin / admin123')
    else:
        print('Admin user verified.')
        # Ensure password is set correctly (reset it just in case)
        admin.set_password('admin123')
        admin.role = 'admin'
        db.session.commit()
        print('Admin password reset to: admin123')

    # Also create a Moderator for testing
    mod = User.query.filter_by(username='moderator').first()
    if not mod:
         print('Creating moderator user...')
         mod = User(username='moderator', role='moderator')
         mod.set_password('mod123')
         db.session.add(mod)
         db.session.commit()
         print('Moderator created. Credentials: moderator / mod123')
