# scanner.py
import os
import hashlib
from mutagen import File as MutagenFile
from models import db, SFX, Tag
from sqlalchemy import select
from pathlib import Path, PureWindowsPath, PurePosixPath

AUDIO_EXTS = {".wav", ".mp3", ".flac", ".aiff", ".aif", ".m4a", ".ogg", ".opus"}


def _is_audio_file(path: Path):
    return path.suffix.lower() in AUDIO_EXTS


def compute_sha1(path: str, chunk_size=8192):
    h = hashlib.sha1()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def get_duration_seconds(path: str):
    try:
        f = MutagenFile(path)
        if f is None:
            return None
        length = getattr(f.info, "length", None)
        if length is None:
            return None
        return int(round(length))
    except Exception:
        return None


def extract_project_from_path(root_mount: str, filepath: str):
    # Expect pattern: <root_mount>/VA Videos/{project_name}/sfx/...
    # We assume project_name is the directory directly under VA Videos
    try:
        rel = os.path.relpath(filepath, root_mount)
        parts = rel.split(os.sep)
        # first part should be project name (or maybe subdirs). Find first non-empty
        if len(parts) >= 2:
            return parts[0]
        return None
    except Exception:
        return None


def scan_and_sync(app, root_mount: str):
    """
    Traverse root_mount, find case-insensitive 'sfx' directories, and index files.
    Also remove DB entries for deleted files.
    """
    with app.app_context():
        # Step 1: discover on-disk files
        found_paths = set()
        for dirpath, dirnames, filenames in os.walk(root_mount):
            # check if this directory itself is an 'sfx' folder (case-insensitive)
            if os.path.basename(dirpath).lower() != "sfx":
                continue
            for fname in filenames:
                path = os.path.join(dirpath, fname)
                p = Path(path)
                if not p.is_file():
                    continue
                if not _is_audio_file(p):
                    continue
                found_paths.add(os.path.abspath(path))
                stat = p.stat()
                mtime = stat.st_mtime
                size = stat.st_size
                sfx = SFX.query.filter_by(filepath=os.path.abspath(path)).first()
                if sfx is None:
                    # new file -> add
                    checksum = None
                    try:
                        checksum = compute_sha1(path)
                    except Exception:
                        checksum = None
                    duration = get_duration_seconds(path)
                    project = extract_project_from_path(root_mount, path)
                    file_path = os.path.abspath(path)
                    windows_path = str(PureWindowsPath(PurePosixPath(str(path)))).replace('\\data\\VA_Videos','M:\\Videos\\VA Videos')
                    sfx = SFX(
                        filename=fname,
                        filepath=os.path.abspath(path),
                        winpath = windows_path,
                        duration=duration,
                        checksum=checksum,
                        mtime=mtime,
                        project=project,
                    )
                    db.session.add(sfx)
                    app.logger.info(f"Added new sfx: {path}")
                else:
                    # existing: check if changed (mtime or size changed)
                    if sfx.mtime is None or abs(sfx.mtime - mtime) > 0.1:
                        # file changed -> update checksum/duration/mtime
                        checksum = None
                        try:
                            checksum = compute_sha1(path)
                        except Exception:
                            checksum = None
                        duration = get_duration_seconds(path)
                        sfx.duration = duration
                        sfx.checksum = checksum
                        sfx.mtime = mtime
                        app.logger.info(f"Updated sfx metadata: {path}")
                # continue to next file
        # Step 2: find DB rows whose files no longer exist and delete them
        all_db = SFX.query.all()
        db_paths = {os.path.abspath(s.filepath): s for s in all_db}
        for pth, sfx in db_paths.items():
            if pth not in found_paths:
                # file not found on disk -> delete
                app.logger.info(f"Removing SFX from DB because file missing: {pth}")
                db.session.delete(sfx)
        db.session.commit()
