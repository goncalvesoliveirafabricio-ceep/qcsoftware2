from pydantic import BaseModel, ConfigDict
from typing import Optional, Any

# --- MIXIN COM TOLERÂNCIA TOTAL A DIVERGÊNCIAS ---
class SafeModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")

class TimestampMixin(SafeModel):
    data_criacao: Optional[Any] = None
    data_atualizacao: Optional[Any] = None
    ativo: Optional[Any] = True

# --- CARGOS ---
class CargoBase(SafeModel):
    nome: str

class CargoCreate(CargoBase):
    pass

class CargoUpdate(SafeModel):
    nome: Optional[str] = None
    ativo: Optional[bool] = None

class Cargo(CargoBase, TimestampMixin):
    id_cargos: int

# --- PRODUTOS ---
class ProdutoBase(SafeModel):
    nome: str
    categoria: str

class ProdutoCreate(ProdutoBase):
    pass

class ProdutoUpdate(SafeModel):
    nome: Optional[str] = None
    categoria: Optional[str] = None
    ativo: Optional[bool] = None

class Produto(ProdutoBase, TimestampMixin):
    id_produtos: int

# --- MÁQUINAS ---
class MaquinaBase(SafeModel):
    nome: str

class MaquinaCreate(MaquinaBase):
    pass

class MaquinaUpdate(SafeModel):
    nome: Optional[str] = None
    ativo: Optional[bool] = None

class Maquina(MaquinaBase, TimestampMixin):
    id_maquinas: int

# --- TELAS ---
class TelaBase(SafeModel):
    nome: str

class TelaCreate(TelaBase):
    pass

class TelaUpdate(SafeModel):
    nome: Optional[str] = None
    ativo: Optional[bool] = None

class Tela(TelaBase, TimestampMixin):
    id_telas: int

# --- PERFIS ---
class PerfilBase(SafeModel):
    nome: str

class PerfilCreate(PerfilBase):
    pass

class PerfilUpdate(SafeModel):
    nome: Optional[str] = None
    ativo: Optional[bool] = None

class Perfil(PerfilBase, TimestampMixin):
    id_perfis: int

# --- COLABORADORES ---
class ColaboradorBase(SafeModel):
    nome: str
    matricula: int
    id_cargos: int
    email: Optional[str] = None

class ColaboradorCreate(ColaboradorBase):
    pass

class ColaboradorUpdate(SafeModel):
    nome: Optional[str] = None
    matricula: Optional[int] = None
    id_cargos: Optional[int] = None
    email: Optional[str] = None
    ativo: Optional[bool] = None

class Colaborador(ColaboradorBase, TimestampMixin):
    id_colaboradores: int

# --- USUÁRIOS ---
class UsuarioBase(SafeModel):
    usuario: str
    id_colaboradores: int
    id_perfis: int
    email: Optional[str] = None

class UsuarioCreate(UsuarioBase):
    senha_hash: str 

class UsuarioUpdate(SafeModel):
    usuario: Optional[str] = None
    id_perfis: Optional[int] = None
    email: Optional[str] = None
    senha_hash: Optional[str] = None
    ativo: Optional[bool] = None

class Usuario(UsuarioBase, TimestampMixin):
    id_usuarios: int

# --- PERMISSÕES ---
class PermissaoBase(SafeModel):
    id_perfis: int
    id_telas: int
    visualizar: Optional[bool] = False
    inserir: Optional[bool] = False
    alterar: Optional[bool] = False
    excluir: Optional[bool] = False

class PermissaoCreate(PermissaoBase):
    pass

class PermissaoUpdate(SafeModel):
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
class OcorrenciaBase(SafeModel):
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
    data_prazo: Optional[Any] = None

class OcorrenciaCreate(OcorrenciaBase):
    id_maquinas: int
    id_colaboradores: int
    id_produtos: int
    numero_ocorrencias: int
    data_ocorrencias: Optional[Any] = None
    
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
    pass

class Ocorrencia(OcorrenciaBase):
    data_ocorrencias: Any
    id_maquinas: int
    id_colaboradores: int
    id_produtos: int
    numero_ocorrencias: int
    data_criacao: Optional[Any] = None
    data_atualizacao: Optional[Any] = None