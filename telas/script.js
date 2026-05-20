const API_URL = "http://127.0.0.1:8000"; 

// VARIÁVEIS DE CONTROLE DE ESTADO (PESQUISA E PAGINAÇÃO)
let todosProdutos = [];      // Armazena a lista bruta vinda da API
let produtosFiltrados = [];  // Armazena o resultado da busca por nome
let paginaAtual = 1;
const ITENS_POR_PAGINA = 10;

// =========================================================================
// 1. LISTAR PRODUTOS (READ com Filtro e Paginação)
// =========================================================================
async function listarProdutosCRUD() {
    const tabela = document.getElementById('tabela-produtos');
    try {
        const res = await fetch(`${API_URL}/produtos/`);
        
        if (!res.ok) {
            throw new Error(`Erro no servidor: Status ${res.status}`);
        }

        todosProdutos = await res.json();
        
        const totalBadge = document.getElementById('total-produtos');
        if (totalBadge) totalBadge.innerText = todosProdutos.length;

        // Processa o filtro inicial e pagina os resultados
        filtrarEAtualizarTabela();

    } catch (e) { 
        console.error("Erro detalhado na requisição dos Produtos:", e); 
        if (tabela) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger py-4">
                        ⚠️ Erro ao carregar produtos.<br>
                        <small class="text-muted">Motivo: ${e.message}</small>
                    </td>
                </tr>
            `;
        }
    }
}

// FUNÇÃO INTERNA: Filtra os produtos por nome e calcula as páginas disponíveis
function filtrarEAtualizarTabela() {
    const termoPesquisa = document.getElementById('pesquisa-produto')?.value.toLowerCase() || "";
    
    // Filtra pelo nome digitado na caixa de pesquisa
    produtosFiltrados = todosProdutos.filter(p => 
        p.nome && p.nome.toLowerCase().includes(termoPesquisa)
    );

    const totalPaginas = Math.ceil(produtosFiltrados.length / ITENS_POR_PAGINA) || 1;
    
    // Evita que a página atual fique em um limbo vazio se a filtragem reduzir drasticamente os itens
    if (paginaAtual > totalPaginas) {
        paginaAtual = totalPaginas;
    }

    // Calcula os cortes exatos para exibir o limite de 10 por página
    const indiceInicial = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const indiceFinal = indiceInicial + ITENS_POR_PAGINA;
    const produtosExibidos = produtosFiltrados.slice(indiceInicial, indiceFinal);

    renderizarTabela(produtosExibidos);
    atualizarControlesPaginacao(totalPaginas);
}

// FUNÇÃO INTERNA: Renderiza as linhas visíveis na tabela
function renderizarTabela(produtos) {
    const tabela = document.getElementById('tabela-produtos');
    if (!tabela) return;

    // CORREÇÃO: Remove o texto "Carregando produtos..." se a lista vier vazia da API
    if (!produtos || produtos.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4 text-muted">Nenhum produto encontrado.</td>
            </tr>
        `;
        return;
    }

    tabela.innerHTML = produtos.map(p => {
        let idBruto = undefined;
        
        if (p) {
            if (p.id_produtos !== undefined && p.id_produtos !== null) idBruto = p.id_produtos;
            else if (p.id !== undefined && p.id !== null) idBruto = p.id;
            else if (p._id !== undefined && p._id !== null) idBruto = p._id;
        }
        
        const produtoId = idBruto !== undefined ? idBruto.toString().trim() : "";

        if (!produtoId) {
            console.warn("Produto sem ID detectado. Estrutura recebida do banco:", p);
            return `
                <tr class="table-warning">
                    <td><strong>${p.nome || "Sem Nome"}</strong></td>
                    <td>${p.categoria || "Sem Categoria"}</td>
                    <td><span class="badge bg-warning text-dark">Erro de ID</span></td>
                    <td class="text-end text-muted small">⚠️ ID ausente</td>
                </tr>
            `;
        }

        let situacaoTratada = "Ativo"; 
        if (p.ativo !== undefined && p.ativo !== null) {
            situacaoTratada = p.ativo;
        } else if (p.situacao !== undefined && p.situacao !== null) {
            situacaoTratada = p.situacao;
        }

        if (typeof situacaoTratada === 'boolean') {
            situacaoTratada = situacaoTratada ? "Ativo" : "Inativo";
        }

        if (typeof situacaoTratada === 'string' && situacaoTratada.length > 0) {
            situacaoTratada = situacaoTratada.charAt(0).toUpperCase() + situacaoTratada.slice(1).toLowerCase();
        }

        p.id = produtoId;
        p.situacao = situacaoTratada;

        const produtoEncoded = encodeURIComponent(JSON.stringify(p));
        
        const badgeClasse = situacaoTratada === 'Ativo' 
            ? 'bg-success-subtle text-success' 
            : 'bg-secondary-subtle text-secondary';

        return `
            <tr class="align-middle">                
                <td><strong>${p.nome || "Sem Nome"}</strong></td>
                <td>${p.categoria || "Sem Categoria"}</td>
                <td><span class="badge ${badgeClasse}">${situacaoTratada}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1 border-0" 
                            onclick="prepararEdicaoSegura('${produtoEncoded}')" 
                            title="Editar produto">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger border-0" 
                            onclick="deletarItemGeral('produtos', '${produtoId}', listarProdutosCRUD)" 
                            title="Excluir produto">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function atualizarControlesPaginacao(totalPaginas) {
    const btnAnterior = document.getElementById('btn-anterior');
    const btnProximo = document.getElementById('btn-proximo');
    const infoPaginacao = document.getElementById('info-paginacao');

    if (infoPaginacao) {
        infoPaginacao.innerText = `Página ${paginaAtual} de ${totalPaginas}`;
    }

    if (btnAnterior) btnAnterior.disabled = (paginaAtual === 1);
    if (btnProximo) btnProximo.disabled = (paginaAtual === totalPaginas);
}

// =========================================================================
// 2. SALVAR OU ATUALIZAR CADASTRO (CREATE / UPDATE)
// =========================================================================
document.getElementById('formProdutos')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const campoId = document.getElementById('prod-id');
    let id = campoId ? campoId.value.toString().trim() : "";
    
    if (!id || id === "" || id === "undefined" || id === "null") {
        id = null;
    }
    
    const nomeInput = document.getElementById('produtos-nome')?.value || "";
    const categoriaInput = document.getElementById('produtos-categoria')?.value || "";
    const situacaoInput = document.getElementById('produtos-situacao')?.value || "";

    const url = id ? `${API_URL}/produtos/${id}` : `${API_URL}/produtos/`;
    const metodo = id ? 'PUT' : 'POST';

    try {
        let options = {};
        const fileInput = document.getElementById('foto-arquivo');

        if (fileInput && fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('nome', nomeInput);
            formData.append('categoria', categoriaInput);
            formData.append('situacao', situacaoInput);
            formData.append('file', fileInput.files[0]);

            options = { method: metodo, body: formData };
        } else {
            const payloadJSON = {
                nome: nomeInput,
                categoria: categoriaInput,
                situacao: situacaoInput
            };

            options = {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadJSON)
            };
        }

        const res = await fetch(url, options);
        
        if (res.ok) {
            e.target.reset(); 
            if (campoId) campoId.value = ""; 
            
            const tituloForm = document.getElementById('titulo-form-prod');
            if (tituloForm) {
                tituloForm.innerHTML = '<i class="bi bi-box-seam text-primary me-2"></i>Novo Produto';
            }
            
            if (metodo === 'POST') {
                dispararNotificacao("Novo cadastro criado com sucesso!", "criar");
            } else {
                dispararNotificacao("Cadastro alterado com sucesso!", "atualizar");
            }
            
            listarProdutosCRUD();
        } else {
            const erroApi = await res.json().catch(() => ({}));
            console.error("Detalhes do erro do servidor:", erroApi);
            alert(`Erro ao salvar produto. Status: ${res.status}`);
        }
    } catch (err) { 
        console.error("Erro no envio:", err);
        alert("Erro de conexão ao salvar produto."); 
    }
});

// =========================================================================
// 3. EXCLUIR CADASTRO DO BANCO DE DADOS (DELETE)
// =========================================================================
async function deletarItemGeral(endpoint, id, callbackSucesso) {
    if (!id || id === undefined || id === null || id.toString().trim() === "" || id.toString() === "undefined" || id.toString() === "null") {
        alert("Não é possível deletar este item: ID inválido ou ausente.");
        return;
    }

    if (!confirm("Tem certeza que deseja excluir permanentemente este item?")) {
        return; 
    }

    try {
        const res = await fetch(`${API_URL}/${endpoint}/${id.toString().trim()}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            dispararNotificacao("Cadastro excluído com sucesso!", "excluir");
            callbackSucesso();
        } else {
            alert(`Não foi possível deletar o item. Código do servidor: ${res.status}`);
        }
    } catch (error) {
        console.error("Erro ao deletar:", error);
        alert("Erro de rede ao tentar deletar o item.");
    }
}

