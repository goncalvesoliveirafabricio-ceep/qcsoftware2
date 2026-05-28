from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List
from datetime import datetime

# --- MIXINS PARA REUTILIZAÇÃO ---
class TimestampMixin(BaseModel):
    data_criacao: Optional[datetime] = None
    data_atualizacao: Optional[datetime] = None
    ativo: Optional[bool] = True

    class Config:
        from_attributes = True

# --- CARGOS ---
class CargoBase(BaseModel):
    nome: str

class CargoCreate(CargoBase):
    pass

class CargoUpdate(BaseModel):
    nome: Optional[str] = None
    ativo: Optional[bool] = None

class Cargo(CargoBase, TimestampMixin):
    id_cargos: int

# --- PRODUTOS ---
class ProdutoBase(BaseModel):
    nome: str
    categoria: str

class ProdutoCreate(ProdutoBase):
    pass

class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    categoria: Optional[str] = None
    ativo: Optional[bool] = None

class Produto(ProdutoBase, TimestampMixin):
    id_produtos: int

# --- MÁQUINAS ---
class MaquinaBase(BaseModel):
    nome: str

class MaquinaCreate(MaquinaBase):
    pass

class MaquinaUpdate(BaseModel):
    nome: Optional[str] = None
    ativo: Optional[bool] = None

class Maquina(MaquinaBase, TimestampMixin):
    id_maquinas: int

# --- TELAS ---
class TelaBase(BaseModel):
    nome: str

class TelaCreate(TelaBase):
    pass

class TelaUpdate(BaseModel):
    nome: Optional[str] = None
    ativo: Optional[bool] = None

class Tela(TelaBase, TimestampMixin):
    id_telas: int

# --- PERFIS ---
class PerfilBase(BaseModel):
    nome: str

class PerfilCreate(PerfilBase):
    pass

class PerfilUpdate(BaseModel):
    nome: Optional[str] = None
    ativo: Optional[bool] = None

class Perfil(PerfilBase, TimestampMixin):
    id_perfis: int

# --- COLABORADORES ---
class ColaboradorBase(BaseModel):
    nome: str
    matricula: int
    id_cargos: int
    email: Optional[EmailStr] = None
    ativo: Optional[bool] = True # <--- Adicione aqui com valor padrão True

class ColaboradorCreate(ColaboradorBase):
    pass

class ColaboradorUpdate(BaseModel):
    nome: Optional[str] = None
    matricula: Optional[int] = None
    id_cargos: Optional[int] = None
    email: Optional[EmailStr] = None
    ativo: Optional[bool] = None

# --- USUÁRIOS ---
class UsuarioBase(BaseModel):
    usuario: str
    id_colaboradores: int
    id_perfis: int
    email: Optional[EmailStr] = None

class UsuarioCreate(UsuarioBase):
    senha_hash: str 

class UsuarioUpdate(BaseModel):
    usuario: Optional[str] = None
    id_perfis: Optional[int] = None
    email: Optional[EmailStr] = None
    senha_hash: Optional[str] = None
    ativo: Optional[bool] = None

class Usuario(UsuarioBase, TimestampMixin):
    id_usuarios: int

# --- PERMISSÕES ---
class PermissaoBase(BaseModel):
    id_perfis: int
    id_telas: int
    visualizar: bool
    inserir: bool
    alterar: bool
    excluir: bool

class PermissaoCreate(PermissaoBase):
    pass

class PermissaoUpdate(BaseModel):
    id_perfis: Optional[int] = None
    id_telas: Optional[int] = None
    visualizar: Optional[bool] = None
    inserir: Optional[bool] = None
    alterar: Optional[bool] = None
    excluir: Optional[bool] = None
    ativo: Optional[bool] = None

class Permissao(PermissaoBase, TimestampMixin):
    id_permissoes: int

# --- OCORRÊNCIAS ---

class OcorrenciaBase(BaseModel):
    # Campos comuns com valores opcionais ou padrões
    lote_produtos: Optional[str] = None
    numero_nota: Optional[int] = None
    problema: Optional[str] = None 
    falha_onde: Optional[str] = None
    falha_como: Optional[str] = None
    falha_quando: Optional[str] = None
    falha_quem: Optional[str] = None
    observacoes: Optional[str] = None
    acao_corretiva: Optional[str] = None
    situacao: Optional[str] = "Pendente"
    foto: Optional[str] = None
    data_prazo: Optional[datetime] = None

class OcorrenciaCreate(OcorrenciaBase):
    # Na criação, as chaves primárias compostas NÃO podem ser nulas (exceto a data que gera automática se omitida)
    id_maquinas: int
    id_colaboradores: int
    id_produtos: int
    data_ocorrencias: Optional[datetime] = None  # Opcional aqui pois o banco gera o DEFAULT se não enviado
    
    # Tornando campos obrigatórios na criação conforme o seu script SQL
    lote_produtos: str
    numero_nota: int
    problema: str
    falha_onde: str
    falha_como: str
    falha_quando: str
    falha_quem: str
    observacoes: str
    acao_corretiva: str

class OcorrenciaUpdate(OcorrenciaBase):
    # No Update, todos os campos da base continuam opcionais. 
    # Geralmente não alteramos os IDs da chave primária em um update.
    pass

class Ocorrencia(OcorrenciaBase):
    # Esquema de resposta completa (Output) que a API retorna
    data_ocorrencias: datetime
    id_maquinas: int
    id_colaboradores: int
    id_produtos: int
    
    # Timestamps de controle retornados pelo banco
    data_criacao: datetime
    data_atualizacao: datetime

    # Configuração do Pydantic v2 para ler dados do ORM (SQLAlchemy)
    model_config = ConfigDict(from_attributes=True)