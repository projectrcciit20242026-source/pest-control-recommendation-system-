from sqlalchemy import create_engine, Column, Integer, String, Float, Text, ARRAY, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ─────────────────────────────────────────
# ORM MODELS
# ─────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name       = Column(String(100), nullable=False)
    phone      = Column(String(15),  unique=True, nullable=False, index=True)
    password   = Column(String(255), nullable=False)
    language   = Column(String(20),  default='english')
    created_at = Column(TIMESTAMP,   server_default=func.now())


class ScanResult(Base):
    __tablename__ = "scan_results"

    id                = Column(Integer, primary_key=True, index=True)
    user_id           = Column(UUID(as_uuid=True), nullable=False, index=True)
    pest_name         = Column(String(100), nullable=False)
    confidence_pct    = Column(Float,   nullable=False)
    description       = Column(Text,    nullable=True)
    prevention_method = Column(Text,    nullable=True)
    pesticides        = Column(ARRAY(String), nullable=True)
    image_base64      = Column(Text,    nullable=True)
    language          = Column(String(20), default='english')
    scanned_at        = Column(TIMESTAMP, server_default=func.now())


# Create all tables on startup
def init_db():
    Base.metadata.create_all(bind=engine)
    print("✅ PostgreSQL tables ready: users, scan_results")


# FastAPI dependency — provides a DB session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
