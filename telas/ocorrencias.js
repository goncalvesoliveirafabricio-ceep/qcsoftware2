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
let listaDeOcorrencias = [];     // CORREÇÃO: Declarada globalmente para evitar o erro "is not defined"

// =========================================================================
// 1. CARREGAR OPÇÕES DO SELECT DE MÁQUINAS (DINÂMICO)
// =========================================================================
async function carregarMaquinasNoSelect() {
    const inputBusca = document.getElementById('maquinas-nome-busca');
    const datalistMaquinas = document.getElementById('lista-maquinas-datalist');
    const inputIdOculto = document.getElementById('maquinas-nome') || document.querySelector('input[id*="maquinas"]:not([id*="situacao"])');

    if (!inputBusca || !datalistMaquinas || !inputIdOculto) return;

    try {
        const res = await fetch(`${API_URL}/maquinas/`, { cache: 'no-store' });
        if (res.ok) {
            const maquinas = await res.json();
            window.listaDeMaquinas = maquinas;

            // 1. Ordena as máquinas em ordem alfabética pelo nome
            maquinas.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
            
            // 2. Vincula o input de busca ao datalist
            inputBusca.setAttribute('list', 'lista-maquinas-datalist');

            // 3. Popula o datalist mapeando a chave em minúsculo do seu banco
            datalistMaquinas.innerHTML = maquinas.map(m => {
                const id_Maquinas = m.id_maquinas || m.id;
                return `<option value="${m.nome}" data-id="${id_Maquinas}"></option>`;
            }).join('');

            // 4. FUNÇÃO REVERSA PARA A EDIÇÃO
            window.atualizarInputVisualMaquina = function(idAlvo) {
                if (!idAlvo) {
                    inputBusca.value = "";
                    inputIdOculto.value = "";
                    return;
                }
                const opcao = Array.from(datalistMaquinas.options).find(opt => opt.getAttribute('data-id')?.toString() === idAlvo?.toString());
                if (opcao) {
                    inputBusca.value = opcao.value;
                    inputIdOculto.value = idAlvo;
                } else {
                    inputBusca.value = "";
                    inputIdOculto.value = "";
                }
            };

            // 5. Evento inteligente para capturar a seleção do usuário
            inputBusca.addEventListener('input', function() {
                const valorDigitado = this.value.trim();
                const opcaoSelecionada = Array.from(datalistMaquinas.options).find(opt => opt.value.trim() === valorDigitado);

                if (opcaoSelecionada) {
                    inputIdOculto.value = opcaoSelecionada.getAttribute('data-id');
                } else {
                    // Só esvazia o ID se o campo estiver completamente em branco
                    if (valorDigitado === "") inputIdOculto.value = "";
                }
            });
        }
    } catch (e) {
        console.error("Erro ao carregar e ordenar máquinas para o formulário:", e);
    }
}
document.addEventListener('DOMContentLoaded', carregarMaquinasNoSelect);

// =========================================================================
// 1.1 CARREGAR OPÇÕES DO SELECT DE COLABORADORES (DINÂMICO)
// =========================================================================
async function carregarColaboradoresNoSelect() {
    const inputBusca = document.getElementById('colaboradores-nome-busca');
    const datalistColaboradores = document.getElementById('lista-colaboradores-datalist');
    const inputIdOculto = document.getElementById('colaboradores-nome') || document.querySelector('input[id*="colaboradores"]:not([id*="situacao"])');

    if (!inputBusca || !datalistColaboradores || !inputIdOculto) return;

    try {
        const res = await fetch(`${API_URL}/colaboradores/`, { cache: 'no-store' });
        if (res.ok) {
            const colaboradores = await res.json();
            window.listaDeColaboradores = colaboradores;

            // 1. Ordena os colaboradores em ordem alfabética pelo nome
            colaboradores.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
            
            // 2. Vincula o input de busca ao datalist
            inputBusca.setAttribute('list', 'lista-colaboradores-datalist');

            // 3. Popula o datalist mapeando a chave id_colaboradores do banco
            datalistColaboradores.innerHTML = colaboradores.map(c => {
                const id_Colaboradores = c.id_colaboradores || c.id_Colaboradores || c.id;
                return `<option value="${c.nome}" data-id="${id_Colaboradores}"></option>`;
            }).join('');

            // 4. FUNÇÃO REVERSA PARA A EDIÇÃO
            window.atualizarInputVisualColaboradores = function(idAlvo) {
                if (!idAlvo) {
                    inputBusca.value = "";
                    inputIdOculto.value = "";
                    return;
                }
                const opcao = Array.from(datalistColaboradores.options).find(opt => opt.getAttribute('data-id')?.toString() === idAlvo?.toString());
                if (opcao) {
                    inputBusca.value = opcao.value;
                    inputIdOculto.value = idAlvo;
                } else {
                    inputBusca.value = "";
                    inputIdOculto.value = "";
                }
            };

            // 5. Evento inteligente para capturar a seleção do usuário
            inputBusca.addEventListener('input', function() {
                const valorDigitado = this.value.trim();
                const opcaoSelecionada = Array.from(datalistColaboradores.options).find(opt => opt.value.trim() === valorDigitado);

                if (opcaoSelecionada) {
                    inputIdOculto.value = opcaoSelecionada.getAttribute('data-id');
                } else {
                    if (valorDigitado === "") inputIdOculto.value = "";
                }
            });
        }
    } catch (e) {
        console.error("Erro ao carregar e ordenar colaboradores para o formulário:", e);
    }
}
document.addEventListener('DOMContentLoaded', carregarColaboradoresNoSelect);

