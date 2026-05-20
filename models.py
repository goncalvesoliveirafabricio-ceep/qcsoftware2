from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, CheckConstraint, text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Cargo(Base):
    __tablename__ = "cargos"
    id_cargos = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    data_criacao = Column(DateTime(timezone=True), server_default=func.now())
    data_atualizacao = Column(DateTime(timezone=True), onupdate=func.now())
    ativo = Column(Boolean, default=True)

class Produto(Base):
    __tablename__ = "produtos"
    id_produtos = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    categoria = Column(String(100), nullable=False)
    ativo = Column(Boolean, default=True)

class Maquina(Base):
    __tablename__ = "maquinas"
    id_maquinas = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    ativo = Column(Boolean, default=True)

class Tela(Base):
    __tablename__ = "telas"
    id_telas = Column(Integer, primary_key=True, index=True)
    nome = Column(String(50), nullable=False)

class Perfil(Base):
    __tablename__ = "perfis"
    id_perfis = Column(Integer, primary_key=True, index=True)
    nome = Column(String(50), nullable=False)

class Colaborador(Base):
    __tablename__ = "colaboradores"
    id_colaboradores = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    matricula = Column(Integer, nullable=False)
    id_cargos = Column(Integer, ForeignKey("cargos.id_cargos"))
    email = Column(String(100), unique=True)
    ativo = Column(Boolean, default=True)

class Usuario(Base):
    __tablename__ = "usuarios"
    id_usuarios = Column(Integer, primary_key=True, index=True)
    usuario = Column(String(100), nullable=False)
    id_colaboradores = Column(Integer, ForeignKey("colaboradores.id_colaboradores"))
    id_perfis = Column(Integer, ForeignKey("perfis.id_perfis"))
    email = Column(String(100), unique=True)
    senha_hash = Column(String(255), nullable=False)

class Permissao(Base):
    __tablename__ = "permissoes"
    id_permissoes = Column(Integer, primary_key=True, index=True)
    id_perfis = Column(Integer, ForeignKey("perfis.id_perfis"))
    id_telas = Column(Integer, ForeignKey("telas.id_telas"))
    visualizar = Column(Boolean, default=False)
    inserir = Column(Boolean, default=False)
    alterar = Column(Boolean, default=False)
    excluir = Column(Boolean, default=False)

class Ocorrencia(Base):
    __tablename__ = "ocorrencias"
    
    # --- Chave Primária Composta (PK) e Chaves Estrangeiras (FK) ---
    data_ocorrencias = Column(DateTime(timezone=True), primary_key=True, server_default=text("CURRENT_TIMESTAMP"))
    id_maquinas = Column(Integer, ForeignKey("maquinas.id_maquinas"), primary_key=True)
    id_colaboradores = Column(Integer, ForeignKey("colaboradores.id_colaboradores"), primary_key=True)
    id_produtos = Column(Integer, ForeignKey("produtos.id_produtos"), primary_key=True)
    
    # --- Outros Campos ---
    lote_produtos = Column(String(255), nullable=False)
    numero_nota = Column(Integer, nullable=False)
    problema = Column(String(255), nullable=False)
    falha_onde = Column(String(255), nullable=False)
    falha_como = Column(String(255), nullable=False)
    falha_quando = Column(String(255), nullable=False)
    falha_quem = Column(String(255), nullable=False)
    observacoes = Column(String(1000), nullable=False)
    acao_corretiva = Column(String(255), nullable=False)
    data_prazo = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    situacao = Column(String(20), default="Pendente", nullable=False)
    foto = Column(String(255), nullable=True)
    
    # --- Timestamps de Controle ---
    data_criacao = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    data_atualizacao = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))
    
    # --- Restrições da Tabela ---
    __table_args__ = (
        CheckConstraint("situacao IN ('Pendente', 'Em andamento', 'Em análise', 'Concluído')", name="chk_situacao"),
    )