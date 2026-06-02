const API_URL = "https://qcsoftware2.onrender.com";

let paginaAtual = 1;
const ITENS_POR_PAGINA = 10;

//-- Ocorrências

// =========================================================================
// VARIÁVEIS DE CONTROLE DE ESTADO PARA OCORRENCIAS
// =========================================================================
let todasOcorrencias = [];       // Armazena a lista bruta vinda da API
let OcorrenciasFiltradas = [];   // Armazena o resultado da busca por nome
let paginaAtualOcorrencias = 1;  // Controle de paginação exclusivo
let listaDeOcorrencias = [];            // CORREÇÃO: Declarada globalmente para evitar o erro "is not defined"

// =========================================================================
// 1. CARREGAR OPÇÕES DO SELECT DE OCORRÊNCIAS (DINÂMICO)
// =========================================================================
async function carregarOcorrenciasNoSelect() {
    // CORREÇÃO: Adicionado o :not([id*="situacao"]) para impedir que ele altere o campo Ativo/Inativo na tela de Ocorrencias
    const selectOcorrencias = document.getElementById('ocorrencias-produtos') || document.querySelector('select[id*="produtos"]:not([id*="situacao"])');
    if (!selectProdutos) return;

    try {
        const res = await fetch(`${API_URL}/produtos/`);
        if (res.ok) {
            const cargos = await res.json();
            listaDeCargos = cargos; // Salva os produtos para uso na tabela
            
            // Passando o ID numérico para o 'value' em vez do nome.
            selectCargo.innerHTML = '<option value="">Selecione o produto</option>' + 
                produtos.map(c => {
                    const idProdutos = c.id_produtos ?? c.id ?? c._id;
                    return `<option value="${idCargo}">${c.nome}</option>`;
                }).join('');
        }
    } catch (e) {
        console.error("Erro ao carregar cargos para o formulário:", e);
    }
}

// =========================================================================
// 2. LISTAR OCORRENCIAS (READ com Filtro e Paginação)
// =========================================================================
async function listarOcorrenciasCRUD() {
    try {
        const res = await fetch(`${API_URL}/ocorrencias/`);
        if (!res.ok) throw new Error(`Erro no servidor: Status ${res.status}`);

        todosOcorrencias = await res.json();
        
        const totalBadge = document.getElementById('total-ocorrencias') || document.querySelector('.badge');
        if (totalBadge) totalBadge.innerText = todosOcorrencias.length;

        filtrarEAtualizarTabelaOcorrencias();
    } catch (e) { 
        console.error("Erro detalhado na requisição das Ocorrencias:", e); 
        const tabela = document.getElementById('tabela-ocorrencias') || document.querySelector('tbody');
        if (tabela) {
            tabela.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">⚠️ Erro ao carregar ocorrencias.<br><small class="text-muted">Motivo: ${e.message}</small></td></tr>`;
        }
        
        // Alerta visual de falha no carregamento dos dados
        if (typeof dispararNotificacao === "function") {
            dispararNotificacao("Não foi possível carregar a lista de ocorrencias.", "erro");
        }
    }
}

function filtrarEAtualizarTabelaOcorrencias() {
    const termoPesquisa = document.getElementById('pesquisa-ocorrencias')?.value.toLowerCase() || "";
    
    // Filtra pelo nome da ocorrencia digitada
ocorrenciasFiltradas = todasOcorrencias.filter(c =>
    c.nome && c.nome.toLowerCase().includes(termoPesquisa)
);

// ===============================
// ORDENAÇÃO ALFABÉTICA
// ===============================
ocorrenciasFiltradas.sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
);

// ===============================
// ÚLTIMO CADASTRADO NO TOPO
// ===============================

// Pega o último item cadastrado da API
const ultimoCadastro = todasOcorrencias[todasOcorrencias.length - 1];

if (ultimoCadastro) {

    // Remove ele da posição atual
    ocorrenciasFiltradas = ocorrenciasFiltradas.filter(
        c => c.id_ocorrencias !== ultimoCadastro.id_ocorrencias
    );

    // Adiciona no topo
    ocorrenciasFiltradas.unshift(ultimoCadastro);
}

    const totalPaginas = Math.ceil(ocorrenciasFiltradas.length / ITENS_POR_PAGINA) || 1;
    if (paginaAtualOcorrencias > totalPaginas) paginaAtualOcorrencias = totalPaginas;

    const indiceInicial = (paginaAtualOcorrencias - 1) * ITENS_POR_PAGINA;
    const indiceFinal = indiceInicial + ITENS_POR_PAGINA;
    const ocorrenciasExibidas = ocorrenciasFiltradas.slice(indiceInicial, indiceFinal);

    renderizarTabelaOcorrencias(ocorrenciasExibidas);
    atualizarControlesPaginacaoOcorrencias(totalPaginas);
}

