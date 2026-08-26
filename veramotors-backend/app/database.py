import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DATABASE_URL = "postgresql://neondb_owner:npg_MW4vrUV1ulJe@ep-lively-truth-axkoj14j-pooler.c-4.us-east-2.aws.neon.tech/veramotors?sslmode=require"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True  
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()