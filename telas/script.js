const API_URL = "https://qcsoftware2.onrender.com";

// VARIÁVEIS DE CONTROLE DE ESTADO (PESQUISA E PAGINAÇÃO)
let todosProdutos = [];      // Armazena a lista bruta vinda da API
let produtosFiltrados = [];  // Armazena o resultado da busca por nome
let paginaAtual = 1;
const ITENS_POR_PAGINA = 10;

// -- Produtos
// =========================================================================
// 1. LISTAR PRODUTOS (READ com Filtro e Paginação)
// =========================================================================
async function listarProdutosCRUD() {
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
        const tabela = document.getElementById('tabela-produtos');
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

// FUNÇÃO INTERNA: Renderiza as linhas visíveis na tabela (CORRIGIDO PARA id_produtos)
function renderizarTabela(produtos) {
    const tabela = document.getElementById('tabela-produtos');
    if (!tabela) return;

    if (!produtos || produtos.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4 text-muted">Nenhum produto encontrado.</td>
            </tr>
        `;
        return;
    }

    tabela.innerHTML = produtos.map(p => {
        // CORREÇÃO EXATA: Captura o ID baseado na estrutura real do seu banco (id_produtos)
        let idBruto = undefined;
        
        if (p) {
            if (p.id_produtos !== undefined && p.id_produtos !== null) idBruto = p.id_produtos;
            else if (p.id !== undefined && p.id !== null) idBruto = p.id;
            else if (p._id !== undefined && p._id !== null) idBruto = p._id;
        }
        
        // Converte o ID encontrado (ex: 11) em uma String limpa
        const produtoId = idBruto !== undefined ? idBruto.toString().trim() : "";

        // Se mesmo assim não encontrar nada, exibe o aviso
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

        // Mapeamento automático da Situação/Ativo (Sua API usa 'ativo: true')
        let situacaoTratada = "Ativo"; 
        if (p.ativo !== undefined && p.ativo !== null) {
            situacaoTratada = p.ativo;
        } else if (p.situacao !== undefined && p.situacao !== null) {
            situacaoTratada = p.situacao;
        }

        // Se o ativo for boolean (true/false), converte para texto amigável
        if (typeof situacaoTratada === 'boolean') {
            situacaoTratada = situacaoTratada ? "Ativo" : "Inativo";
        }

        if (typeof situacaoTratada === 'string' && situacaoTratada.length > 0) {
            situacaoTratada = situacaoTratada.charAt(0).toUpperCase() + situacaoTratada.slice(1).toLowerCase();
        }

        // IMPORTANTE: Unifica a propriedade para o resto do script entender como 'id' e 'situacao'
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

// FUNÇÃO INTERNA: Bloqueia ou libera os botões de controle de paginação
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
    
    // CORREÇÃO DA EDIÇÃO: Tratamento estrito do ID fantasma. Se for nulo ou texto vazio vira POST
    if (!id || id === "" || id === "undefined" || id === "null") {
        id = null;
    }
    
    const nomeInput = document.getElementById('produtos-nome')?.value || "";
    const categoriaInput = document.getElementById('produtos-categoria')?.value || "";
    const situacaoInput = document.getElementById('produtos-situacao')?.value || "";

    // DEFINIÇÃO DA ROTA E MÉTODO HTTP (Se id existe de verdade faz PUT, senão faz POST)
    const url = id ? `${API_URL}/produtos/${id}` : `${API_URL}/produtos/`;
    const metodo = id ? 'PUT' : 'POST';

    try {
        let options = {};
        const fileInput = document.getElementById('foto-arquivo');

        // Estratégia multipart/form-data ou JSON puro baseado em anexos
        if (fileInput && fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('nome', nomeInput);
            formData.append('categoria', categoriaInput);
            formData.append('situacao', situacaoInput);
            formData.append('file', fileInput.files[0]);

            options = {
                method: metodo,
                body: formData
            };
        } else {
            const payloadJSON = {
                nome: nomeInput,
                categoria: categoriaInput,
                situacao: situacaoInput
            };

            options = {
                method: metodo,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payloadJSON)
            };
        }

        const res = await fetch(url, options);
        
        if (res.ok) {
            e.target.reset(); 
            if (campoId) campoId.value = ""; // Limpa completamente o id oculto
            
            const tituloForm = document.getElementById('titulo-form-prod');
            if (tituloForm) {
                tituloForm.innerHTML = '<i class="bi bi-box-seam text-primary me-2"></i>Novo Produto';
            }
            
            // DISPARO DA NOTIFICAÇÃO DE SUCESSO (Canto inferior direito)
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
    // CORREÇÃO DA EXCLUSÃO: Validação estrita do parâmetro recebido
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
            // DISPARO DA NOTIFICAÇÃO DE EXCLUSÃO (Canto inferior direito)
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
    
    // Força a extração do ID correto convertido em string limpa
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

    // Configura o fundo verde padrão (Sucesso)
    elementoToast.className = "toast align-items-center text-white bg-success border-0 shadow";
    
    // Altera o ícone do Bootstrap conforme o evento
    if (acao === 'criar') {
        if (iconeToast) iconeToast.innerHTML = '<i class="bi bi-plus-circle-fill fs-5"></i>';
    } else if (acao === 'atualizar') {
        if (iconeToast) iconeToast.innerHTML = '<i class="bi bi-pencil-square fs-5"></i>';
    } else if (acao === 'excluir') {
        if (iconeToast) iconeToast.innerHTML = '<i class="bi bi-trash3-fill fs-5"></i>';
    } else {
        if (iconeToast) iconeToast.innerHTML = '<i class="bi bi-check-circle-fill fs-5"></i>';
    }

    textoToast.innerText = message = mensagem;

    // Inicializa e exibe o Toast (configurado para sumir sozinho em 3.5 segundos)
    const bootstrapToast = new bootstrap.Toast(elementoToast, { delay: 3500 });
    bootstrapToast.show();
}

// =========================================================================
// 6. OUVINTES DE EVENTOS DA PÁGINA (INPUTS E CLIQUES)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    listarProdutosCRUD();

    // Evento de digitação na caixa de pesquisa
    document.getElementById('pesquisa-produto')?.addEventListener('input', () => {
        paginaAtual = 1; // Força retorno à página 1 a cada busca realizada
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

// - Cargos

// =========================================================================
// VARIÁVEIS DE CONTROLE DE ESTADO PARA CARGOS
// =========================================================================
let todosCargos = [];       // Armazena a lista bruta vinda da API
let cargosFiltrados = [];   // Armazena o resultado da busca por nome
let paginaAtualCargos = 1;  // Variável de página separada para não chocar com produtos

// =========================================================================
// 1. LISTAR CARGOS (READ com Filtro e Paginação)
// =========================================================================
async function listarCargosCRUD() {
    try {
        const res = await fetch(`${API_URL}/cargos/`);
        
        if (!res.ok) {
            throw new Error(`Erro no servidor: Status ${res.status}`);
        }

        todosCargos = await res.json();
        
        const totalBadge = document.getElementById('total-cargos');
        if (totalBadge) totalBadge.innerText = todosCargos.length;

        // Processa o filtro inicial e pagina os resultados
        filtrarEAtualizarTabelaCargos();

    } catch (e) { 
        console.error("Erro detalhado na requisição dos Cargos:", e); 
        const tabela = document.getElementById('tabela-cargos');
        if (tabela) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger py-4">
                        ⚠️ Erro ao carregar cargos.<br>
                        <small class="text-muted">Motivo: ${e.message}</small>
                    </td>
                </tr>
            `;
        }
    }
}

