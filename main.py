from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, logger, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import engine, get_db
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

logger = logging.getLogger(__name__)

# Criação das tabelas (caso ainda não existam no banco)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Q.C Software", version="1.0.0")
app.mount("/telas", StaticFiles(directory="telas", html=True), name="telas")

# Configura as origens permitidas
origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]

# Adiciona o middleware de CORS no aplicativo
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Ou digite ["*"] para liberar para qualquer um durante os testes
    allow_credentials=True,
    allow_methods=["*"], # Permite GET, POST, PUT, DELETE, etc.
    allow_headers=["*"], # Permite todos os cabeçalhos
)

# --- FUNÇÃO AUXILIAR PARA UPDATE GENÉRICO ---
def update_item(db: Session, db_obj, obj_in):
    obj_data = obj_in.model_dump(exclude_unset=True)
    for field in obj_data:
        setattr(db_obj, field, obj_data[field])
    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- ROTA RAIZ ---
@app.get("/", tags=["Home"])
def home():
    return {"Sejam bem-vindos a Q.C Software!"}

# ==========================================
# 1. CARGOS
# ==========================================
@app.get("/cargos/", response_model=List[schemas.Cargo], tags=["Cargos"])
def listar_cargos(db: Session = Depends(get_db)):
    return db.query(models.Cargo).all()

