const API_URL = "https://qcsoftware2.onrender.com";

let paginaAtual = 1;
const ITENS_POR_PAGINA = 10;

// =========================================================================
// VARIÁVEIS DE CONTROLE DE ESTADO PARA OCORRENCIAS
// =========================================================================
let todasOcorrencias = [];       // Armazena a lista bruta vinda da API
let OcorrenciasFiltradas = [];   // Armazena o resultado da busca por nome
let paginaAtualOcorrencias = 1;  // Controle de paginação exclusivo
let listaDeOcorrencias = [];     // Declarada globalmente para evitar o erro "is not defined"
let listaDeCargos = [];          // Adicionado fallback para evitar erro de referência se não declarada global em outro arquivo

// CORREÇÃO CRÍTICA: Auxiliar para obter data local formatada no Fuso de Brasília (UTC-3)
function obterDataHoraAtualLocal() {
    const agora = new Date();
    const formatador = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const partes = formatador.formatToParts(agora);
    const d = partes.find(p => p.type === 'day').value;
    const m = partes.find(p => p.type === 'month').value;
    const a = partes.find(p => p.type === 'year').value;
    const h = partes.find(p => p.type === 'hour').value;
    const min = partes.find(p => p.type === 'minute').value;

    return `${a}-${m}-${d}T${h}:${min}`;
}

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

            colaboradores.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
            
            inputBusca.setAttribute('list', 'lista-colaboradores-datalist');

            datalistColaboradores.innerHTML = colaboradores.map(c => {
                const id_Colaboradores = c.id_colaboradores || c.id_Colaboradores || c.id;
                return `<option value="${c.nome}" data-id="${id_Colaboradores}"></option>`;
            }).join('');

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

            produtos.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
            
            inputBusca.setAttribute('list', 'lista-produtos-datalist');

            datalistProdutos.innerHTML = produtos.map(p => {
                const id_Produtos = p.id_produtos || p.id_Produtos || p.id;
                return `<option value="${p.nome}" data-id="${id_Produtos}"></option>`;
            }).join('');

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
        const res = await fetch(`${API_URL}/ocorrencias/`, { cache: 'no-store' });

        if (!res.ok) throw new Error(`Erro no servidor: Status ${res.status}`);

        todasOcorrencias = await res.json();
        
        const totalBadge = document.getElementById('total-ocorrencias') || document.querySelector('.badge');
        if (totalBadge) totalBadge.innerText = todasOcorrencias.length;

        filtrarEAtualizarTabelaOcorrencias();
    } catch (e) { 
        console.error("Erro detalhado na requisição das Ocorrencias:", e); 
        const tabela = document.getElementById('tabela-ocorrencias') || document.querySelector('tbody');
        if (tabela) {
            tabela.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">⚠️ Erro ao carregar ocorrencias.<br><small class="text-muted">Motivo: ${e.message}</small></td></tr>`;
        }
    }
}