// FUNÇÃO INTERNA: Filtra os cargos por nome e calcula as páginas disponíveis
function filtrarEAtualizarTabelaCargos() {
    const termoPesquisa = document.getElementById('pesquisa-cargo')?.value.toLowerCase() || "";
    
    // Filtra pelo nome do cargo digitado
    cargosFiltrados = todosCargos.filter(c => 
        c.nome && c.nome.toLowerCase().includes(termoPesquisa)
    );

    const totalPaginas = Math.ceil(cargosFiltrados.length / ITENS_POR_PAGINA) || 1;
    
    if (paginaAtualCargos > totalPaginas) {
        paginaAtualCargos = totalPaginas;
    }

    // Calcula os cortes exatos para exibir o limite de 10 por página
    const indiceInicial = (paginaAtualCargos - 1) * ITENS_POR_PAGINA;
    const indiceFinal = indiceInicial + ITENS_POR_PAGINA;
    const cargosExibidos = cargosFiltrados.slice(indiceInicial, indiceFinal);

    renderizarTabelaCargos(cargosExibidos);
    atualizarControlesPaginacaoCargos(totalPaginas);
}

// FUNÇÃO INTERNA: Renderiza as linhas visíveis na tabela de cargos
function renderizarTabelaCargos(cargos) {
    const tabela = document.getElementById('tabela-cargos');
    if (!tabela) return;

    if (!cargos || cargos.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4 text-muted">Nenhum cargo encontrado.</td>
            </tr>
        `;
        return;
    }

    tabela.innerHTML = cargos.map(c => {
        // Captura o ID baseado na estrutura real do seu banco (id_cargos, id, _id)
        let idBruto = undefined;
        
        if (c) {
            if (c.id_cargos !== undefined && c.id_cargos !== null) idBruto = c.id_cargos;
            else if (c.id !== undefined && c.id !== null) idBruto = c.id;
            else if (c._id !== undefined && c._id !== null) idBruto = c._id;
        }
        
        const cargoId = idBruto !== undefined ? idBruto.toString().trim() : "";

        if (!cargoId) {
            console.warn("Cargo sem ID detectado. Estrutura recebida do banco:", c);
            return `
                <tr class="table-warning">
                    <td><strong>${c.nome || "Sem Nome"}</strong></td>                    
                    <td><span class="badge bg-warning text-dark">Erro de ID</span></td>
                    <td class="text-end text-muted small">⚠️ ID ausente</td>
                </tr>
            `;
        }

        // Mapeamento automático da Situação/Ativo
        let situacaoTratada = "Ativo"; 
        if (c.ativo !== undefined && c.ativo !== null) {
            situacaoTratada = c.ativo;
        } else if (c.situacao !== undefined && c.situacao !== null) {
            situacaoTratada = c.situacao;
        }

        if (typeof situacaoTratada === 'boolean') {
            situacaoTratada = situacaoTratada ? "Ativo" : "Inativo";
        }

        if (typeof situacaoTratada === 'string' && situacaoTratada.length > 0) {
            situacaoTratada = situacaoTratada.charAt(0).toUpperCase() + situacaoTratada.slice(1).toLowerCase();
        }

        // Unifica a propriedade para o resto do script entender como 'id' e 'situacao'
        c.id = cargoId;
        c.situacao = situacaoTratada;

        const cargoEncoded = encodeURIComponent(JSON.stringify(c));
        
        const badgeClasse = situacaoTratada === 'Ativo' 
            ? 'bg-success-subtle text-success' 
            : 'bg-secondary-subtle text-secondary';

        return `
            <tr class="align-middle">                
                <td><strong>${c.nome || "Sem Nome"}</strong></td>                
                <td><span class="badge ${badgeClasse}">${situacaoTratada}</span></td>
                <td class="text-end">
                     <button class="btn btn-sm btn-outline-primary me-1 border-0"
                            onclick="prepararEdicaoSeguraCargo('${cargoEncoded}')" 
                            title="Editar cargo">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger border-0" 
                            onclick="deletarItemGeral('cargos', '${cargoId}', listarCargosCRUD)" 
                            title="Excluir cargo">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// FUNÇÃO INTERNA: Bloqueia ou libera os botões de controle de paginação de cargos
function atualizarControlesPaginacaoCargos(totalPaginas) {
    const btnAnterior = document.getElementById('btn-anterior-cargos');
    const btnProximo = document.getElementById('btn-proximo-cargos');
    const infoPaginacao = document.getElementById('info-paginacao-cargos');

    if (infoPaginacao) {
        infoPaginacao.innerText = `Página ${paginaAtualCargos} de ${totalPaginas}`;
    }

    if (btnAnterior) btnAnterior.disabled = (paginaAtualCargos === 1);
    if (btnProximo) btnProximo.disabled = (paginaAtualCargos === totalPaginas);
}

// =========================================================================
// 2. SALVAR OU ATUALIZAR CADASTRO (CREATE / UPDATE)
// =========================================================================
document.getElementById('formCargos')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const campoId = document.getElementById('cargo-id');
    let id = campoId ? campoId.value.toString().trim() : "";
    
    if (!id || id === "" || id === "undefined" || id === "null") {
        id = null;
    }
    
    const nomeInput = document.getElementById('cargos-nome')?.value || "";
    const departamentoInput = document.getElementById('cargos-departamento')?.value || "";
    const situacaoInput = document.getElementById('cargos-situacao')?.value || "";

    const url = id ? `${API_URL}/cargos/${id}` : `${API_URL}/cargos/`;
    const metodo = id ? 'PUT' : 'POST';

    try {
        let options = {};
        const fileInput = document.getElementById('cargo-foto-arquivo'); // Input de arquivo se houver para cargos

        if (fileInput && fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('nome', nomeInput);
            formData.append('departamento', departamentoInput);
            formData.append('situacao', situacaoInput);
            formData.append('file', fileInput.files[0]);

            options = {
                method: metodo,
                body: formData
            };
        } else {
            const payloadJSON = {
                nome: nomeInput,
                departamento: departamentoInput,
                situacao: situacaoInput
            };

            options = {
                method: metodo,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payloadJSON)
            };
        }

        const res = await fetch(url, options);
        
        if (res.ok) {
            e.target.reset(); 
            if (campoId) campoId.value = ""; 
            
            const tituloForm = document.getElementById('titulo-form-cargo');
            if (tituloForm) {
                tituloForm.innerHTML = '<i class="bi bi-briefcase text-primary me-2"></i>Novo Cargo';
            }
            
            if (metodo === 'POST') {
                dispararNotificacao("Novo cargo criado com sucesso!", "criar");
            } else {
                dispararNotificacao("Cargo alterado com sucesso!", "atualizar");
            }
            
            listarCargosCRUD();
        } else {
            const erroApi = await res.json().catch(() => ({}));
            console.error("Detalhes do erro do servidor:", erroApi);
            alert(`Erro ao salvar cargo. Status: ${res.status}`);
        }
    } catch (err) { 
        console.error("Erro no envio:", err);
        alert("Erro de conexão ao salvar cargo."); 
    }
});

