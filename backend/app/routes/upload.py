import os
import uuid
from flask import request, current_app, url_for, send_from_directory
from flask_smorest import Blueprint, abort
from werkzeug.utils import secure_filename
from azure.storage.blob import BlobServiceClient, ContentSettings

# Use flask_smorest Blueprint to support API documentation arguments like 'description'
upload_bp = Blueprint("upload", __name__, url_prefix="/uploads", description="File uploads")

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def get_azure_client():
    """Helper to get the Blob Service Client using the connection string."""
    connect_str = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
    if not connect_str:
        return None
    return BlobServiceClient.from_connection_string(connect_str)

@upload_bp.route("", methods=["POST"])
def upload_file():
    # 1. Validate File Existence
    if "file" not in request.files:
        abort(400, message="No file part in request")
    
    file = request.files["file"]
    
    if file.filename == "":
        abort(400, message="No selected file")
        
    if not allowed_file(file.filename):
        abort(400, message="File type not allowed. Use: png, jpg, jpeg, gif, webp")

    # 2. Prepare Filename
    ext = file.filename.rsplit(".", 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    content_type = file.content_type  # e.g., 'image/jpeg'

    # 3. Check for Azure Configuration
    connection_string = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
    container_name = os.getenv('AZURE_CONTAINER_NAME', 'mosque-images')

    if connection_string:
        # --- PATH A: UPLOAD TO AZURE BLOB STORAGE (PROFESSIONAL) ---
        try:
            blob_service_client = BlobServiceClient.from_connection_string(connection_string)
            
            # Ensure container exists
            container_client = blob_service_client.get_container_client(container_name)
            if not container_client.exists():
                container_client.create_container(public_access="blob")

            # Upload the file
            blob_client = blob_service_client.get_blob_client(container=container_name, blob=unique_name)
            
            # Reset file pointer to beginning before upload
            file.seek(0)
            blob_client.upload_blob(
                file, 
                blob_type="BlockBlob", 
                content_settings=ContentSettings(content_type=content_type)
            )

            # Return the direct public URL
            return {"url": blob_client.url}, 201

        except Exception as e:
            current_app.logger.error(f"Azure Upload Error: {str(e)}")
            current_app.logger.info("Azure upload failed. Falling back to local storage.")
            # Do NOT return/abort here; allow flow to proceed to Path B (Local Fallback)
            pass

    # --- PATH B: UPLOAD TO LOCAL STORAGE (FALLBACK/DEV) ---
    # Note: Files here disappear on Azure redeployment!
    local_folder = os.path.join(os.getcwd(), "uploads")
    os.makedirs(local_folder, exist_ok=True)
    
    file_path = os.path.join(local_folder, unique_name)
    file.seek(0)
    file.save(file_path)
    
    # Generate local URL
    file_url = url_for("upload.serve_file", filename=unique_name, _external=True)
    return {"url": file_url}, 201

@upload_bp.route("/<path:filename>", methods=["GET"])
def serve_file(filename):
    """Serve local files (only used if Azure is not configured)."""
    local_folder = os.path.join(os.getcwd(), "uploads")
    return send_from_directory(local_folder, filename)