function filtrarEAtualizarTabelaOcorrencias() {
    const termoPesquisa = document.getElementById('pesquisa-ocorrencias')?.value.toLowerCase() || "";
    
    OcorrenciasFiltradas = todasOcorrencias.filter(c =>
        c.nome && c.nome.toLowerCase().includes(termoPesquisa)
    );

    // ORDENAÇÃO ALFABÉTICA
    OcorrenciasFiltradas.sort((a, b) =>
        (a.nome || "").localeCompare(b.nome || "", 'pt-BR', { sensitivity: 'base' })
    );

    // ÚLTIMO CADASTRADO NO TOPO
    const ultimoCadastro = todasOcorrencias[todasOcorrencias.length - 1];

    if (ultimoCadastro) {
        OcorrenciasFiltradas = OcorrenciasFiltradas.filter(
            c => (c.id_ocorrencias ?? c.id) !== (ultimoCadastro.id_ocorrencias ?? ultimoCadastro.id)
        );
        OcorrenciasFiltradas.unshift(ultimoCadastro);
    }

    const totalPaginas = Math.ceil(OcorrenciasFiltradas.length / ITENS_POR_PAGINA) || 1;
    if (paginaAtualOcorrencias > totalPaginas) paginaAtualOcorrencias = totalPaginas;

    const indiceInicial = (paginaAtualOcorrencias - 1) * ITENS_POR_PAGINA;
    const indiceFinal = indiceInicial + ITENS_POR_PAGINA;
    const ocorrenciasExibidas = OcorrenciasFiltradas.slice(indiceInicial, indiceFinal);

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
        let idBruto = c.id_ocorrencias ?? c.id ?? c._id;
        const ocorrenciaId = idBruto !== undefined ? idBruto.toString().trim() : ""; 

        if (!ocorrenciaId) {
            return `
                <tr class="table-warning">
                    <td><strong>${c.nome || "Sem Nome"}</strong></td>
                    <td colspan="4" class="text-center">⚠️ Erro: Registro sem ID válido</td>
                </tr>`;
        }

        const idRegistroAtual = idBruto;

        const registroEstaAtivo = c.ativo === true || c.ativo === "true" || 
                                  (c.ativo === undefined && (c.situacao === "Ativo" || String(c.situacao).toLowerCase() === "ativo")) ||
                                  (c.ativo === undefined && c.situacao === undefined);

        let situacaoTratada = registroEstaAtivo ? "Ativo" : "Inativo";

        c.situacaoTratada = situacaoTratada;
        c.idUnificado = idRegistroAtual; 
        c.ativo = registroEstaAtivo;     

        let nomeCargoExibicao = "-";
        const cargoBruto = c.cargos ?? c.cargo ?? c.id_cargos ?? c.id_cargo; 

        if (cargoBruto) {
            if (typeof cargoBruto === 'object') {
                nomeCargoExibicao = cargoBruto.nome || "-";
            } else if (Array.isArray(listaDeCargos)) {
                const cargoEncontrado = listaDeCargos.find(cargo => {
                    const idCargo = cargo.id_cargos ?? cargo.id ?? cargo._id;
                    return idCargo == cargoBruto;
                });
                
                if (cargoEncontrado) {
                    nomeCargoExibicao = cargoEncontrado.nome;
                } else {
                    nomeCargoExibicao = `Cargo ${cargoBruto}`; 
                }
            }
        }

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

        // CORREÇÃO CRÍTICA: Captura a foto diretamente do elemento visual preview (Base64) antes de qualquer limpeza
        const imgPreview = document.getElementById('foto-preview');
        let fotoBase64 = (imgPreview && imgPreview.src && imgPreview.src.startsWith('data:image')) ? imgPreview.src : null;

        const selectSituacao = document.getElementById('ocorrencias-situacao');
        let situacaoTexto = selectSituacao ? selectSituacao.value.trim() : "Pendente";
        const situacaoLower = situacaoTexto.toLowerCase();
        
        if (situacaoLower === "em andamento") {
            situacaoTexto = "Em andamento";
        } else if (situacaoLower === "em análise" || situacaoLower === "em analise") {
            situacaoTexto = "Em análise";
        } else if (situacaoLower === "concluído" || situacaoLower === "concluido") {
            situacaoTexto = "Concluído";
        } else {
            situacaoTexto = "Pendente"; 
        }

        const campoDataOcorrencia = document.getElementById('ocorrencias-data')?.value;
        let dataOcorrenciaIso = campoDataOcorrencia 
            ? campoDataOcorrencia.replace('T', ' ') 
            : new Date().toISOString().slice(0, 19).replace('T', ' ');

        const campoDataPrazo = document.getElementById('ocorrencias-data-prazo')?.value;
        let dataPrazoTratada = campoDataPrazo && campoDataPrazo.trim() !== "" ? campoDataPrazo : null;

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
            situacao: situacaoTexto, 
            foto: fotoBase64          
        };

        console.log(`[Envio API] Enviando dados via ${metodo}:`, payloadJSON);

        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadJSON)
        });
        
        if (res.ok) { 
            dispararNotificacao(id ? "Ocorrência alterada com sucesso!" : "Nova ocorrência cadastrada com sucesso!", id ? "atualizar" : "criar");

            // CORREÇÃO FLUXO DE SEGURANÇA: Reseta o formulário apenas após a confirmação da API
            document.getElementById('formOcorrencias').reset();
            
            const inputDataOcorrencia = document.getElementById('ocorrencias-data');
            if (inputDataOcorrencia) {
                inputDataOcorrencia.value = obterDataHoraAtualLocal();
            }

            if (campoId) campoId.value = ""; 
            document.getElementById('maquinas-nome').value = "";
            document.getElementById('produtos-nome').value = "";
            document.getElementById('colaboradores-nome').value = "";
            
            if (selectSituacao) selectSituacao.value = "Pendente";

            document.getElementById('maquinas-nome-busca').value = "";
            document.getElementById('colaboradores-nome-busca').value = "";
            document.getElementById('produtos-nome-busca').value = "";

            // Reseta a foto de forma visual limpa
            if (typeof resetarVisualFoto === "function") resetarVisualFoto();

            const tituloForm = document.getElementById('titulo-form-colab');
            if (tituloForm) {
                tituloForm.innerHTML = '<i class="sidebar-texto fa-solid fa-triangle-exclamation me-3"></i> Nova Ocorrência';
            }

            if (typeof listarOcorrenciasCRUD === "function") listarOcorrenciasCRUD();

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert("Erro ao salvar ocorrência no servidor.");
        }
    } catch (err) {
        console.error("Erro no processo de salvamento:", err);
        alert("Ocorreu um erro interno ao tentar salvar.");
    }
});