// =========================================================================
// 4. FUNÇÕES DE AUXÍLIO PARA EDIÇÃO DE CARGOS
// =========================================================================
window.prepararEdicaoSeguraCargo = function(cargoEncoded) {
    try {
        const cargo = JSON.parse(decodeURIComponent(cargoEncoded));
        prepararEdicaoCargo(cargo);
    } catch (err) {
        console.error("Erro ao decodificar dados do cargo:", err);
    }
};

function prepararEdicaoCargo(c) {
    const campoId = document.getElementById('cargo-id');
    const campoNome = document.getElementById('cargos-nome');    
    const campoSituacao = document.getElementById('cargos-situacao');
    
    const idLimpo = (c.id !== undefined ? c.id : (c._id || "")).toString().trim();
    
    if (campoId) campoId.value = idLimpo;
    if (campoNome) campoNome.value = c.nome || "";    
    if (campoSituacao && c.situacao) campoSituacao.value = c.situacao;
    
    const tituloForm = document.getElementById('titulo-form-cargo');
    if (tituloForm) {
        tituloForm.innerHTML = '<i class="bi bi-pencil-square text-warning me-2"></i>Editando Cargo';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =========================================================================
// 6. OUVINTES DE EVENTOS DA PÁGINA (ADICIONADOS AO DOMContentLoaded EXISTENTE)
// =========================================================================
// Observação: Como você provavelmente já tem um `document.addEventListener('DOMContentLoaded', ...)`
// você pode apenas colar essas linhas extras dentro dele, ou manter este bloco separado abaixo:

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a listagem de cargos se a tabela de cargos existir na página atual
    if (document.getElementById('tabela-cargos')) {
        listarCargosCRUD();
    }

    // Evento de digitação na caixa de pesquisa de cargos
    document.getElementById('pesquisa-cargo')?.addEventListener('input', () => {
        paginaAtualCargos = 1; 
        filtrarEAtualizarTabelaCargos();
    });

    // Evento de clique para o botão "Anterior" dos cargos
    document.getElementById('btn-anterior-cargos')?.addEventListener('click', () => {
        if (paginaAtualCargos > 1) {
            paginaAtualCargos--;
            filtrarEAtualizarTabelaCargos();
        }
    });

    // Evento de clique para o botão "Próximo" dos cargos
    document.getElementById('btn-proximo-cargos')?.addEventListener('click', () => {
        const totalPaginas = Math.ceil(cargosFiltrados.length / ITENS_POR_PAGINA) || 1;
        if (paginaAtualCargos < totalPaginas) {
            paginaAtualCargos++;
            filtrarEAtualizarTabelaCargos();
        }
    });
});