// =========================================================================
// 4. FUNÇÕES DE AUXÍLIO PARA EDIÇÃO
// =========================================================================
window.prepararEdicaoSegura = function(produtoEncoded) {
    try {
        const produto = JSON.parse(decodeURIComponent(produtoEncoded));
        prepararEdicaoProduto(produto);
    } catch (err) {
        console.error("Erro ao decodificar dados do produto:", err);
    }
};

function prepararEdicaoProduto(p) {
    const campoId = document.getElementById('prod-id');
    const campoNome = document.getElementById('produtos-nome');
    const campoCategoria = document.getElementById('produtos-categoria');
    const campoSituacao = document.getElementById('produtos-situacao');
    
    const idLimpo = (p.id !== undefined ? p.id : (p._id || "")).toString().trim();
    
    if (campoId) campoId.value = idLimpo;
    if (campoNome) campoNome.value = p.nome || "";
    if (campoCategoria) campoCategoria.value = p.categoria || "";
    if (campoSituacao && p.situacao) campoSituacao.value = p.situacao;
    
    const tituloForm = document.getElementById('titulo-form-prod');
    if (tituloForm) {
        tituloForm.innerHTML = '<i class="bi bi-pencil-square text-warning me-2"></i>Editando Produto';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =========================================================================
// 5. FUNÇÃO AUXILIAR: Disparar Toast no Canto Inferior Direito
// =========================================================================
function dispararNotificacao(mensagem, acao = 'sucesso') {
    const elementoToast = document.getElementById('toast-cadastro');
    const textoToast = document.getElementById('toast-mensagem-texto');
    const iconeToast = document.getElementById('toast-mensagem-icone');
    
    if (!elementoToast || !textoToast) return;

    elementoToast.className = "toast align-items-center text-white bg-success border-0 shadow";
    
    if (acao === 'criar') {
        if (iconeToast) iconeToast.innerHTML = '<i class="bi bi-plus-circle-fill fs-5"></i>';
    } else if (acao === 'atualizar') {
        if (iconeToast) iconeToast.innerHTML = '<i class="bi bi-pencil-square fs-5"></i>';
    } else if (acao === 'excluir') {
        if (iconeToast) iconeToast.innerHTML = '<i class="bi bi-trash3-fill fs-5"></i>';
    } else {
        if (iconeToast) iconeToast.innerHTML = '<i class="bi bi-check-circle-fill fs-5"></i>';
    }

    textoToast.innerText = mensagem;

    const bootstrapToast = new bootstrap.Toast(elementoToast, { delay: 3500 });
    bootstrapToast.show();
}

// =========================================================================
// 6. OUVINTES DE EVENTOS DA PÁGINA (EXECUTA QUANDO O HTML ESTIVER PRONTO)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a listagem de produtos da API
    listarProdutosCRUD();

    // CORREÇÃO: Garante que o relógio só comece a rodar após o HTML carregar por completo
    atualizarRelogioBrasilia();
    setInterval(atualizarRelogioBrasilia, 10000);

    // Evento de digitação na caixa de pesquisa
    document.getElementById('pesquisa-produto')?.addEventListener('input', () => {
        paginaAtual = 1; 
        filtrarEAtualizarTabela();
    });

    // Evento de clique para o botão "Anterior"
    document.getElementById('btn-anterior')?.addEventListener('click', () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            filtrarEAtualizarTabela();
        }
    });

    // Evento de clique para o botão "Próximo"
    document.getElementById('btn-proximo')?.addEventListener('click', () => {
        const totalPaginas = Math.ceil(produtosFiltrados.length / ITENS_POR_PAGINA) || 1;
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            filtrarEAtualizarTabela();
        }
    });
});

// FUNÇÃO AUXILIAR: Mantém a Data e Hora Sincronizadas no Menu Lateral
function atualizarRelogioBrasilia() {
    const agora = new Date();
    
    const opcoesData = { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' };
    const opcoesHora = { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false };
    
    const dataStr = agora.toLocaleDateString('pt-BR', opcoesData);
    const horaStr = agora.toLocaleTimeString('pt-BR', opcoesHora);
    
    const elData = document.getElementById('data-brasilia');
    const elHora = document.getElementById('hora-brasilia');
    
    if (elData) elData.textContent = dataStr;
    if (elHora) elHora.textContent = `${horaStr} horas`;
}