@app.post("/cargos/", response_model=schemas.Cargo, tags=["Cargos"])
def criar_cargo(obj: schemas.CargoCreate, db: Session = Depends(get_db)):
    novo = models.Cargo(**obj.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@app.put("/cargos/{id}", response_model=schemas.Cargo, tags=["Cargos"])
def atualizar_cargo(id: int, obj: schemas.CargoCreate, db: Session = Depends(get_db)):
    db_obj = db.query(models.Cargo).filter(models.Cargo.id_cargos == id).first()
    if not db_obj: raise HTTPException(404, "Cargo não encontrado")
    return update_item(db, db_obj, obj)

@app.delete("/cargos/{id}", tags=["Cargos"])
def deletar_cargo(id: int, db: Session = Depends(get_db)):
    db_obj = db.query(models.Cargo).filter(models.Cargo.id_cargos == id).first()
    if not db_obj: raise HTTPException(404, "Cargo não encontrado")
    db.delete(db_obj)
    db.commit()
    return {"status": "Cargo deletado com sucesso"}

# ==========================================
# 2. PRODUTOS
# ==========================================
@app.get("/produtos/", response_model=List[schemas.Produto], tags=["Produtos"])
def listar_produtos(db: Session = Depends(get_db)):
    return db.query(models.Produto).all()

@app.post("/produtos/", response_model=schemas.Produto, tags=["Produtos"])
def criar_produto(obj: schemas.ProdutoCreate, db: Session = Depends(get_db)):
    novo = models.Produto(**obj.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@app.put("/produtos/{id}", response_model=schemas.Produto, tags=["Produtos"])
def atualizar_produto(id: int, obj: schemas.ProdutoCreate, db: Session = Depends(get_db)):
    db_obj = db.query(models.Produto).filter(models.Produto.id_produtos == id).first()
    if not db_obj: raise HTTPException(404, "Produto não encontrado")
    return update_item(db, db_obj, obj)

@app.delete("/produtos/{id}", tags=["Produtos"])
def deletar_produto(id: int, db: Session = Depends(get_db)):
    db_obj = db.query(models.Produto).filter(models.Produto.id_produtos == id).first()
    db.delete(db_obj)
    db.commit()
    return {"status": "Produto deletado com sucesso"}

# ==========================================
# 3. MÁQUINAS
# ==========================================
@app.get("/maquinas/", response_model=List[schemas.Maquina], tags=["Máquinas"])
def listar_maquinas(db: Session = Depends(get_db)):
    return db.query(models.Maquina).all()

@app.post("/maquinas/", response_model=schemas.Maquina, tags=["Máquinas"])
def criar_maquina(obj: schemas.MaquinaCreate, db: Session = Depends(get_db)):
    novo = models.Maquina(**obj.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@app.put("/maquinas/{id}", response_model=schemas.Maquina, tags=["Máquinas"])
def atualizar_maquina(id: int, obj: schemas.MaquinaCreate, db: Session = Depends(get_db)):
    db_obj = db.query(models.Maquina).filter(models.Maquina.id_maquinas == id).first()
    return update_item(db, db_obj, obj)

@app.delete("/maquinas/{id}", tags=["Máquinas"])
def deletar_maquina(id: int, db: Session = Depends(get_db)):
    db_obj = db.query(models.Maquina).filter(models.Maquina.id_maquinas == id).first()
    db.delete(db_obj)
    db.commit()
    return {"status": "Máquina deletada com sucesso"}

# ==========================================
# 4. OCORRÊNCIAS
# ==========================================
# --- LISTAR ---
@app.get("/ocorrencias/", response_model=List[schemas.Ocorrencia], tags=["Ocorrências"])
def listar_ocorrencias(db: Session = Depends(get_db)):
    try:
        return db.query(models.Ocorrencia).all()
    except Exception as e:
        logger.error(f"Erro ao listar: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Erro ao carregar dados do banco."
        )

# --- CRIAR ---
@app.post("/ocorrencias/", response_model=schemas.Ocorrencia, status_code=status.HTTP_201_CREATED, tags=["Ocorrências"])
def criar_ocorrencia(obj: schemas.OcorrenciaCreate, db: Session = Depends(get_db)):
    try:
        dados_input = obj.model_dump()
        novo = models.Ocorrencia(**dados_input)
        
        db.add(novo)
        db.commit()
        db.refresh(novo) 
        return novo
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar ocorrência: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Erro nos dados enviados: {str(e)}"
        )
    
    # --- ATUALIZAR ---
@app.put("/ocorrencias/", response_model=schemas.Ocorrencia, tags=["Ocorrências"])
def atualizar_ocorrencia(
    data_ocorrencias: datetime,
    id_maquinas: int,
    id_colaboradores: int,
    id_produtos: int,
    obj: schemas.OcorrenciaUpdate, 
    db: Session = Depends(get_db)
):
    # Filtro usando a chave primária composta de 4 campos
    db_query = db.query(models.Ocorrencia).filter(
        models.Ocorrencia.data_ocorrencias == data_ocorrencias,
        models.Ocorrencia.id_maquinas == id_maquinas,
        models.Ocorrencia.id_colaboradores == id_colaboradores,
        models.Ocorrencia.id_produtos == id_produtos
    )
    db_obj = db_query.first()

    if not db_obj:
        raise HTTPException(status_code=404, detail="Ocorrência não encontrada com a chave informada.")

    try:
        update_data = obj.model_dump(exclude_unset=True)
        
        db_query.update(update_data, synchronize_session=False)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao atualizar ocorrência: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Erro interno ao atualizar banco de dados: {str(e)}"
        )

# --- DELETAR ---
@app.delete("/ocorrencias/", tags=["Ocorrências"])
def deletar_ocorrencia(
    data_ocorrencias: datetime,
    id_maquinas: int,
    id_colaboradores: int,
    id_produtos: int,
    db: Session = Depends(get_db)
):
    # Filtro usando a chave primária composta de 4 campos
    db_query = db.query(models.Ocorrencia).filter(
        models.Ocorrencia.data_ocorrencias == data_ocorrencias,
        models.Ocorrencia.id_maquinas == id_maquinas,
        models.Ocorrencia.id_colaboradores == id_colaboradores,
        models.Ocorrencia.id_produtos == id_produtos
    )
    db_obj = db_query.first()
    
    if not db_obj:
        logger.warning(f"Tentativa de deletar ocorrência inexistente.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Ocorrência não encontrada com a chave informada."
        )

    try:
        db_query.delete(synchronize_session=False)
        db.commit()
        
        return {
            "status": "sucesso",
            "mensagem": "Cadastro excluído com sucesso",
            "chave_deletada": {
                "data_ocorrencias": data_ocorrencias,
                "id_maquinas": id_maquinas,
                "id_colaboradores": id_colaboradores,
                "id_produtos": id_produtos
            }
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao deletar ocorrência: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro de integridade ao deletar registro: {str(e)}"
        )
    
# ==========================================
# 5. COLABORADORES
# ==========================================
@app.get("/colaboradores/", response_model=List[schemas.Colaborador], tags=["Colaboradores"])
def listar_colaboradores(db: Session = Depends(get_db)):
    return db.query(models.Colaborador).all()

@app.post("/colaboradores/", response_model=schemas.Colaborador, tags=["Colaboradores"])
def criar_colaborador(obj: schemas.ColaboradorCreate, db: Session = Depends(get_db)):
    novo = models.Colaborador(**obj.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo  

@app.put("/colaboradores/{id}", response_model=schemas.Colaborador, tags=["Colaboradores"])
def atualizar_colaborador(id: int, obj: schemas.ColaboradorCreate, db: Session = Depends(get_db)):
    db_obj = db.query(models.Colaborador).filter(models.Colaborador.id_colaboradores == id).first()
    return update_item(db, db_obj, obj)

@app.delete("/colaboradores/{id}", tags=["Colaboradores"])
def deletar_colaborador(id: int, db: Session = Depends(get_db)):
    db_obj = db.query(models.Colaborador).filter(models.Colaborador.id_colaboradores == id).first()
    db.delete(db_obj)
    db.commit()
    return {"status": "Colaborador deletado com sucesso"}

# ==========================================
# 6. USUÁRIOS
# ==========================================
@app.get("/usuarios/", response_model=List[schemas.Usuario], tags=["Usuários"])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).all()

@app.post("/usuarios/", response_model=schemas.Usuario, tags=["Usuários"])
def criar_usuario(obj: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    novo = models.Usuario(**obj.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@app.put("/usuarios/{id}", response_model=schemas.Usuario, tags=["Usuários"])
def atualizar_usuario(id: int, obj: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    db_obj = db.query(models.Usuario).filter(models.Usuario.id_usuarios == id).first()
    return update_item(db, db_obj, obj)

@app.delete("/usuarios/{id}", tags=["Usuários"])
def deletar_usuario(id: int, db: Session = Depends(get_db)):
    db_obj = db.query(models.Usuario).filter(models.Usuario.id_usuarios == id).first()
    db.delete(db_obj)
    db.commit()
    return {"status": "Usuário deletado com sucesso"}

# ==========================================
# 7. PERMISSÕES
# ==========================================
@app.get("/permissoes/", response_model=List[schemas.Permissao], tags=["Permissões"])
def listar_permissoes(db: Session = Depends(get_db)):
    return db.query(models.Permissao).all()

@app.post("/permissoes/", response_model=schemas.Permissao, tags=["Permissões"])
def criar_permissao(obj: schemas.PermissaoCreate, db: Session = Depends(get_db)):
    novo = models.Permissao(**obj.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@app.put("/permissoes/{id}", response_model=schemas.Permissao, tags=["Permissões"])
def atualizar_permissao(id: int, obj: schemas.PermissaoCreate, db: Session = Depends(get_db)):
    db_obj = db.query(models.Permissao).filter(models.Permissao.id_permissoes == id).first()
    return update_item(db, db_obj, obj)

@app.delete("/permissoes/{id}", tags=["Permissões"])
def deletar_permissao(id: int, db: Session = Depends(get_db)):
    db_obj = db.query(models.Permissao).filter(models.Permissao.id_permissoes == id).first()
    db.delete(db_obj)
    db.commit()
    return {"status": "Permissão deletada com sucesso"}

# ==========================================
# 8. TELAS
# ==========================================
@app.get("/telas/", response_model=List[schemas.Tela], tags=["Telas"])
def listar_telas(db: Session = Depends(get_db)):
    return db.query(models.Tela).all()

@app.post("/telas/", response_model=schemas.Tela, tags=["Telas"])
def criar_tela(obj: schemas.TelaCreate, db: Session = Depends(get_db)):
    novo = models.Tela(**obj.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@app.put("/telas/{id}", response_model=schemas.Tela, tags=["Telas"])
def atualizar_tela(id: int, obj: schemas.TelaCreate, db: Session = Depends(get_db)):
    db_obj = db.query(models.Tela).filter(models.Tela.id_telas == id).first()
    if not db_obj: raise HTTPException(404, "Tela não encontrada")
    return update_item(db, db_obj, obj)

@app.delete("/telas/{id}", tags=["Telas"])
def deletar_tela(id: int, db: Session = Depends(get_db)):
    db_obj = db.query(models.Tela).filter(models.Tela.id_telas == id).first()
    if not db_obj: raise HTTPException(404, "Tela não encontrada")
    db.delete(db_obj)
    db.commit()
    return {"status": "Tela deletada com sucesso", "detail": "Tela removida"}

# ==========================================
# 9. PERFIS
# ==========================================
@app.get("/perfis/", response_model=List[schemas.Perfil], tags=["Perfis"])
def listar_perfis(db: Session = Depends(get_db)):
    return db.query(models.Perfil).all()

@app.post("/perfis/", response_model=schemas.Perfil, tags=["Perfis"])
def criar_perfil(obj: schemas.PerfilCreate, db: Session = Depends(get_db)):
    novo = models.Perfil(**obj.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@app.put("/perfis/{id}", response_model=schemas.Perfil, tags=["Perfis"])
def atualizar_perfil(id: int, obj: schemas.PerfilCreate, db: Session = Depends(get_db)):
    db_obj = db.query(models.Perfil).filter(models.Perfil.id_perfis == id).first()
    if not db_obj: raise HTTPException(404, "Perfil não encontrado")
    return update_item(db, db_obj, obj)

@app.delete("/perfis/{id}", tags=["Perfis"])
def deletar_perfil(id: int, db: Session = Depends(get_db)):
    db_obj = db.query(models.Perfil).filter(models.Perfil.id_perfis == id).first()
    if not db_obj: raise HTTPException(404, "Perfil não encontrado")
    db.delete(db_obj)
    db.commit()
    return {"status": "Perfil deletado com sucesso", "detail": "Perfil removido"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)