// - Máquinas

// =========================================================================
// VARIÁVEIS DE CONTROLE DE ESTADO PARA MÁQUINAS
// =========================================================================
let todasMaquinas = [];       // Armazena a lista bruta vinda da API
let maquinasFiltrados = [];   // Armazena o resultado da busca por nome (mantido padrão de nomenclatura)
let paginaAtualMaquinas = 1;  // Controle de página exclusivo para máquinas

// =========================================================================
// 1. LISTAR MÁQUINAS (READ com Filtro e Paginação)
// =========================================================================
async function listarMaquinasCRUD() {
    try {
        const res = await fetch(`${API_URL}/maquinas/`);
        
        if (!res.ok) {
            throw new Error(`Erro no servidor: Status ${res.status}`);
        }

        todasMaquinas = await res.json();
        
        const totalBadge = document.getElementById('total-maquinas');
        if (totalBadge) totalBadge.innerText = todasMaquinas.length;

        // Processa o filtro inicial e pagina os resultados
        filtrarEAtualizarTabelaMaquinas();

    } catch (e) { 
        console.error("Erro detalhado na requisição das Máquinas:", e); 
        const tabela = document.getElementById('tabela-maquinas');
        if (tabela) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger py-4">
                        ⚠️ Erro ao carregar máquinas.<br>
                        <small class="text-muted">Motivo: ${e.message}</small>
                    </td>
                </tr>
            `;
        }
    }
}

// FUNÇÃO INTERNA: Filtra as máquinas por nome e calcula as páginas disponíveis
function filtrarEAtualizarTabelaMaquinas() {
    const termoPesquisa = document.getElementById('pesquisa-maquina')?.value.toLowerCase() || "";
    
    // Filtra pelo nome da máquina digitado
    maquinasFiltrados = todasMaquinas.filter(m => 
        m.nome && m.nome.toLowerCase().includes(termoPesquisa)
    );

    const totalPaginas = Math.ceil(maquinasFiltrados.length / ITENS_POR_PAGINA) || 1;
    
    if (paginaAtualMaquinas > totalPaginas) {
        paginaAtualMaquinas = totalPaginas;
    }

    // Calcula os cortes exatos para exibir o limite de 10 por página
    const indiceInicial = (paginaAtualMaquinas - 1) * ITENS_POR_PAGINA;
    const indiceFinal = indiceInicial + ITENS_POR_PAGINA;
    const maquinasExibidas = maquinasFiltrados.slice(indiceInicial, indiceFinal);

    renderizarTabelaMaquinas(maquinasExibidas);
    atualizarControlesPaginacaoMaquinas(totalPaginas);
}

// FUNÇÃO INTERNA: Renderiza as linhas visíveis na tabela de máquinas
function renderizarTabelaMaquinas(maquinas) {
    const tabela = document.getElementById('tabela-maquinas');
    if (!tabela) return;

    if (!maquinas || maquinas.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4 text-muted">Nenhuma máquina encontrada.</td>
            </tr>
        `;
        return;
    }

    tabela.innerHTML = maquinas.map(m => {
        // Captura o ID baseado na estrutura real do seu banco (id_maquinas, id, _id)
        let idBruto = undefined;
        
        if (m) {
            if (m.id_maquinas !== undefined && m.id_maquinas !== null) idBruto = m.id_maquinas;
            else if (m.id !== undefined && m.id !== null) idBruto = m.id;
            else if (m._id !== undefined && m._id !== null) idBruto = m._id;
        }
        
        const maquinaId = idBruto !== undefined ? idBruto.toString().trim() : "";

        if (!maquinaId) {
            console.warn("Máquina sem ID detectada. Estrutura recebida do banco:", m);
            return `
                <tr class="table-warning">
                    <td><strong>${m.nome || "Sem Nome"}</strong></td>
                    <td>${m.codigo || m.tipo || "Sem Código"}</td>
                    <td><span class="badge bg-warning text-dark">Erro de ID</span></td>
                    <td class="text-end text-muted small">⚠️ ID ausente</td>
                </tr>
            `;
        }

        // Mapeamento automático da Situação/Ativo
        let situacaoTratada = "Ativo"; 
        if (m.ativo !== undefined && m.ativo !== null) {
            situacaoTratada = m.ativo;
        } else if (m.situacao !== undefined && m.situacao !== null) {
            situacaoTratada = m.situacao;
        }

        if (typeof situacaoTratada === 'boolean') {
            situacaoTratada = situacaoTratada ? "Ativo" : "Inativo";
        }

        if (typeof situacaoTratada === 'string' && situacaoTratada.length > 0) {
            situacaoTratada = situacaoTratada.charAt(0).toUpperCase() + situacaoTratada.slice(1).toLowerCase();
        }

        // Unifica as propriedades
        m.id = maquinaId;
        m.situacao = situacaoTratada;

        const maquinaEncoded = encodeURIComponent(JSON.stringify(m));
        
        const badgeClasse = situacaoTratada === 'Ativo' 
            ? 'bg-success-subtle text-success' 
            : 'bg-secondary-subtle text-secondary';

        return `
            <tr class="align-middle">                
                <td><strong>${m.nome || "Sem Nome"}</strong></td>
                <td>${m.codigo || m.tipo || "Geral"}</td>
                <td><span class="badge ${badgeClasse}">${situacaoTratada}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1 border-0" 
                            onclick="prepararEdicaoSeguraMaquina('${maquinaEncoded}')" 
                            title="Editar máquina">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger border-0" 
                            onclick="deletarItemGeral('maquinas', '${maquinaId}', listarMaquinasCRUD)" 
                            title="Excluir máquina">
                        <i class="bi bi-trash"></i>
                    </button>
                    
                </td>
            </tr>
        `;
    }).join('');
}

