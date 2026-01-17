#!/bin/bash
# 1. Move to the app directory
cd /home/site/wwwroot

# 2. Set the Flask App entry point
export FLASK_APP=wsgi.py

# 3. Run the database upgrade automatically
# We use the full path to ensure it finds the 'db' command
antenv/bin/python -m flask db upgrade

# 4. Run your admin reset script
antenv/bin/python reset_admin.py

echo "Deployment tasks completed successfully!"