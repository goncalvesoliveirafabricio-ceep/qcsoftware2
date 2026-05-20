import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Nova URL de conexão do Neon PostgreSQL
# A string já vem configurada com pooler, SSL e channel binding obrigatórios
SQLALCHEMY_DATABASE_URL = "postgresql://neondb_owner:npg_RibO1T8uQqNS@ep-flat-night-ap3lna17-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# 2. Configuração do Engine e Sessão
# O SQLAlchemy processa perfeitamente os parâmetros de query string (?sslmode=...) passados na URL
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base (forma moderna para SQLAlchemy 2.0+)
Base = declarative_base()

# Dependência para obter a sessão do banco nas rotas do FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()