// =========================================================================
// 1.1.1 CARREGAR OPÇÕES DO SELECT DE PRODUTOS (DINÂMICO)
// =========================================================================
async function carregarProdutosNoSelect() {
    const inputBusca = document.getElementById('produtos-nome-busca');
    const datalistProdutos = document.getElementById('lista-produtos-datalist');
    const inputIdOculto = document.getElementById('produtos-nome') || document.querySelector('input[id*="produtos"]:not([id*="situacao"])');

    if (!inputBusca || !datalistProdutos || !inputIdOculto) return;

    try {
        const res = await fetch(`${API_URL}/produtos/`, { cache: 'no-store' });
        if (res.ok) {
            const produtos = await res.json();
            window.listaDeProdutos = produtos;

            // 1. Ordena os produtos em ordem alfabética pelo nome
            produtos.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
            
            // 2. Vincula o input de busca ao datalist
            inputBusca.setAttribute('list', 'lista-produtos-datalist');

            // 3. Popula o datalist mapeando a chave id_produtos do banco
            datalistProdutos.innerHTML = produtos.map(p => {
                const id_Produtos = p.id_produtos || p.id_Produtos || p.id;
                return `<option value="${p.nome}" data-id="${id_Produtos}"></option>`;
            }).join('');

            // 4. FUNÇÃO REVERSA PARA A EDIÇÃO
            window.atualizarInputVisualProdutos = function(idAlvo) {
                if (!idAlvo) {
                    inputBusca.value = "";
                    inputIdOculto.value = "";
                    return;
                }
                const opcao = Array.from(datalistProdutos.options).find(opt => opt.getAttribute('data-id')?.toString() === idAlvo?.toString());
                if (opcao) {
                    inputBusca.value = opcao.value;
                    inputIdOculto.value = idAlvo;
                } else {
                    inputBusca.value = "";
                    inputIdOculto.value = "";
                }
            };

            // 5. Evento inteligente para capturar a seleção do usuário
            inputBusca.addEventListener('input', function() {
                const valorDigitado = this.value.trim();
                const opcaoSelecionada = Array.from(datalistProdutos.options).find(opt => opt.value.trim() === valorDigitado);

                if (opcaoSelecionada) {
                    inputIdOculto.value = opcaoSelecionada.getAttribute('data-id');
                } else {
                    if (valorDigitado === "") inputIdOculto.value = "";
                }
            });
        }
    } catch (e) {
        console.error("Erro ao carregar e ordenar produtos para o formulário:", e);
    }
}
document.addEventListener('DOMContentLoaded', carregarProdutosNoSelect);