// FUNÇÃO INTERNA: Bloqueia ou libera os botões de controle de paginação de máquinas
function atualizarControlesPaginacaoMaquinas(totalPaginas) {
    const btnAnterior = document.getElementById('btn-anterior-maquinas');
    const btnProximo = document.getElementById('btn-proximo-maquinas');
    const infoPaginacao = document.getElementById('info-paginacao-maquinas');

    if (infoPaginacao) {
        infoPaginacao.innerText = `Página ${paginaAtualMaquinas} de ${totalPaginas}`;
    }

    if (btnAnterior) btnAnterior.disabled = (paginaAtualMaquinas === 1);
    if (btnProximo) btnProximo.disabled = (paginaAtualMaquinas === totalPaginas);
}

// =========================================================================
// 2. SALVAR OU ATUALIZAR CADASTRO (CREATE / UPDATE)
// =========================================================================
document.getElementById('formMaquinas')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const campoId = document.getElementById('maq-id');
    let id = campoId ? campoId.value.toString().trim() : "";
    
    if (!id || id === "" || id === "undefined" || id === "null") {
        id = null;
    }
    
    const nomeInput = document.getElementById('maquinas-nome')?.value || "";
    const codigoInput = document.getElementById('maquinas-codigo')?.value || "";
    const situacaoInput = document.getElementById('maquinas-situacao')?.value || "";

    const url = id ? `${API_URL}/maquinas/${id}` : `${API_URL}/maquinas/`;
    const metodo = id ? 'PUT' : 'POST';

    try {
        let options = {};
        const fileInput = document.getElementById('maquina-foto-arquivo'); // Suporte a upload se houver foto do equipamento

        if (fileInput && fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('nome', nomeInput);
            formData.append('codigo', codigoInput);
            formData.append('situacao', situacaoInput);
            formData.append('file', fileInput.files[0]);

            options = {
                method: metodo,
                body: formData
            };
        } else {
            const payloadJSON = {
                nome: nomeInput,
                codigo: codigoInput,
                situacao: situacaoInput
            };

            options = {
                method: metodo,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payloadJSON)
            };
        }

        const res = await fetch(url, options);
        
        if (res.ok) {
            e.target.reset(); 
            if (campoId) campoId.value = ""; 
            
            const tituloForm = document.getElementById('titulo-form-maq');
            if (tituloForm) {
                tituloForm.innerHTML = '<i class="bi bi-cpu text-primary me-2"></i>Nova Máquina';
            }
            
            if (metodo === 'POST') {
                dispararNotificacao("Nova máquina criada com sucesso!", "criar");
            } else {
                dispararNotificacao("Máquina alterada com sucesso!", "atualizar");
            }
            
            listarMaquinasCRUD();
        } else {
            const erroApi = await res.json().catch(() => ({}));
            console.error("Detalhes do erro do servidor:", erroApi);
            alert(`Erro ao salvar máquina. Status: ${res.status}`);
        }
    } catch (err) { 
        console.error("Erro no envio:", err);
        alert("Erro de conexão ao salvar máquina."); 
    }
});

// =========================================================================
// 4. FUNÇÕES DE AUXÍLIO PARA EDIÇÃO DE MÁQUINAS
// =========================================================================
window.prepararEdicaoSeguraMaquina = function(maquinaEncoded) {
    try {
        const maquina = JSON.parse(decodeURIComponent(maquinaEncoded));
        prepararEdicaoMaquina(maquina);
    } catch (err) {
        console.error("Erro ao decodificar dados da máquina:", err);
    }
};

