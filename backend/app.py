import os
from flask import Flask, jsonify, request, abort, send_file
from flask_cors import CORS
from models import db, SFX, Tag
from scanner import scan_and_sync
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

DB_PATH = os.environ.get("DB_PATH", "data/sfx.db")
ROOT_MOUNT = os.environ.get("VA_ROOT", "/data/VA_Videos")  # default in-container mount
SCAN_INTERVAL_SECONDS = int(os.environ.get("SCAN_INTERVAL_SECONDS", "60"))

def create_app():
    app = Flask(__name__)
    
    # Enable CORS with more permissive settings
    CORS(app, 
         resources={r"/api/*": {"origins": "*"}},
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "Content-Disposition", "Content-Length"],
         expose_headers=["Content-Disposition", "Content-Type", "Content-Length"],
         methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
    )
    
    # Additional CORS headers middleware
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Content-Disposition,Content-Length')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
        response.headers.add('Access-Control-Expose-Headers', 'Content-Disposition,Content-Type,Content-Length')
        return response
    
    
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)
    with app.app_context():
        db.create_all()

    # Basic health route
    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "root_mount": ROOT_MOUNT})

    # Search/list endpoint
    @app.route("/api/files", methods=["GET"])
    def list_files():
        q = request.args.get("q", "").strip()
        tags = request.args.get("tags", "").strip()
        project = request.args.get("project", "").strip()

        query = SFX.query
        if q:
            ilike_q = f"%{q}%"
            query = query.filter(
                (SFX.filename.ilike(ilike_q)) | (SFX.notes.ilike(ilike_q)) | (SFX.project.ilike(ilike_q))
            )
        if project:
            query = query.filter(SFX.project == project)
        if tags:
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]
            if tag_list:
                # inner join tags
                query = query.join(SFX.tags).filter(Tag.name.in_(tag_list)).group_by(SFX.id)

        results = query.order_by(SFX.filename).limit(1000).all()
        return jsonify([r.to_dict() for r in results])

    @app.route("/api/files/<int:sfx_id>", methods=["GET"])
    def get_file(sfx_id):
        s = SFX.query.get_or_404(sfx_id)
        return jsonify(s.to_dict())

    @app.route("/api/files/<int:sfx_id>/notes", methods=["PATCH"])
    def update_notes(sfx_id):
        s = SFX.query.get_or_404(sfx_id)
        data = request.json or {}
        notes = data.get("notes")
        if notes is None:
            return abort(400, "notes required in JSON body")
        s.notes = notes
        db.session.commit()
        return jsonify(s.to_dict())

    @app.route("/api/files/<int:sfx_id>/tags", methods=["POST"])
    def add_tags(sfx_id):
        s = SFX.query.get_or_404(sfx_id)
        data = request.json or {}
        tag_names = data.get("tags", [])
        if not isinstance(tag_names, list):
            return abort(400, "tags must be a list of strings")
        for tname in tag_names:
            tname = tname.strip()
            if not tname:
                continue
            tag = Tag.query.filter_by(name=tname).first()
            if not tag:
                tag = Tag(name=tname)
                db.session.add(tag)
            if tag not in s.tags:
                s.tags.append(tag)
        db.session.commit()
        return jsonify(s.to_dict())

    @app.route("/api/files/<int:sfx_id>/tags", methods=["DELETE"])
    def remove_tags(sfx_id):
        s = SFX.query.get_or_404(sfx_id)
        data = request.json or {}
        tag_names = data.get("tags", [])
        if not isinstance(tag_names, list):
            return abort(400, "tags must be a list of strings")
        for tname in tag_names:
            tag = Tag.query.filter_by(name=tname.strip()).first()
            if tag and tag in s.tags:
                s.tags.remove(tag)
        db.session.commit()
        return jsonify(s.to_dict())

    @app.route("/api/scan_now", methods=["POST"])
    def scan_now():
        scan_and_sync(app, ROOT_MOUNT)
        return jsonify({"status": "scanned"})

    @app.route('/api/audio/<int:sfx_id>')
    def serve_audio(sfx_id):
        """
        Serve audio files with proper headers for drag-and-drop support
        """
        s = SFX.query.get_or_404(sfx_id)
        file_path = Path(s.filepath)

        if not file_path.exists():
            return {"error": "File not found"}, 404

        # Determine MIME type based on extension
        extension = file_path.suffix.lower()
        mime_types = {
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg',
            '.ogg': 'audio/ogg',
            '.flac': 'audio/flac',
            '.m4a': 'audio/mp4',
            '.aac': 'audio/aac',
        }
        mime_type = mime_types.get(extension, 'audio/mpeg')

        # Send file with proper headers
        return send_file(
            file_path,
            mimetype=mime_type,
            as_attachment=False,  # Set to True if you want force download
            download_name=s.filename
        )

    @app.route('/api/audio/<int:sfx_id>/download')
    def download_audio(sfx_id):
        """
        Alternative endpoint for forced download
        """
        s = SFX.query.get_or_404(sfx_id)
        file_path = Path(s.filepath)

        if not file_path.exists():
            return {"error": "File not found"}, 404

        extension = file_path.suffix.lower()
        mime_types = {
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg',
            '.ogg': 'audio/ogg',
            '.flac': 'audio/flac',
            '.m4a': 'audio/mp4',
            '.aac': 'audio/aac',
        }
        mime_type = mime_types.get(extension, 'audio/mpeg')

        return send_file(
            file_path,
            mimetype=mime_type,
            as_attachment=True,
            download_name=s.filename
        )    
    return app

if __name__ == "__main__":
    app = create_app()

    # kick off periodic scan
    scheduler = BackgroundScheduler()
    scheduler.add_job(lambda: scan_and_sync(app, ROOT_MOUNT), "interval", seconds=SCAN_INTERVAL_SECONDS, id="sfx_scanner", replace_existing=True)
    scheduler.start()

    # run initial scan at startup
    app.logger.info(f"Performing initial scan of {ROOT_MOUNT}")
    scan_and_sync(app, ROOT_MOUNT)

    # run Flask
    app.run(host="0.0.0.0", debug=True, port=int(os.environ.get("PORT", "5000")))