// =========================================================================
// 2. LISTAR OCORRENCIAS (READ com Filtro e Paginação)
// =========================================================================
async function listarOcorrenciasCRUD() {
    try {
        const res = await fetch(`${API_URL}/ocorrencias/`);
        cache: 'no-store' // <--- ISSO DIZ PARA O NAVEGADOR BUSCAR SEMPRE DO BANCO

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
    console.log("-> Botão Salvar clicado. Iniciando validação e envio...");
    
    const campoId = document.getElementById('ocorrencias-id');
    const id = campoId ? campoId.value.trim() : "";
    
    const urlBase = typeof API_URL !== "undefined" ? API_URL : ""; 
    const url = id ? `${urlBase}/ocorrencias/${id}` : `${urlBase}/ocorrencias/`;
    const metodo = id ? 'PUT' : 'POST';

    try {
        // ==========================================
        // AUXILIAR DE CAPTURA DE ID DO DATALIST
        // ==========================================
        const obtenerIdValido = (idInputBusca, idDatalist, idInputHidden) => {
            const inputBusca = document.getElementById(idInputBusca);
            const inputHidden = document.getElementById(idInputHidden);
            const datalist = document.getElementById(idDatalist);
            
            let idFinal = parseInt(inputHidden?.value, 10);
            
            if ((isNaN(idFinal) || idFinal <= 0) && inputBusca && inputBusca.value.trim() !== "" && datalist) {
                const opcao = Array.from(datalist.options).find(opt => opt.value.trim() === inputBusca.value.trim());
                if (opcao) {
                    idFinal = parseInt(opcao.getAttribute('data-id') || opcao.id, 10);
                    if (inputHidden) inputHidden.value = idFinal;
                }
            }
            return idFinal;
        };

        const idMaquinasInt = obtenerIdValido('maquinas-nome-busca', 'lista-maquinas-datalist', 'maquinas-nome');
        const idColaboradoresInt = obtenerIdValido('colaboradores-nome-busca', 'lista-colaboradores-datalist', 'colaboradores-nome');
        const idProdutosInt = obtenerIdValido('produtos-nome-busca', 'lista-produtos-datalist', 'produtos-nome');

        if (isNaN(idMaquinasInt) || idMaquinasInt <= 0) { alert("Por favor, selecione uma Máquina válida."); return; }
        if (isNaN(idColaboradoresInt) || idColaboradoresInt <= 0) { alert("Por favor, selecione um Colaborador válido."); return; }
        if (isNaN(idProdutosInt) || idProdutosInt <= 0) { alert("Por favor, selecione um Produto válido."); return; }

// =========================================================================
        // CONVERSÃO CRÍTICA: FOTO PARA BASE64 (CORRIGIDO ESCOPO)
        // =========================================================================
        const inputFoto = document.getElementById('ocorrencias-foto-ocorrencia');
        let fotoBase64 = ""; // Declarada aqui fora, garante que SEMPRE existirá (vazia ou preenchida)

        if (inputFoto && inputFoto.files && inputFoto.files[0]) {
            const arquivo = inputFoto.files[0];
            
            // Validação de tamanho (máximo 5MB)
            if (arquivo.size > 5 * 1024 * 1024) {
                alert("A imagem selecionada é muito pesada! Escolha uma foto de até 5MB.");
                return; // Para a execução se o arquivo for muito grande
            }

            // Transforma o arquivo em Base64 de forma assíncrona
            fotoBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(arquivo);
            });
        }

        // =========================================================================
        // PADRONIZAÇÃO HIGIENIZADA DA SITUAÇÃO (EVITA QUEBRA NO BANCO)
        // =========================================================================
        const selectSituacao = document.getElementById('ocorrencias-situacao');
        let situacaoTexto = selectSituacao ? selectSituacao.value.trim() : "Pendente";

        // Força a padronização exata independente de como veio do HTML
        const situacaoLower = situacaoTexto.toLowerCase();
        
        if (situacaoLower === "em andamento") {
            situacaoTexto = "Em andamento";
        } else if (situacaoLower === "em análise" || situacaoLower === "em analise") {
            situacaoTexto = "Em análise";
        } else if (situacaoLower === "concluído" || situacaoLower === "concluido") {
            situacaoTexto = "Concluído";
        } else if (situacaoLower === "pendente") {
            situacaoTexto = "Pendente";
        } else {
            situacaoTexto = "Pendente"; // Fallback seguro caso venha vazio ou inválido
        }

        // =========================================================================
        // 2. TRATAMENTO SEGURO DAS DATAS (EVITA ERRO DE CONVERSÃO NO POSTGRES)
        // =========================================================================
        const campoDataOcorrencia = document.getElementById('ocorrencias-data')?.value;
        // Transforma o formato do HTML "2026-06-09T20:23" no formato aceito pelo SQL "2026-06-09 20:23:00"
        let dataOcorrenciaIso = campoDataOcorrencia 
            ? campoDataOcorrencia.replace('T', ' ') 
            : new Date().toISOString().slice(0, 19).replace('T', ' ');

        const campoDataPrazo = document.getElementById('ocorrencias-data-prazo')?.value;
        // Se o prazo estiver em branco, envia explicitamente null em vez de "" para não estourar o banco
        let dataPrazoTratada = campoDataPrazo && campoDataPrazo.trim() !== "" ? campoDataPrazo : null;

        // =========================================================================
        // 3. TRATAMENTO DA FOTO (MUDADO PARA NULL SE ESTIVER VAZIA)
        // =========================================================================
        // CORREÇÃO: Em vez de enviar "", enviamos null puro. Isso limpa a coluna no banco sem erros de tipo.
        let fotoData = (typeof fotoBase64 !== "undefined" && fotoBase64 && fotoBase64.trim() !== "") ? fotoBase64 : null;

        // =========================================================================
        // 4. MONTAGEM DO PAYLOAD BLINDADO E COMPLETO
        // =========================================================================
        const payloadJSON = {
            numero_ocorrencias: parseInt(document.getElementById('ocorrencias-numero')?.value, 10) || 0,
            data_ocorrencias: dataOcorrenciaIso,
            id_maquinas: idMaquinasInt,
            id_colaboradores: idColaboradoresInt,
            id_produtos: idProdutosInt,
            lote_produtos: document.getElementById('ocorrencias-lote-produto')?.value || "0",
            numero_nota: parseInt(document.getElementById('ocorrencias-numero-nota-fiscal')?.value, 10) || 0,
            problema: document.getElementById('ocorrencias-problema')?.value || "",
            falha_onde: document.getElementById('ocorrencias-falha-onde')?.value || "Não informado",
            falha_como: document.getElementById('ocorrencias-falha-como')?.value || "",
            falha_quando: document.getElementById('ocorrencias-falha-quando')?.value || "",
            falha_quem: document.getElementById('ocorrencias-falha-quem')?.value || "",
            observacoes: document.getElementById('ocorrencias-observacoes')?.value || "",
            acao_corretiva: document.getElementById('ocorrencias-acao-corretiva')?.value || "",
            data_prazo: dataPrazoTratada, 
            situacao: situacaoTexto, // String higienizada e garantida dentro das Constraints do banco
            foto: fotoData          // Envia a string Base64 legítima ou null
        };

        console.log(`[Envio API] Enviando dados via ${metodo}:`, payloadJSON);

        const res = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payloadJSON)
        });
        
        if (res.ok) { 
            alert("Cadastro realizado com sucesso!");

            if (typeof dispararNotificacao === "function") {
                const ehCriacao = metodo === 'POST' || !id;
                dispararNotificacao(ehCriacao ? "Nova ocorrência cadastrada!" : "Cadastro alterado!", ehCriacao ? 'criar' : 'atualizar');
            }
            
            // 1. LIMPEZA PADRÃO DA TELA (Isso limpa todos os campos, inclusive a data)
            document.getElementById('formOcorrencias').reset();
            
            // 2. REINSERÇÃO DA DATA E HORA ATUAL (Roda logo após o reset para preencher novamente)
            const inputDataOcorrencia = document.getElementById('ocorrencias-data');
                if (inputDataOcorrencia) {
                    inputDataOcorrencia.value = obterDataHoraAtualLocal();
    }

            // 3. LIMPEZA DOS CAMPOS OCULTOS E EXTRAS
            if (campoId) campoId.value = ""; 
            document.getElementById('maquinas-nome').value = "";
            document.getElementById('produtos-nome').value = "";
            document.getElementById('colaboradores-nome').value = "";
            
            if (selectSituacao) selectSituacao.value = "Pendente";

            // Limpa os textos das buscas visíveis
            document.getElementById('maquinas-nome-busca').value = "";
            document.getElementById('colaboradores-nome-busca').value = "";
            document.getElementById('produtos-nome-busca').value = "";

            // Limpa a miniatura da foto se a função existir
            if (typeof resetarVisualFoto === "function") {
                resetarVisualFoto();
            }

            const tituloForm = document.getElementById('titulo-form-colab');
            if (tituloForm) {
                tituloForm.innerHTML = '<i class="sidebar-texto fa-solid fa-triangle-exclamation me-3"></i> Nova Ocorrência';
            }

            if (typeof listarOcorrenciasCRUD === "function") {
                listarOcorrenciasCRUD();
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });

        } else {
            const erroApi = await res.json().catch(() => ({}));
            console.error("Erro retornado pelo servidor:", erroApi);
            alert(`Erro ao salvar ocorrência: ${erroApi.detail || "Dados inconsistentes."}`);
        }
    } catch (err) { 
        console.error("Falha grave na requisição:", err);
        alert("Erro de conexão com o servidor.");
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('dropzone-foto');
    const inputFoto = document.getElementById('ocorrencias-foto-ocorrencia');
    const previewContainer = document.getElementById('preview-container');
    const uploadInstrucoes = document.getElementById('upload-instrucoes');
    const fotoPreview = document.getElementById('foto-preview');
    const btnRemover = document.getElementById('btn-remover-foto');

    if (!dropzone || !inputFoto) return;

    // --- 1. FUNÇÃO DE PROCESSAMENTO E PREVIEW DA IMAGEM ---
    function processarArquivoFoto(arquivo) {
        if (!arquivo) return;

        // Validação de tipo de arquivo
        if (!arquivo.type.startsWith('image/')) {
            alert("Por favor, selecione apenas arquivos de imagem (PNG, JPG, JPEG).");
            return;
        }

        // Validação de tamanho (5MB máximo)
        if (arquivo.size > 5 * 1024 * 1024) {
            alert("A imagem selecionada é muito pesada! Escolha uma foto de até 5MB.");
            inputFoto.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            if (fotoPreview) fotoPreview.src = event.target.result;
            previewContainer?.classList.remove('d-none');
            uploadInstrucoes?.classList.add('d-none');
        };
        reader.readAsDataURL(arquivo);
    }

    // --- 2. EVENTO DE CLIQUE / TOQUE (Abre a câmera no mobile ou arquivos no PC) ---
    dropzone.addEventListener('click', () => {
        inputFoto.click();
    });

    inputFoto.addEventListener('change', function(e) {
        processarArquivoFoto(e.target.files[0]);
    });

    // --- 3. EVENTOS DE DRAG & DROP (Arrastar e soltar no PC) ---
    // Evita o comportamento padrão do navegador de abrir a imagem em outra aba
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => e.preventDefault(), false);
    });

    // Efeito visual ao passar o arquivo por cima da área
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.add('border-primary', 'bg-light');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.remove('border-primary', 'bg-light');
        }, false);
    });

    // Captura o arquivo solto na Dropzone
    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const arquivos = dt.files;
        
        if (arquivos.length > 0) {
            inputFoto.files = arquivos; // Sincroniza o arquivo arrastado com o input hidden
            processarArquivoFoto(arquivos[0]);
        }
    });

    // --- 4. BOTÃO REMOVER FOTO (O botão X vermelho) ---
    btnRemover?.addEventListener('click', function(e) {
        e.stopPropagation(); // Impede que o clique no X abra a câmera novamente
        inputFoto.value = ""; // Reseta o input
        if (fotoPreview) fotoPreview.src = "";
        previewContainer?.classList.add('d-none');
        uploadInstrucoes?.classList.remove('d-none');
    });
});

// --- 5. FUNÇÃO DE RESET GLOBAL ---
// Chame esta função 'resetarVisualFoto()' dentro do 'if (res.ok)' do seu evento 'submit'
// logo após rodar o formOcorrencias.reset(), para limpar a miniatura da tela!
function resetarVisualFoto() {
    const previewContainer = document.getElementById('preview-container');
    const uploadInstrucoes = document.getElementById('upload-instrucoes');
    const fotoPreview = document.getElementById('foto-preview');
    
    if (fotoPreview) fotoPreview.src = "";
    previewContainer?.classList.add('d-none');
    uploadInstrucoes?.classList.remove('d-none');
}

// Função para obter a data/hora atual local formatada para o input datetime-local
function obterDataHoraAtualLocal() {
    const agora = new Date();
    // Ajusta o fuso horário para o horário local da máquina
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}T${horas}:${minutos}`;
}

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