function renderizarTabelaOcorrencias(ocorrencias) {
    const tabela = document.getElementById('tabela-ocorrencias') || document.querySelector('tbody');
    if (!tabela) return;

    if (!ocorrencias || ocorrencias.length === 0) {
        tabela.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum colaborador encontrado.</td></tr>`;
        return;
    }

    tabela.innerHTML = ocorrencias.map(c => {
        // Padronização do ID
        let idBruto = c.id_ocorrencias ?? c.id ?? c._id;
        const ocorrenciasId = idBruto !== undefined ? idBruto.toString().trim() : "";

        if (!ocorrenciaId) {
            return `
                <tr class="table-warning">
                    <td><strong>${c.nome || "Sem Nome"}</strong></td>
                    <td colspan="4" class="text-center">⚠️ Erro: Registro sem ID válido</td>
                </tr>`;
        }

        // =========================================================================
        // PADRONIZAÇÃO DA SITUAÇÃO (AJUSTE CRÍTICO DE PERFORMANCE E REFERÊNCIA)
        // =========================================================================
        // 1. Identifica o id correto do registro para manter o vínculo com o array global
        const idRegistroAtual = c.id_ocorrencias ?? c.id ?? c._id;

        // 2. Identifica com precisão cirúrgica se o registro está ativo
        const registroEstaAtivo = c.ativo === true || c.ativo === "true" || 
                                  (c.ativo === undefined && (c.situacao === "Ativo" || String(c.situacao).toLowerCase() === "ativo")) ||
                                  (c.ativo === undefined && c.situacao === undefined);

        // 3. Define a string exata para o HTML ler na tabela
        let situacaoTratada = registroEstaAtivo ? "Ativo" : "Inativo";

        // 4. ATUALIZAÇÃO DE MEMÓRIA: Sincroniza todas as chaves possíveis para o formulário ler
        c.situacaoTratada = situacaoTratada;
        c.idUnificado = idRegistroAtual; // Garante o ID correto amarrado na linha da tabela
        c.ativo = registroEstaAtivo;     // Garante o booleano puro atualizado no array

        let nomeCargoExibicao = "-";
        const cargoBruto = c.cargos ?? c.cargo ?? c.id_cargos ?? c.id_cargo; 

        if (cargoBruto) {
            if (typeof cargoBruto === 'object') {
                nomeCargoExibicao = cargoBruto.nome || "-";
            } else {
                // CORREÇÃO: Agora 'listaDeCargos' existe e o ID será devidamente cruzado
                const cargoEncontrado = listaDeCargos.find(cargo => {
                    const idCargo = cargo.id_cargos ?? cargo.id ?? cargo._id;
                    return idCargo == cargoBruto;
                });
                
                if (cargoEncontrado) {
                    nomeCargoExibicao = cargoEncontrado.nome;
                } else {
                    nomeCargoExibicao = `Cargo ${cargoBruto}`; // Fallback caso não ache o ID na lista
                }
            }
        }

        // Salva as propriedades unificadas de volta no objeto para uso no Edit
        c.idUnificado = ocorrenciaId;
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
                            onclick="prepararEdicaoPorId('${ocorrenciaId}')" 
                            title="Editar ocorrencia">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger border-0" 
                            onclick="deletarItemGeral('ocorrencias', '${ocorrenciaId}')" 
                            title="Excluir ocorrencia">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function atualizarControlesPaginacaoOcorrencias(totalPaginas) {
    const btnAnterior = document.getElementById('btn-anterior-ocorrencias');
    const btnProximo = document.getElementById('btn-proximo-ocorrencias');
    const infoPaginacao = document.getElementById('info-paginacao-ocorrencias');

    if (infoPaginacao) infoPaginacao.innerText = `Página ${paginaAtualOcorrencias} de ${totalPaginas}`;
    if (btnAnterior) btnAnterior.disabled = (paginaAtualOcorrencias === 1);
    if (btnProximo) btnProximo.disabled = (paginaAtualOcorrencias === totalPaginas);
}

// =========================================================================
// 3. SALVAR OU ATUALIZAR CADASTRO (CREATE / UPDATE)
// =========================================================================
document.getElementById('formOcorrencias')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const campoId = document.getElementById('colab-id');
    const id = campoId ? campoId.value.trim() : "";
    
    const url = id ? `${API_URL}/ocorrencias/${id}` : `${API_URL}/ocorrencias/`;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const selectCargo = document.getElementById('ocorrencias-cargo') || document.querySelector('select[id*="cargo"]');
        const valorCargo = selectCargo ? selectCargo.value : "";
        const idCargoInt = parseInt(valorCargo, 10);

        if (isNaN(idCargoInt)) {
            console.error("Valor capturado no select do cargo:", valorCargo);
            if (typeof dispararNotificacao === "function") {
                dispararNotificacao("Selecione um cargo válido para a ocorrencia.", "erro");
            } else {
                alert("Erro: Não foi possível identificar o código do cargo selecionado.");
            }
            return; 
        }

        // =========================================================================
        // CAPTURA E CONVERSÃO ULTRA RÍGIDA DA SITUAÇÃO (GARANTE FALSE NO BANCO)
        // =========================================================================
        const selectSituacao = document.getElementById('ocorrencias-situacao');
        const valorSituacaoTela = selectSituacao ? selectSituacao.value.toString().trim() : "true";
        
        // Validação estrita: se for exatamente a string "false", assume o booleano false
        const ehAtivoBoolean = (valorSituacaoTela === "true");

        // Monta o payload idêntico à estrutura esperada pela sua API
        const payloadJSON = {
            nome: document.getElementById('ocorrencias-nome')?.value || "",
            matricula: parseInt(document.getElementById('ocorrencias-matricula')?.value, 10) || 0,
            id_cargos: idCargoInt, 
            email: document.getElementById('ocorrencias-email')?.value || "",
            ativo: ehAtivoBoolean // <--- Aqui vai true ou false nativo puro
        };

        // Log de inspeção no painel F12 antes de disparar a requisição HTTP
        console.log(`[Envio API] Método: ${metodo} | URL: ${url} | Payload:`, payloadJSON);

        const res = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payloadJSON)
        });
        
        if (res.ok) { 
            const ehCriacao = metodo === 'POST' || !id; 

            if (typeof dispararNotificacao === "function") {
                const acao = ehCriacao ? 'criar' : 'atualizar';
                const mensagem = ehCriacao ? "Nova ocorrencia cadastrada com sucesso!" : "Cadastro de ocorrencia alterado!";
                dispararNotificacao(mensagem, acao);
            } else {
                const mensagemAlert = ehCriacao ? "Ocorrencia cadastrado com sucesso!" : "Cadastro atualizado com sucesso!";
                alert(mensagemAlert);
            }
            
            // Reseta todos os campos padrão do formulário
            document.getElementById('formOcorrencias').reset();
            
            // CORREÇÃO CRÍTICA: Garante o reset visual do select e esvaziamento do ID
            if (selectSituacao) selectSituacao.value = "true";
            if (campoId) campoId.value = ""; 
            
            // Restaura o título para o modo de criação
            const tituloForm = document.getElementById('titulo-form-colab');
            if (tituloForm) {
                tituloForm.innerHTML = '<i class="bi bi-person-plus text-primary me-2"></i>Novo Colaborador';
            }

            // Atualiza a tabela dinamicamente
            if (typeof listarOcorrenciasCRUD === "function") {
                listarOcorrenciasCRUD();
            }
        } else {
            const erroApi = await res.json().catch(() => ({}));
            console.error("Detalhes do erro do servidor:", erroApi);
            
            if (typeof dispararNotificacao === "function") {
                dispararNotificacao(`Não foi possível salvar os dados do colaborador. Erro ${res.status}`, "erro");
            } else {
                alert(`Erro ao salvar ocorrencia. Status do servidor: ${res.status}`);
            }
        }
    } catch (err) { 
        console.error("Erro no envio:", err);
        if (typeof dispararNotificacao === "function") {
            dispararNotificacao("Erro de conexão ao tentar salvar a ocorrencia.", "erro");
        } else {
            alert("Erro de conexão ao tentar salvar a ocorrencia.");
        }
    }
});

// =========================================================================
// 4. FUNÇÕES DE AUXÍLIO PARA EDIÇÃO (UPDATE)
// =========================================================================
window.prepararEdicaoPorId = function(id) {
    const c = todasOcorrencias.find(colab => {
        const idColab = colab.id_ocorrencias ?? colab.id ?? colab._id;
        return idColab?.toString().trim() === id.toString().trim();
    });
    
    if (!c) {
        console.error("Ocorrencia não encontrada na memória local.");
        if (typeof dispararNotificacao === "function") {
            dispararNotificacao("Erro ao carregar dados da ocorrencia para edição.", "erro");
        }
        return;
    }

    const campoId = document.getElementById('colab-id');
    const campoNome = document.getElementById('ocorrencias-nome');
    const campoMatricula = document.getElementById('ocorrencias-matricula');
    const campoCargo = document.getElementById('ocorrencias-cargo');
    const campoEmail = document.getElementById('ocorrencias-email');
    const campoSituacao = document.getElementById('ocorrencias-situacao');
    
    const idLimpo = (c.id_ocorrencias ?? c.id ?? c._id ?? "").toString().trim();
    
    if (campoId) campoId.value = idLimpo;
    if (campoNome) campoNome.value = c.nome || "";
    if (campoMatricula) campoMatricula.value = c.matricula || "";
    
    if (campoCargo) {
        let idCargoEdicao = "";
        if (c.id_cargos) {
            idCargoEdicao = c.id_cargos;
        } else if (c.id_cargo) { 
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
    
    // =========================================================================
    // CORREÇÃO CRÍTICA: ASSINCRONICIDADE COM TIMEOUT PARA EVITAR RESET DO DOM
    // =========================================================================
    if (campoSituacao) {
        // 1. Identifica se o registro é ativo (true/false) baseado no banco
        const statusAtivo = c.ativo === true || 
                            c.ativo === "true" || 
                            c.situacao === "Ativo" || 
                            String(c.situacao).toLowerCase() === "ativo" ||
                            (c.ativo === undefined && c.situacao === undefined);

        const valorParaOSelect = statusAtivo ? "true" : "false";
        
        // 2. O setTimeout garante que o valor vai ser injetado APÓS qualquer reset de tela
        setTimeout(() => {
            campoSituacao.value = valorParaOSelect;
            campoSituacao.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`[DOM Forçado] Select atualizado para: ${campoSituacao.value}`);
        }, 50);
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
            } else {
                alert("Registro excluído com sucesso!");
            }
            
            if (endpoint === 'ocorrencias') {
                listarOcorrenciasCRUD();
            }
        } else {
            console.error("Erro na exclusão. Status:", res.status);
            if (typeof dispararNotificacao === "function") {
                dispararNotificacao(`Não foi possível excluir o registro. Status: ${res.status}`, "erro");
            } else {
                alert(`Erro ao excluir. O servidor retornou: ${res.status}`);
            }
        }
    } catch (err) {
        console.error("Erro de conexão ao excluir:", err);
        if (typeof dispararNotificacao === "function") {
            dispararNotificacao("Erro de conexão ao tentar excluir o registro.", "erro");
        } else {
            alert("Erro de conexão ao tentar excluir o registro.");
        }
    }
};

// =========================================================================
// 6. OUVINTES DE EVENTOS DA PÁGINA (DOM)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    listarOcorrenciasCRUD();
    carregarCargosNoSelect();

    document.getElementById('pesquisa-colaborador')?.addEventListener('input', () => {
        paginaAtualOcorrencias = 1; 
        filtrarEAtualizarTabelaOcorrencias();
    });

    document.getElementById('btn-anterior-ocorrencia')?.addEventListener('click', () => {
        if (paginaAtualOcorrencias > 1) {
            paginaAtualOcorrencias--;
            filtrarEAtualizarTabelaOcorrencias();
        }
    });

    document.getElementById('btn-proximo-ocorrencias')?.addEventListener('click', () => {
        const totalPaginas = Math.ceil(ocorrenciasFiltrados.length / ITENS_POR_PAGINA) || 1;
        if (paginaAtualOcorrencias < totalPaginas) {
            paginaAtualOcorrencias++;
            filtrarEAtualizarTabelaOcorrencias();
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