function prepararEdicaoMaquina(m) {
    const campoId = document.getElementById('maq-id');
    const campoNome = document.getElementById('maquinas-nome');
    const campoCodigo = document.getElementById('maquinas-codigo');
    const campoSituacao = document.getElementById('maquinas-situacao');
    
    const idLimpo = (m.id !== undefined ? m.id : (m._id || "")).toString().trim();
    
    if (campoId) campoId.value = idLimpo;
    if (campoNome) campoNome.value = m.nome || "";
    if (campoCodigo) campoCodigo.value = m.codigo || m.tipo || "";
    if (campoSituacao && m.situacao) campoSituacao.value = m.situacao;
    
    const tituloForm = document.getElementById('titulo-form-maq');
    if (tituloForm) {
        tituloForm.innerHTML = '<i class="bi bi-pencil-square text-warning me-2"></i>Editando Máquina';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =========================================================================
// 6. OUVINTES DE EVENTOS DA PÁGINA (DENTRO DO DOMContentLoaded)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a listagem se o elemento da tabela de máquinas estiver presente na página
    if (document.getElementById('tabela-maquinas')) {
        listarMaquinasCRUD();
    }

    // Evento de digitação na caixa de pesquisa de máquinas
    document.getElementById('pesquisa-maquina')?.addEventListener('input', () => {
        paginaAtualMaquinas = 1; 
        filtrarEAtualizarTabelaMaquinas();
    });

    // Evento de clique para o botão "Anterior" das máquinas
    document.getElementById('btn-anterior-maquinas')?.addEventListener('click', () => {
        if (paginaAtualMaquinas > 1) {
            paginaAtualMaquinas--;
            filtrarEAtualizarTabelaMaquinas();
        }
    });

    // Evento de clique para o botão "Próximo" das máquinas
    document.getElementById('btn-proximo-maquinas')?.addEventListener('click', () => {
        const totalPaginas = Math.ceil(maquinasFiltrados.length / ITENS_POR_PAGINA) || 1;
        if (paginaAtualMaquinas < totalPaginas) {
            paginaAtualMaquinas++;
            filtrarEAtualizarTabelaMaquinas();
        }
    });
});

//-- Colaboradores

// =========================================================================
// VARIÁVEIS DE CONTROLE DE ESTADO PARA COLABORADORES
// =========================================================================
let todosColaboradores = [];       // Armazena a lista bruta vinda da API
let colaboradoresFiltrados = [];   // Armazena o resultado da busca por nome
let paginaAtualColaboradores = 1;  // Controle de paginação exclusivo
let todosCargos = [];              // <-- Certifique-se de que esta linha existe aqui no topo!

// =========================================================================
// 1. CARREGAR OPÇÕES DO SELECT DE CARGOS (DINÂMICO)
// =========================================================================
async function carregarCargosNoSelect() {
    const selectCargo = document.getElementById('colaboradores-cargo') || document.querySelector('select[id*="cargo"]');
    if (!selectCargo) return;

    try {
        const res = await fetch(`${API_URL}/cargos/`);
        if (res.ok) {
            const cargos = await res.json();
            selectCargo.innerHTML = '<option value="">Selecione o cargo</option>' + 
                cargos.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
        }
    } catch (e) {
        console.error("Erro ao carregar cargos para o formulário:", e);
    }
}

// =========================================================================
// 2. LISTAR COLABORADORES (READ com Filtro e Paginação)
// =========================================================================
async function listarColaboradoresCRUD() {
    try {
        const res = await fetch(`${API_URL}/colaboradores/`);
        if (!res.ok) throw new Error(`Erro no servidor: Status ${res.status}`);

        todosColaboradores = await res.json();
        
        const totalBadge = document.getElementById('total-colaboradores') || document.querySelector('.badge');
        if (totalBadge) totalBadge.innerText = todosColaboradores.length;

        filtrarEAtualizarTabelaColaboradores();
    } catch (e) { 
        console.error("Erro detalhado na requisição dos Colaboradores:", e); 
        const tabela = document.getElementById('tabela-colaboradores') || document.querySelector('tbody');
        if (tabela) {
            tabela.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">⚠️ Erro ao carregar colaboradores.<br><small class="text-muted">Motivo: ${e.message}</small></td></tr>`;
        }
    }
}

function filtrarEAtualizarTabelaColaboradores() {
    const termoPesquisa = document.getElementById('pesquisa-colaborador')?.value.toLowerCase() || "";
    
    colaboradoresFiltrados = todosColaboradores.filter(c => 
        c.nome && c.nome.toLowerCase().includes(termoPesquisa)
    );

    const totalPaginas = Math.ceil(colaboradoresFiltrados.length / ITENS_POR_PAGINA) || 1;
    if (paginaAtualColaboradores > totalPaginas) paginaAtualColaboradores = totalPaginas;

    const indiceInicial = (paginaAtualColaboradores - 1) * ITENS_POR_PAGINA;
    const indiceFinal = indiceInicial + ITENS_POR_PAGINA;
    const colaboradoresExibidos = colaboradoresFiltrados.slice(indiceInicial, indiceFinal);

    renderizarTabelaColaboradores(colaboradoresExibidos);
    atualizarControlesPaginacaoColaboradores(totalPaginas);
}

