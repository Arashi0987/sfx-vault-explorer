# models.py
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

sfx_tag = db.Table(
    "sfx_tag",
    db.Column("sfx_id", db.Integer, db.ForeignKey("sfx.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tag.id"), primary_key=True),
)


class SFX(db.Model):
    __tablename__ = "sfx"
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String, nullable=False)
    filepath = db.Column(db.String, unique=True, nullable=False, index=True)  # absolute
    duration = db.Column(db.Integer, nullable=True)  # seconds
    notes = db.Column(db.Text, nullable=True)
    checksum = db.Column(db.String(64), nullable=True)  # sha1 hex
    mtime = db.Column(db.Float, nullable=True)  # epoch mtime
    project = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tags = db.relationship("Tag", secondary=sfx_tag, back_populates="sfxs")

    def length_mmss(self):
        if self.duration is None:
            return None
        m = int(self.duration) // 60
        s = int(self.duration) % 60
        return f"{m:02d}:{s:02d}"

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "filepath": self.filepath,
            "duration_seconds": self.duration,
            "length": self.length_mmss(),
            "tags": [t.name for t in self.tags],
            "notes": self.notes,
            "project": self.project,
            "checksum": self.checksum,
            "mtime": self.mtime,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Tag(db.Model):
    __tablename__ = "tag"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False, index=True)

    sfxs = db.relationship("SFX", secondary=sfx_tag, back_populates="tags")

    def to_dict(self):
        return {"id": self.id, "name": self.name}
