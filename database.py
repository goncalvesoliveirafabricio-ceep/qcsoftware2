import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Tratamento da senha com caracteres especiais
usuario = "fabricio"
senha_crua = "Myfab@123"
# O quote_plus transforma o "@" em "%40" para que a URL fique válida
senha_codificada = urllib.parse.quote_plus(senha_crua)
host = "129.121.46.237"
porta = "5432"
banco = "qcsoftware"

# 2. Montagem da URL formatada
SQLALCHEMY_DATABASE_URL = f"postgresql://{usuario}:{senha_codificada}@{host}:{porta}/{banco}"

# 3. Configuração do Engine e Sessão
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base (forma moderna para SQLAlchemy 2.0+)
Base = declarative_base()

# Dependência para obter a sessão do banco nas rotas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()