function renderizarTabelaColaboradores(colaboradores) {
    const tabela = document.getElementById('tabela-colaboradores') || document.querySelector('tbody');
    if (!tabela) return;

    if (!colaboradores || colaboradores.length === 0) {
        tabela.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum colaborador encontrado.</td></tr>`;
        return;
    }

    tabela.innerHTML = colaboradores.map(c => {
        // Padronização do ID do Colaborador
        let idBruto = c.id_colaboradores ?? c.id ?? c._id;
        const colaboradorId = idBruto !== undefined ? idBruto.toString().trim() : "";

        if (!colaboradorId) {
            return `
                <tr class="table-warning">
                    <td><strong>${c.nome || "Sem Nome"}</strong></td>
                    <td colspan="4" class="text-center">⚠️ Erro: Registro sem ID válido</td>
                </tr>`;
        }

        // Padronização da Situação
        let situacaoTratada = c.ativo !== undefined ? c.ativo : (c.situacao ?? "Ativo");
        if (typeof situacaoTratada === 'boolean') situacaoTratada = situacaoTratada ? "Ativo" : "Inativo";
        if (typeof situacaoTratada === 'string' && situacaoTratada.length > 0) {
            situacaoTratada = situacaoTratada.charAt(0).toUpperCase() + situacaoTratada.slice(1).toLowerCase();
        }

        // =========================================================================
        // CORREÇÃO DO ERRO: Utiliza 'todosCargos' em vez de 'listaDeCargos'
        // =========================================================================
        let nomeCargoExibicao = "-";
        const cargoBruto = c.cargos ?? c.cargo ?? c.id_cargos ?? c.id_cargo; 

        if (cargoBruto) {
            if (typeof cargoBruto === 'object') {
                nomeCargoExibicao = cargoBruto.nome || "-";
            } else {
                // Procurando o cargo na variável global correta
                const cargoEncontrado = todosCargos.find(cargo => {
                    const idDoCargo = cargo.id_cargos ?? cargo.id ?? cargo._id;
                    return idDoCargo == cargoBruto;
                });
                
                if (cargoEncontrado) {
                    nomeCargoExibicao = cargoEncontrado.nome;
                } else {
                    nomeCargoExibicao = `Cargo ${cargoBruto}`; // Fallback se o ID não for achado na lista
                }
            }
        }

        // Salva as propriedades unificadas de volta no objeto para uso no Edit
        c.idUnificado = colaboradorId;
        c.situacaoTratada = situacaoTratada;

        const badgeClasse = situacaoTratada === 'Ativo' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary';

        return `
            <tr class="align-middle">                
                <td><strong>${c.nome || "Sem Nome"}</strong></td>
                <td>${c.matricula || "-"}</td>
                <td>${nomeCargoExibicao}</td>
                <td>${c.email || "-"}</td>
                <td><span class="badge ${badgeClasse}">${situacaoTratada}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1 border-0" 
                            onclick="prepararEdicaoPorId('${colaboradorId}')" 
                            title="Editar colaborador">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger border-0" 
                            onclick="deletarItemGeral('colaboradores', '${colaboradorId}')" 
                            title="Excluir colaborador">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function atualizarControlesPaginacaoColaboradores(totalPaginas) {
    const btnAnterior = document.getElementById('btn-anterior-colaboradores');
    const btnProximo = document.getElementById('btn-proximo-colaboradores');
    const infoPaginacao = document.getElementById('info-paginacao-colaboradores');

    if (infoPaginacao) infoPaginacao.innerText = `Página ${paginaAtualColaboradores} de ${totalPaginas}`;
    if (btnAnterior) btnAnterior.disabled = (paginaAtualColaboradores === 1);
    if (btnProximo) btnProximo.disabled = (paginaAtualColaboradores === totalPaginas);
}

// =========================================================================
// 3. SALVAR OU ATUALIZAR CADASTRO (CREATE / UPDATE)
// =========================================================================
document.getElementById('formColaboradores')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const campoId = document.getElementById('colab-id');
    const id = campoId ? campoId.value.trim() : "";
    
    const url = id ? `${API_URL}/colaboradores/${id}` : `${API_URL}/colaboradores/`;
    const metodo = id ? 'PUT' : 'POST';

    try {
        // CORREÇÃO: Busca pelo ID exato ou por qualquer select que contenha "cargo" no ID
        const selectCargo = document.getElementById('colaboradores-cargo') || document.querySelector('select[id*="cargo"]');
        const valorCargo = selectCargo ? selectCargo.value : "";
        
        // Converte o ID selecionado para número inteiro
        const idCargoInt = parseInt(valorCargo, 10);

        // Alerta de debug caso o valor obtido seja inválido
        if (isNaN(idCargoInt)) {
            console.error("Valor capturado no select do cargo:", valorCargo);
            alert("Erro: Não foi possível identificar o código do cargo selecionado. Verifique o console.");
            return; 
        }

        const payloadJSON = {
            nome: document.getElementById('colaboradores-nome')?.value || "",
            matricula: document.getElementById('colaboradores-matricula')?.value || "",
            id_cargos: idCargoInt, // Enviado perfeitamente como Integer
            email: document.getElementById('colaboradores-email')?.value || "",
            situacao: document.getElementById('colaboradores-situacao')?.value || ""
        };

        const res = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payloadJSON)
        });
        
        if (res.ok) {
            e.target.reset(); 
            if (campoId) campoId.value = ""; 
            
            const tituloForm = document.getElementById('titulo-form-colab');
            if (tituloForm) {
                tituloForm.innerHTML = '<i class="bi bi-person-plus text-primary me-2"></i>Novo Colaborador';
            }
            
            if (typeof dispararNotificacao === "function") {
                const acao = metodo === 'POST' ? 'criar' : 'atualizar';
                const mensagem = metodo === 'POST' ? "Novo colaborador cadastrado com sucesso!" : "Cadastro de colaborador alterado!";
                dispararNotificacao(mensagem, acao);
            } else {
                alert(id ? "Cadastro atualizado com sucesso!" : "Colaborador cadastrado com sucesso!");
            }
            
            listarColaboradoresCRUD();
        } else {
            const erroApi = await res.json().catch(() => ({}));
            console.error("Detalhes do erro do servidor:", erroApi);
            alert(`Erro ao salvar colaborador. Status do servidor: ${res.status}`);
        }
    } catch (err) { 
        console.error("Erro no envio:", err);
        alert("Erro de rede ou conexão ao tentar salvar o colaborador."); 
    }
});