// =========================================================================
// FUNÇÕES AUXILIARES ISOLADAS CORRETAMENTE DO ESCOPO DO EVENTO SUBMIT
// =========================================================================
function salvarOcorrencia(dadosFormulario) {
    const ehCriacao = true; 

    fetch('https://qcsoftware2.onrender.com/ocorrencias/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(dadosFormulario)
    })
    .then(response => {
        if (!response.ok) throw new Error('Erro na resposta do servidor');
        return response.json();
    })
    .then(data => {
        const mensagem = ehCriacao ? "Nova ocorrência cadastrada com sucesso!" : "Ocorrência alterada com sucesso!";
        dispararNotificacao(mensagem, ehCriacao ? 'criar' : 'atualizar');

        const formulario = document.getElementById('formOcorrencias') || document.getElementById('meuFormulario');
        if (formulario) formulario.reset();
    })
    .catch(error => {
        console.error('Erro retornado pelo servidor:', error);
        alert("Erro ao salvar ocorrência.");
    });
}

function dispararNotificacao(mensagem, acao = 'sucesso') {
    const elementoToast = document.getElementById('toast-cadastro');
    const textoToast = document.getElementById('toast-mensagem-texto');
    const iconeToast = document.getElementById('toast-mensagem-icone');
    
    if (!elementoToast || !textoToast) return;

    elementoToast.classList.remove('bg-danger', 'bg-warning', 'bg-primary');
    elementoToast.className = "toast align-items-center text-white bg-success border-0 shadow";
    
    if (acao === 'criar') {
        if (iconeToast) iconeToast.innerHTML = '<i class="bi bi-plus-circle-fill fs-5"></i>';
    } else if (acao === 'atualizar') {
        if (iconeToast) iconeToast.innerHTML = '<i class="bi bi-pencil-square fs-5"></i>';
    } else {
        if (iconeToast) iconeToast.innerHTML = '<i class="bi bi-check-circle-fill fs-5"></i>';
    }

    textoToast.innerText = mensagem;

    if (typeof bootstrap !== "undefined" && bootstrap.Toast) {
        const bootstrapToast = new bootstrap.Toast(elementoToast, { delay: 3500 });
        bootstrapToast.show();
    }
}

// =========================================================================
// 4. CONTROLE DE DRAG AND DROP E CLIQUE PARA FOTO (CELULAR E PC)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('dropzone-foto');
    const inputFoto = document.getElementById('ocorrencias-foto-ocorrencia');
    const previewContainer = document.getElementById('preview-container');
    const uploadInstrucoes = document.getElementById('upload-instrucoes');
    const fotoPreview = document.getElementById('foto-preview');
    const btnRemover = document.getElementById('btn-remover-foto');

    if (!dropzone || !inputFoto) return;

    // CORREÇÃO VISUAL: Estilização do tamanho para enquadrar perfeitamente no mobile
    if (fotoPreview) {
        fotoPreview.style.maxWidth = "100%";
        fotoPreview.style.maxHeight = "250px"; 
        fotoPreview.style.objectFit = "contain"; 
        fotoPreview.style.borderRadius = "8px";
    }

    // Abre câmera ou arquivos nativamente no celular ao clicar na dropzone
    dropzone.addEventListener('click', (e) => {
        if (e.target.closest('#btn-remover-foto')) return;
        inputFoto.click();
    });

    // Efeito visual de arrastar arquivo (opcional para PC)
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-primary');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('border-primary');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-primary');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            inputFoto.files = e.dataTransfer.files; 
            processarArquivoFoto(e.dataTransfer.files[0]);
        }
    });

    function processarArquivoFoto(arquivo) {
        if (!arquivo) return;

        if (!arquivo.type.startsWith('image/')) {
            alert("Por favor, selecione apenas arquivos de imagem (PNG, JPG, JPEG).");
            return;
        }

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

    inputFoto.addEventListener('change', (e) => {
        processarArquivoFoto(e.target.files[0]);
    });

    window.resetarVisualFoto = function() {
        inputFoto.value = "";
        if (fotoPreview) fotoPreview.src = "";
        previewContainer?.classList.add('d-none');
        uploadInstrucoes?.classList.remove('d-none');
    };

    btnRemover?.addEventListener('click', (e) => {
        e.stopPropagation(); 
        window.resetarVisualFoto();
    });
});
    
// =========================================================================
// 5. MANTER RELÓGIO COM DATA E HORA DE BRASÍLIA NA SIDEBAR
// =========================================================================
(function() {
    function atualizarRelogio() {
        const agora = new Date();
        
        const opcoesData = { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' };
        const opcoesHora = { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false };
        
        const dataStr = agora.toLocaleDateString('pt-BR', opcoesData);
        const horaStr = agora.toLocaleTimeString('pt-BR', opcoesHora);
        
        const elData = document.getElementById('data-brasilia');
        const elHora = document.getElementById('hora-brasilia');
        
        if (elData) elData.textContent = dataStr;
        if (elHora) elHora.textContent = horaStr;
    }

    atualizarRelogio();
    setInterval(atualizarRelogio, 10000);
})();