// =========================================================================
// 4. FUNÇÕES DE AUXÍLIO PARA EDIÇÃO (UPDATE)
// =========================================================================
window.prepararEdicaoPorId = function(id) {
    const c = todosColaboradores.find(colab => {
        const idColab = colab.id_colaboradores ?? colab.id ?? colab._id;
        return idColab?.toString().trim() === id.toString().trim();
    });
    
    if (!c) {
        console.error("Colaborador não encontrado na memória local.");
        return;
    }

    const campoId = document.getElementById('colab-id');
    const campoNome = document.getElementById('colaboradores-nome');
    const campoMatricula = document.getElementById('colaboradores-matricula');
    const campoCargo = document.getElementById('colaboradores-cargo');
    const campoEmail = document.getElementById('colaboradores-email');
    const campoSituacao = document.getElementById('colaboradores-situacao');
    
    const idLimpo = (c.id_colaboradores ?? c.id ?? c._id ?? "").toString().trim();
    
    if (campoId) campoId.value = idLimpo;
    if (campoNome) campoNome.value = c.nome || "";
    if (campoMatricula) campoMatricula.value = c.matricula || "";
    
    // =========================================================================
    // AJUSTADO: Vincula o cargo correto de volta ao <select> no formulário
    // Varre as possibilidades de onde o ID do cargo possa estar vindo do banco.
    // =========================================================================
    if (campoCargo) {
    let idCargoEdicao = "";
    if (c.id_cargos) {
        idCargoEdicao = c.id_cargos;
    } else if (c.id_cargo) { // <-- Adicionado suporte ao singular
        idCargoEdicao = c.id_cargo;
    } else if (c.cargos && typeof c.cargos === 'object') {
        idCargoEdicao = c.cargos.id_cargos || c.cargos.id || c.cargos.id_cargo;
    } else if (c.cargo && typeof c.cargo === 'object') {
        idCargoEdicao = c.cargo.id_cargos || c.cargo.id || c.cargo.id_cargo;
    } else {
        idCargoEdicao = c.cargo || "";
    }
    campoCargo.value = idCargoEdicao;
}
    
    if (campoEmail) campoEmail.value = c.email || "";
    
    if (campoSituacao) {
        let situacaoTratada = c.ativo ?? c.situacao ?? "Ativo";
        if (typeof situacaoTratada === 'boolean') {
            situacaoTratada = situacaoTratada ? "Ativo" : "Inativo";
        }
        campoSituacao.value = situacaoTratada;
    }
    
    const tituloForm = document.getElementById('titulo-form-colab');
    if (tituloForm) {
        tituloForm.innerHTML = '<i class="bi bi-pencil-square text-warning me-2"></i>Editando Colaborador';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// =========================================================================
// 5. EXCLUIR ITEM (DELETE)
// =========================================================================
window.deletarItemGeral = async function(endpoint, id) {
    if (!confirm("Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.")) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/${endpoint}/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            if (typeof dispararNotificacao === "function") {
                dispararNotificacao("Registro excluído com sucesso!", "excluir");
            }
            
            // Recarrega a tabela correta dependendo do endpoint
            if (endpoint === 'colaboradores') {
                listarColaboradoresCRUD();
            }
        } else {
            console.error("Erro na exclusão. Status:", res.status);
            alert(`Erro ao excluir. O servidor retornou: ${res.status}`);
        }
    } catch (err) {
        console.error("Erro de conexão ao excluir:", err);
        alert("Erro de conexão ao tentar excluir o registro.");
    }
};

// =========================================================================
// 6. OUVINTES DE EVENTOS DA PÁGINA (DOM)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    listarColaboradoresCRUD();
    carregarCargosNoSelect();

    document.getElementById('pesquisa-colaborador')?.addEventListener('input', () => {
        paginaAtualColaboradores = 1; 
        filtrarEAtualizarTabelaColaboradores();
    });

    document.getElementById('btn-anterior-colaboradores')?.addEventListener('click', () => {
        if (paginaAtualColaboradores > 1) {
            paginaAtualColaboradores--;
            filtrarEAtualizarTabelaColaboradores();
        }
    });

    document.getElementById('btn-proximo-colaboradores')?.addEventListener('click', () => {
        const totalPaginas = Math.ceil(colaboradoresFiltrados.length / ITENS_POR_PAGINA) || 1;
        if (paginaAtualColaboradores < totalPaginas) {
            paginaAtualColaboradores++;
            filtrarEAtualizarTabelaColaboradores();
        }
    });
});
    
    // -- DEFINIR DATA E HORA DE BRASÍLIA --
     (function() {
        function atualizarRelogio() {
            const agora = new Date();
            
            // Força o fuso horário de Brasília de forma nativa no navegador
            const opcoesData = { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' };
            const opcoesHora = { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false };
            
            const dataStr = agora.toLocaleDateString('pt-BR', opcoesData);
            const horaStr = agora.toLocaleTimeString('pt-BR', opcoesHora);
            
            // Captura os elementos do HTML
            const elData = document.getElementById('data-brasilia');
            const elHora = document.getElementById('hora-brasilia');
            
            // Aplica os valores se eles existirem na tela
            if (elData) elData.textContent = dataStr;
            if (elHora) elHora.textContent = horaStr;
        }

        // Executa imediatamente assim que o HTML chega nesse ponto
        atualizarRelogio();
        
        // Mantém atualizando a cada 10 segundos
        setInterval(atualizarRelogio, 10000);
    })();