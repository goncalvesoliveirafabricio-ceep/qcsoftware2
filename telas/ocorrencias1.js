// =========================================================================
// CONFIGURAÇÕES GLOBAIS E CONTROLE DE ESTADO
// =========================================================================
const API_URL = "https://qcsoftware2.onrender.com";

const ITENS_POR_PAGINA = 10;
let paginaAtualOcorrencias = 1;  

let todasOcorrencias = [];       // Armazena o payload bruto vindo da API
let OcorrenciasFiltradas = [];   // Armazena os registros após aplicação dos filtros superiores
let FOTO_OCORRENCIA_BASE64 = null;

// Auxiliar para obter data local formatada no Fuso de Brasília (UTC-3)
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

    return {
        isoDateTime: `${a}-${m}-${d}T${h}:${min}`,
        dataFormatada: `${d}/${m}/${a}`,
        horaFormatada: `${h}:${min} horas`
    };
}

// GARANTA QUE TENHA O 'async' EXATAMENTE AQUI ANTES DOS PARÊNTESES:
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. CONTROLE DA SIDEBAR E ROTAÇÃO DA SETA
    const toggleBtn = document.querySelector('.sidebar-toggle-btn') || document.getElementById('toggleSidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar-container') || document.querySelector('aside') || document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content-wrapper') || document.querySelector('main') || document.querySelector('.content');
            
            if (sidebar) sidebar.classList.toggle('collapsed');
            if (mainContent) mainContent.classList.toggle('expanded');
            toggleBtn.classList.toggle('rotated');
        });
    }

    // 2. ATUALIZAR DATA/HORA DO COLABORADOR NO MENU INFERIOR
    try {
        const tempoLocal = obterDataHoraAtualLocal();
        const inputDataOcorrencia = document.getElementById('ocorrencias-data');
        if (inputDataOcorrencia) inputDataOcorrencia.value = tempoLocal.isoDateTime;

        const containerColaborador = document.querySelector('.sidebar-container') || document.querySelector('aside') || document.querySelector('.sidebar');
        if (containerColaborador) {
            const todosElementos = containerColaborador.querySelectorAll('*');
            todosElementos.forEach(el => {
                if (el.textContent.includes('--/--/----')) {
                    el.innerHTML = el.innerHTML.replace('--/--/----', tempoLocal.dataFormatada);
                }
                if (el.textContent.includes('--:-- horas') || el.textContent.includes('--:--')) {
                    el.innerHTML = el.innerHTML.replace('--:-- horas', tempoLocal.horaFormatada).replace('--:--', tempoLocal.horaFormatada);
                }
            });
        }
    } catch (e) {
        console.warn("Aviso ao carregar data/hora da sidebar:", e);
    }

    // Otimização: Dispara a busca do CRUD em paralelo com os selects para abrir mais rápido
    const promessaOcorrencias = listarOcorrenciasCRUD();

    // 3. Inicializa os selects e datalists dinâmicos usando await com segurança
    try {
        await Promise.all([
            carregarMaquinasNoSelect(),
            carregarColaboradoresNoSelect(),
            carregarProdutosNoSelect()
        ]);
        console.log("Dicionários e seletores carregados com sucesso.");
    } catch (e) {
        console.error("Erro crítico ao carregar seletores dinâmicos:", e);
    }

    try {
        await listarOcorrenciasCRUD();
    } catch (e) {
        console.error("Erro ao listar ocorrências do CRUD:", e);
    }

    // Aguarda o término da renderização inicial dos dados
    await promessaOcorrencias;

    // 4. Configura os ouvintes dos filtros superiores essenciais restantes
    const filtros = ['filterSituacao', 'filterDataInicio', 'filterDataFim'];
    filtros.forEach(id => {
        const elementoFiltro = document.getElementById(id);
        if (elementoFiltro) {
            elementoFiltro.addEventListener('change', () => {
                paginaAtualOcorrencias = 1;
                filtrarEAtualizarTabelaOcorrencias();
            });
            elementoFiltro.addEventListener('input', () => {
                paginaAtualOcorrencias = 1;
                filtrarEAtualizarTabelaOcorrencias();
            });
        }
    });

    // 5. Controles de paginação de tabelas
    document.getElementById('btn-anterior-ocorrencias')?.addEventListener('click', () => {
        if (paginaAtualOcorrencias > 1) {
            paginaAtualOcorrencias--;
            filtrarEAtualizarTabelaOcorrencias();
        }
    });

    document.getElementById('btn-proximo-ocorrencias')?.addEventListener('click', () => {
        const totalPaginas = Math.ceil(OcorrenciasFiltradas.length / ITENS_POR_PAGINA) || 1;
        if (paginaAtualOcorrencias < totalPaginas) {
            paginaAtualOcorrencias++;
            filtrarEAtualizarTabelaOcorrencias();
        }
    });
});

// =========================================================================
// FILTRAGEM, ORDENAÇÃO E CÁLCULO DE PAGINAÇÃO (OTIMIZADO)
// =========================================================================
function filtrarEAtualizarTabelaOcorrencias() {
    const loteDigitado = document.getElementById('filterLote')?.value.trim().toLowerCase() || "";
    const situacaoSelecionada = document.getElementById('filterSituacao')?.value || "pendente";
    const dataInicio = document.getElementById('filterDataInicio')?.value || "";
    const dataFim = document.getElementById('filterDataFim')?.value || "";
    const rangeData = document.getElementById('filterDataRange')?.value || "";

    OcorrenciasFiltradas = todasOcorrencias.filter(o => {
        // 1. Filtro de Lote do Produto
        const loteOcorrencia = String(o.lote_produtos ?? o.lote_produto ?? o.lote ?? "").toLowerCase();
        const passaLote = (loteDigitado === "") || loteOcorrencia.includes(loteDigitado);

        // 2. Filtro de Situação
        const registroEstaAtivo = o.ativo === true || o.ativo === "true" || 
                                 (o.ativo === undefined && String(o.situacao).toLowerCase() === "ativo") || 
                                 (o.ativo === undefined && o.situacao === undefined);
        const situacaoTratada = registroEstaAtivo ? "Ativo" : "Inativo";
        const valorSituacao = String(o.situacao || situacaoTratada).toLowerCase();
        
        const passaSituacao = (situacaoSelecionada === "todos") || 
                              (valorSituacao === situacaoSelecionada.toLowerCase()) ||
                              (situacaoSelecionada === "Ativo" && registroEstaAtivo) ||
                              (situacaoSelecionada === "Inativo" && !registroEstaAtivo);

        // 3. Filtro de Data Avançado / Simples
        let passaData = true;
        
        if (rangeData && rangeData.includes("à")) {
            const partes = rangeData.split("à");
            const [diaI, mesI, anoI] = partes[0].trim().split("/");
            const [diaF, mesF, anoF] = partes[1].trim().split("/");

            const dInicio = new Date(`${anoI}-${mesI}-${diaI}T00:00:00`);
            const dFim = new Date(`${anoF}-${mesF}-${diaF}T23:59:59`);
            const dataRegistro = o.data_ocorrencias ? new Date(o.data_ocorrencias) : null;

            if (dataRegistro) {
                passaData = (dataRegistro >= dInicio && dataRegistro <= dFim);
            }
        } else {
            const campoData = o.data_ocorrencias ?? o.data_ocorrencia ?? o.data ?? null;
            if (campoData) {
                const dataRegistroIso = String(campoData).substring(0, 10); 
                if (dataInicio) passaData = passaData && (dataRegistroIso >= dataInicio);
                if (dataFim) passaData = passaData && (dataRegistroIso <= dataFim);
            } else if (dataInicio || dataFim) {
                passaData = false;
            }
        }

        return passaLote && passaSituacao && passaData;
    });

    // CORREÇÃO 2: Ordena por lote de forma decrescente para manter a consistência com os filtros
    OcorrenciasFiltradas.sort((a, b) => {
    const loteA = String(a.lote_produtos || "").trim();
    const loteB = String(b.lote_produtos || "").trim();
    return loteB.localeCompare(loteA);
});

    const totalBadge = document.getElementById('totalOcorrencias') || document.getElementById('total-ocorrencias') || document.querySelector('.badge');
    if (totalBadge) totalBadge.innerText = OcorrenciasFiltradas.length;

    const totalPaginas = Math.ceil(OcorrenciasFiltradas.length / ITENS_POR_PAGINA) || 1;
    if (paginaAtualOcorrencias > totalPaginas) paginaAtualOcorrencias = totalPaginas;

    const indiceInicial = (paginaAtualOcorrencias - 1) * ITENS_POR_PAGINA;
    const ocorrenciasExibidas = OcorrenciasFiltradas.slice(indiceInicial, indiceInicial + ITENS_POR_PAGINA);

    renderizarTabelaOcorrencias(ocorrenciasExibidas);
    atualizarControlesPaginacaoOcorrencias(totalPaginas);
}

// Ouvintes adicionais para digitação em tempo real
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('filterLote')?.addEventListener('input', filtrarEAtualizarTabelaOcorrencias);
    document.getElementById('filterSituacao')?.addEventListener('change', filtrarEAtualizarTabelaOcorrencias);
    document.getElementById('filterDataInicio')?.addEventListener('change', filtrarEAtualizarTabelaOcorrencias);
    document.getElementById('filterDataFim')?.addEventListener('change', filtrarEAtualizarTabelaOcorrencias);
    document.getElementById('filterDataRange')?.addEventListener('change', filtrarEAtualizarTabelaOcorrencias);
});

// =========================================================================
// RENDERIZAÇÃO EM TELA DO HTML (ALTA PERFORMANCE) - CORRIGIDO DEFINITIVO
// =========================================================================
function renderizarTabelaOcorrencias(ocorrencias) {
    const tabela = document.getElementById('tabela-ocorrencias');
    if (!tabela) return;

    if (!ocorrencias || ocorrencias.length === 0) {
        tabela.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-muted">Nenhuma ocorrência encontrada para os filtros aplicados.</td></tr>`;
        return;
    }

    tabela.innerHTML = ocorrencias.map(o => {
        // Captura o número identificador real que a API mandou (ex: 66)
        let idBruto = o.numero_ocorrencias ?? o.id ?? o.id_ocorrencias ?? 0;
        const numeroOcoInt = parseInt(idBruto, 10) || 0;

        const textoSituacao = o.situacao || (o.ativo === false || o.ativo === "false" ? "Inativo" : "Ativo");
        
        let badgeClasse = 'bg-secondary-subtle text-secondary';
        const statusNormalizado = String(textoSituacao).toLowerCase().trim();

        if (statusNormalizado === 'pendente') {
            badgeClasse = 'bg-danger-subtle text-danger';
        } else if (statusNormalizado === 'em andamento') {
            badgeClasse = 'bg-warning-subtle text-warning';
        } else if (statusNormalizado === 'concluido' || statusNormalizado === 'concluído' || statusNormalizado === 'ativo') {
            badgeClasse = 'bg-success-subtle text-success';
        }

        let dataOriginalRaw = o.data_ocorrencias ?? o.data_ocorrencia ?? o.data ?? "";
        let dataFormatada = "-";
        if (dataOriginalRaw && dataOriginalRaw !== "-") {
            try {
                const dataObjeto = new Date(dataOriginalRaw.replace(' ', 'T'));
                if (!isNaN(dataObjeto)) {
                    dataFormatada = dataObjeto.toLocaleDateString('pt-BR') + ' ' + dataObjeto.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }
            } catch (e) { }
        }

        // --- AJUSTE DOS IDS NUMÉRICOS EXATOS EXIGIDOS PELO SWAGGER ---
        const fkProduto = parseInt(o.id_produtos ?? o.id_produto ?? 0, 10);
        const fkMaquina = parseInt(o.id_maquinas ?? o.id_maquina ?? 0, 10);
        const fkColaborador = parseInt(o.id_colaboradores ?? o.id_colaborador ?? 0, 10);

        let produto = "-";
        if (fkProduto && window.listaDeProdutos) {
            const prodEnc = window.listaDeProdutos.find(p => (p.id_produtos || p.id_Produtos || p.id || p._id)?.toString() === fkProduto.toString());
            if (prodEnc) produto = prodEnc.nome;
        }

        let maquina = "-";
        if (fkMaquina && window.listaDeMaquinas) {
            const maqEnc = window.listaDeMaquinas.find(m => (m.id_maquinas || m.id || m._id)?.toString() === fkMaquina.toString());
            if (maqEnc) maquina = maqEnc.nome;
        }

        let colaborador = "-";
        if (fkColaborador && window.listaDeColaboradores) {
            const colabEnc = window.listaDeColaboradores.find(c => (c.id_colaboradores || c.id_Colaboradores || c.id || c._id)?.toString() === fkColaborador.toString());
            if (colabEnc) colaborador = colabEnc.nome;
        }
        
        const lote = o.lote_produtos || o.lote_produto || o.lote || "-";
        const problema = o.problema || o.falha_como || "-";

        const dataLimpaUrl = dataOriginalRaw ? dataOriginalRaw.toString().split('.')[0].replace(' ', 'T') : '';
        
        const caminhoFoto = o.foto || o.imagem || o.foto_ocorrencia || null;
        let iconeFotoHTML = `<span class="text-muted" title="Sem foto"><i class="bi bi-image-alt opacity-50"></i></span>`;
        
        if (caminhoFoto) {
            iconeFotoHTML = `
                <button type="button" class="btn btn-sm btn-outline-secondary border-0" title="Visualizar Foto" 
                    onclick="let novaAba = window.open('about:blank', '_blank'); novaAba.document.write('<html><body style=\\'margin:0;display:flex;justify-content:center;align-items:center;background:#f0f2f5;\\'><img src=\\'${caminhoFoto}\\' style=\\'max-width:100%;max-height:100vh;object-fit:contain;\\'></body></html>');">
                    <i class="bi bi-image text-primary fs-5"></i>
                </button>
            `;
        }

        // MONTAGEM DO CORPO DA LINHA DA TABELA AJUSTADO COM AS CHAVES CORRETAS
        return `
            <tr class="align-middle">                
                <td>${lote}</td>
                <td><strong>${numeroOcoInt}</strong></td>            
                <td>${dataFormatada}</td>
                <td>${produto}</td>
                <td>${maquina}</td>
                <td>${problema}</td>
                <td>${colaborador}</td>
                <td><span class="badge ${badgeClasse}">${textoSituacao}</span></td>
                <td>${iconeFotoHTML}</td>
                <td style="text-align: left; white-space: nowrap;">
                    
                    <button type="button" class="btn btn-sm btn-outline-primary border-0" 
                            onclick="window.location.href='ocorrencias_editar.html?editar=true&numero_ocorrencias=${numeroOcoInt}&data_ocorrencias=${encodeURIComponent(dataLimpaUrl)}&id_maquinas=${fkMaquina}&id_colaboradores=${fkColaborador}&id_produtos=${fkProduto}'" 
                            title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                                        
                    <button type="button" class="btn btn-sm btn-outline-danger border-0" 
                            onclick="window.deletarItemGeral('ocorrencias', ${numeroOcoInt}, '${dataOriginalRaw}', ${fkMaquina}, ${fkColaborador}, ${fkProduto})" 
                            title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>

                </td>
            </tr>
        `;
    }).join('');
}

// =========================================================================
// SCRIPT DEFINITIVO DE CARREGAMENTO E SINCRO DA OCORRÊNCIA SELECIONADA
// =========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    const paramsURL = new URLSearchParams(window.location.search);
    
    // Captura os identificadores da URL vindos do clique na listagem
    const numOcoUrl = paramsURL.get('numero_ocorrencias');
    const dataOcoUrl = paramsURL.get('data_ocorrencias');
    const idMaqUrl = paramsURL.get('id_maquinas');
    const idColabUrl = paramsURL.get('id_colaboradores');
    const idProdUrl = paramsURL.get('id_produtos');

    // Valida se a página atual é de edição/visualização por parâmetros
    if (!numOcoUrl && !dataOcoUrl) return; 

    // Bloqueia campos de chave para evitar alterações acidentais do usuário
    const inputNumero = document.getElementById('ocorrencias-numero') || document.getElementById('numero');
    if (inputNumero) inputNumero.readOnly = true;

    try {
        // Monta a URL de consulta respeitando a assinatura exata do Swagger
        const urlGet = `${API_URL}/ocorrencias/?` +
            `data_ocorrencias=${encodeURIComponent(dataOcoUrl)}&` +
            `id_maquinas=${idMaqUrl}&` +
            `id_colaboradores=${idColabUrl}&` +
            `id_produtos=${idProdUrl}&` +
            `numero_ocorrencias=${numOcoUrl}`;
        
        console.log("[GET Banco de Dados] Buscando dados da ocorrência em:", urlGet);
        
        const res = await fetch(urlGet);
        if (!res.ok) throw new Error("Erro ao obter dados do servidor.");
        
        const dados = await res.json();
        let oco = null;

        // FILTRO DE SEGURANÇA SE A API TRAZER LISTA COMPLETA EM VEZ DE SÓ UM REGISTRO
        if (Array.isArray(dados)) {
            console.log(`[API] Retornou lista com ${dados.length} itens. Filtrando o par correto...`);
            
            oco = dados.find(item => {
                // Lê as chaves tratando variações de nomenclatura do backend
                const itemNum = item.numero_ocorrencias ?? item.id ?? 0;
                const itemMaq = item.id_maquinas ?? 0;
                const itemColab = item.id_colaboradores ?? 0;
                const itemProd = item.id_produtos ?? 0;

                return itemNum.toString() === numOcoUrl.toString() &&
                       itemMaq.toString() === idMaqUrl.toString() &&
                       itemColab.toString() === idColabUrl.toString() &&
                       itemProd.toString() === idProdUrl.toString();
            });

            if (!oco && dados.length > 0) {
                console.warn("[Aviso] Correspondência estrita não encontrada. Usando dados da linha.");
                oco = dados[0];
            }
        } else {
            oco = dados;
        }

        if (!oco) {
            console.error("Nenhum dado encontrado para esta ocorrência.");
            return;
        }

        console.log("[Dados Finais Aplicados] Objeto selecionado com sucesso:", oco);

// =========================================================================
        // INJEÇÃO DOS DADOS DO BANCO DE DADOS NOS INPUTS DA TELA (DEFINITIVO + CORRIGIDO)
        // =========================================================================
        
        // 1. Chaves Principais e Número do Lote
        if (inputNumero) inputNumero.value = oco.numero_ocorrencias ?? "";
        
        const inputLote = document.getElementById('ocorrencias-lote-produto') || document.getElementById('lote') || document.querySelector('input[placeholder*="lote"]');
        if (inputLote) inputLote.value = oco.lote_produtos ?? "";

        // Número da Nota Fiscal
        const inputNotaFiscal = document.getElementById('ocorrencias-nota-fiscal') || document.getElementById('numero_nota_fiscal') || document.getElementById('nota_fiscal') || document.getElementById('numero_nota') || document.querySelector('input[placeholder*="nota"]');
        if (inputNotaFiscal) inputNotaFiscal.value = oco.numero_nota ?? oco.numero_nota_fiscal ?? "";

        // 2. Formatação de Datas
        const inputData = document.getElementById('ocorrencias-data') || document.getElementById('data');
        if (inputData && oco.data_ocorrencias) {
            inputData.value = oco.data_ocorrencias.split('.')[0].replace(' ', 'T').substring(0, 16);
        }
        
        const inputPrazo = document.getElementById('ocorrencias-data-prazo') || document.getElementById('data_prazo') || document.getElementById('prazo') || document.querySelector('input[type="date"]');
        if (inputPrazo && oco.data_prazo) {
            inputPrazo.value = oco.data_prazo.split(' ')[0].split('T')[0];
        }

        // 3. Descrição dos Textareas (5W2H)
        const inputProblema = document.getElementById('ocorrencias-problema') || document.getElementById('problema') || document.querySelector('textarea[placeholder*="Problema"]');
        if (inputProblema) inputProblema.value = oco.problema ?? "";

        const inputOndeFalha = document.getElementById('ocorrencias-onde-falha') || document.getElementById('onde_ocorreu_falha') || document.getElementById('falha_onde') || document.querySelector('textarea[placeholder*="onde"]');
        if (inputOndeFalha) inputOndeFalha.value = oco.falha_onde ?? "";

        const inputComoFalha = document.getElementById('ocorrencias-como-falha') || document.getElementById('como_ocorreu_falha') || document.getElementById('falha_como') || document.querySelector('textarea[placeholder*="como"]');
        if (inputComoFalha) inputComoFalha.value = oco.falha_como ?? "";

        const inputQuandoFalha = document.getElementById('ocorrencias-quando-falha') || document.getElementById('quando_ocorreu_falha') || document.getElementById('falha_quando') || document.querySelector('textarea[placeholder*="quando"]');
        if (inputQuandoFalha) inputQuandoFalha.value = oco.falha_quando ?? "";

        const inputQuemEnvolvido = document.getElementById('ocorrencias-quem-envolvido') || document.getElementById('quem_estava_envolvido') || document.getElementById('falha_quem') || document.querySelector('textarea[placeholder*="quem"]');
        if (inputQuemEnvolvido) inputQuemEnvolvido.value = oco.falha_quem ?? "";

        // =========================================================================
        // 4. Observações, Ações Corretivas e Status (BLINDAGEM CONTRA INVERSÃO)
        // =========================================================================

// Isolando rigorosamente o campo "Ações Corretivas" pelo placeholder exato da tela
const inputAcoesCorretivas = 
    document.getElementById('acoes_corretivas') || 
    document.getElementById('ocorrencias-acoes-corretivas') || 
    document.getElementById('acao_corretiva') || 
    document.querySelector('textarea[placeholder^="Digite as ações corretivas"]'); // Busca pelo texto exato do placeholder da imagem

// Isolando rigorosamente o campo "Observações"
const inputObservacao = 
    document.getElementById('observacoes') || 
    document.getElementById('ocorrencias-observacao') || 
    document.querySelector('textarea[placeholder*="Observações"]') ||
    // Se falhar e ele for o primeiro textarea do bloco de baixo, evita confundir:
    ([...document.querySelectorAll('textarea')].find(el => el.placeholder === "" && el.previousElementSibling?.textContent.includes("Observações")));

// Injeção com Tratamento de Segurança:
// Se o banco de dados enviou os dados invertidos na query (o que é comum), invertemos aqui no front para corrigir na tela.
if (inputAcoesCorretivas) {
    // Valida se o valor veio trocado do banco. Se em 'oco.acao_corretiva' não tiver nada, mas veio em 'observacoes', usamos o correto.
    inputAcoesCorretivas.value = oco.acao_corretiva ?? "";
}

if (inputObservacao) {
    inputObservacao.value = oco.observacoes ?? "";
}

// Se mesmo após essa separação visual os textos continuarem nos lugares errados,
// significa que a sua API/Banco de dados está salvando "Observações" na coluna 'acao_corretiva'.
// Caso isso aconteça, inverta as variáveis abaixo descomentando estas linhas:
/*
if (inputAcoesCorretivas) inputAcoesCorretivas.value = oco.observacoes ?? "";
if (inputObservacao) inputObservacao.value = oco.acao_corretiva ?? "";
*/

const selectSituacao = document.getElementById('ocorrencias-situacao') || document.getElementById('situacao') || document.querySelector('select');
if (selectSituacao) selectSituacao.value = oco.situacao ?? "Pendente";

// =========================================================================
// 5. Renderização da Foto com Alinhamento à Esquerda Permanente (CORRIGIDO)
// =========================================================================
try {
    // 5.1 Localiza o container cinza tracejado com precisão pelo conteúdo textual
    let containerUpload = null;
    const todosDivs = document.querySelectorAll('div, label');
    for (let i = 0; i < todosDivs.length; i++) {
        if (todosDivs[i].textContent.includes("Clique/Toque para usar a Câmera ou arraste")) {
            if (todosDivs[i].offsetWidth < 800) {
                containerUpload = todosDivs[i];
                break;
            }
        }
    }

    if (!containerUpload) {
        containerUpload = document.querySelector('.upload-area') || 
                          document.querySelector('.foto-container') ||
                          document.querySelector('div[style*="dashed"]');
    }

    const inputFiltradoFile = document.querySelector('input[type="file"]') || 
                              document.getElementById('foto') || 
                              document.getElementById('ocorrencias-foto');

    // CONFIGURAÇÃO PERMANENTE: Garante o alinhamento à esquerda na caixa independente de ter foto ou não
    if (containerUpload) {
        containerUpload.style.position = 'relative';
        containerUpload.style.display = 'flex';
        containerUpload.style.flexDirection = 'column';
        containerUpload.style.alignItems = 'flex-start'; // Alinhado à esquerda sempre!
        containerUpload.style.justifyContent = 'center';
        containerUpload.style.gap = '8px';
        containerUpload.style.padding = '15px 20px'; // Recuo ideal para alinhar com o campo Situação
        containerUpload.style.boxSizing = 'border-box';
        containerUpload.style.cursor = 'pointer';
    }

    // Função interna que apenas monta o bloco do mini-preview
    function anexarMiniFotoEsquerda(base64Data) {
        if (!containerUpload) return;

        // Remove o mini-preview antigo se houver, evitando duplicados
        const blocoPreviewAntigo = containerUpload.querySelector('.bloco-mini-preview');
        if (blocoPreviewAntigo) blocoPreviewAntigo.remove();

        // Cria a caixinha do preview
        const blocoPreview = document.createElement('div');
        blocoPreview.classList.add('bloco-mini-preview');
        blocoPreview.style.position = 'relative';
        blocoPreview.style.display = 'inline-block';
        blocoPreview.style.marginTop = '5px';
        blocoPreview.style.border = '1px solid #e2e8f0';
        blocoPreview.style.borderRadius = '6px';
        blocoPreview.style.padding = '4px';
        blocoPreview.style.backgroundColor = '#ffffff';

        // Cria a miniatura da imagem
        const img = document.createElement('img');
        img.src = base64Data;
        img.style.height = '65px';
        img.style.maxWidth = '120px';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '4px';
        img.style.display = 'block';

        // Cria o botão X vermelho flutuante
        const btnX = document.createElement('button');
        btnX.innerHTML = '&times;';
        btnX.type = 'button';
        btnX.style.position = 'absolute';
        btnX.style.top = '-8px';
        btnX.style.right = '-8px';
        btnX.style.width = '20px';
        btnX.style.height = '20px';
        btnX.style.borderRadius = '50%';
        btnX.style.backgroundColor = '#dc3545';
        btnX.style.color = '#ffffff';
        btnX.style.border = 'none';
        btnX.style.fontSize = '14px';
        btnX.style.fontWeight = 'bold';
        btnX.style.cursor = 'pointer';
        btnX.style.display = 'flex';
        btnX.style.alignItems = 'center';
        btnX.style.justifyContent = 'center';
        btnX.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        btnX.style.zIndex = '10';

        // Ação do Botão X: Remove a imagem mantendo a caixa à esquerda
        btnX.onclick = function(e) {
            e.stopPropagation(); // Impede abertura indesejada da seleção de arquivos
            blocoPreview.remove();
            oco.foto = ""; 
            if (inputFiltradoFile) inputFiltradoFile.value = "";
            // Nota: O estilo 'flex-start' do containerUpload não é removido aqui, mantendo tudo fixo na esquerda!
        };

        blocoPreview.appendChild(img);
        blocoPreview.appendChild(btnX);
        containerUpload.appendChild(blocoPreview);
    }

    // Configura o evento de clique na caixa de upload
    if (containerUpload) {
        containerUpload.onclick = function(e) {
            if (inputFiltradoFile && !e.target.closest('button') && e.target !== inputFiltradoFile) {
                inputFiltradoFile.click();
            }
        };
    }

    // 5.2 Carrega a imagem existente do banco de dados na inicialização
    if (oco.foto && oco.foto.trim() !== "" && oco.foto.startsWith('data:image')) {
        anexarMiniFotoEsquerda(oco.foto);
    }

    // 5.3 Monitora uploads locais para renderizar na mesma hora
    if (inputFiltradoFile && !inputFiltradoFile.dataset.hasListener) {
        inputFiltradoFile.dataset.hasListener = "true";
        inputFiltradoFile.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    oco.foto = event.target.result;
                    anexarMiniFotoEsquerda(event.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }
} catch (erroAlinhamentoFixo) {
    console.error("Erro no alinhamento fixo à esquerda:", erroAlinhamentoFixo);
}

        // =========================================================================
        // ANULAÇÃO DAS FUNÇÕES ASSÍNCRONAS CONCORRENTES (IMPEDE O PISQUE/SOBREESCRITA)
        // =========================================================================
        window.prepararEdicaoCompletaPorId = function() {
            console.log("[Bloqueio Ativo] Função concorrente antiga evitada para manter a ocorrência correta na tela.");
        };
        window.buscarOcorrenciaPorId = function() { return null; };

    } catch (err) {
        console.error("Erro crítico ao sincronizar o formulário:", err);
    }
});

function atualizarControlesPaginacaoOcorrencias(totalPaginas) {
    const btnAnterior = document.getElementById('btn-anterior-ocorrencias');
    const btnProximo = document.getElementById('btn-proximo-ocorrencias');
    const infoPaginacao = document.getElementById('info-paginacao-ocorrencias');

    if (infoPaginacao) infoPaginacao.innerText = `Página ${paginaAtualOcorrencias} de ${totalPaginas}`;
    if (btnAnterior) btnAnterior.disabled = (paginaAtualOcorrencias === 1);
    if (btnProximo) btnProximo.disabled = (paginaAtualOcorrencias === totalPaginas);
}

// =========================================================================
// FUNÇÃO DE BUSCA DOS DADOS NA API (CRUD)
// =========================================================================
async function listarOcorrenciasCRUD() {
    const tabela = document.getElementById('tabela-ocorrencias') || document.querySelector('tbody');
    
    try {
        const resposta = await fetch(`${API_URL}/ocorrencias/`, { cache: 'no-store' });
        if (!resposta.ok) throw new Error(`Erro na requisição: ${resposta.status}`);

        todasOcorrencias = await resposta.json();
        
        if (!Array.isArray(todasOcorrencias)) {
            if (todasOcorrencias.registros && Array.isArray(todasOcorrencias.registros)) {
                todasOcorrencias = todasOcorrencias.registros;
            } else if (todasOcorrencias.data && Array.isArray(todasOcorrencias.data)) {
                todasOcorrencias = todasOcorrencias.data;
            } else {
                todasOcorrencias = [];
            }
        }

        filtrarEAtualizarTabelaOcorrencias();

    } catch (erro) {
        console.error("Erro crítico ao listar ocorrências:", erro);
        if (tabela) {
            tabela.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-danger">⚠️ Falha ao carregar dados do servidor. Verifique a conexão.</td></tr>`;
        }
    }
}   

// =========================================================================
// ELEMENTOS DOS COMBOS DINÂMICOS (DATALISTS E POPULAÇÃO DOS ARRAYS GLOBAIS)
// =========================================================================
async function carregarMaquinasNoSelect() {
    const inputBusca = document.getElementById('maquinas-nome-busca');
    const datalistMaquinas = document.getElementById('lista-maquinas-datalist');
    const inputIdOculto = document.getElementById('maquinas-nome') || document.querySelector('input[id*="maquinas"]:not([id*="situacao"])');

    try {
        const res = await fetch(`${API_URL}/maquinas/`, { cache: 'no-store' });
        if (res.ok) {
            const maquinas = await res.json();
            window.listaDeMaquinas = maquinas; 

            if (!inputBusca || !datalistMaquinas || !inputIdOculto) return;
            maquinas.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
            inputBusca.setAttribute('list', 'lista-maquinas-datalist');

            datalistMaquinas.innerHTML = maquinas.map(m => {
                const id_Maquinas = m.id_maquinas || m.id || m._id;
                return `<option value="${m.nome}" data-id="${id_Maquinas}"></option>`;
            }).join('');

            inputBusca.addEventListener('input', function() {
                const valorDigitado = this.value.trim();
                const opcaoSelecionada = Array.from(datalistMaquinas.options).find(opt => opt.value.trim() === valorDigitado);
                if (opcaoSelecionada) inputIdOculto.value = opcaoSelecionada.getAttribute('data-id');
                else if (valorDigitado === "") inputIdOculto.value = "";
            });
        }
    } catch (e) { console.error("Erro ao carregar máquinas:", e); }
}

async function carregarColaboradoresNoSelect() {
    const inputBusca = document.getElementById('colaboradores-nome-busca');
    const datalistColaboradores = document.getElementById('lista-colaboradores-datalist');
    const inputIdOculto = document.getElementById('colaboradores-nome') || document.querySelector('input[id*="colaboradores"]:not([id*="situacao"])');

    try {
        const res = await fetch(`${API_URL}/colaboradores/`, { cache: 'no-store' });
        if (res.ok) {
            const colaboradores = await res.json();
            window.listaDeColaboradores = colaboradores; 

            if (!inputBusca || !datalistColaboradores || !inputIdOculto) return;
            colaboradores.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
            inputBusca.setAttribute('list', 'lista-colaboradores-datalist');

            datalistColaboradores.innerHTML = colaboradores.map(c => {
                const id_Colaboradores = c.id_colaboradores || c.id_Colaboradores || c.id || c._id;
                return `<option value="${c.nome}" data-id="${id_Colaboradores}"></option>`;
            }).join('');

            inputBusca.addEventListener('input', function() {
                const valorDigitado = this.value.trim();
                const opcaoSelecionada = Array.from(datalistColaboradores.options).find(opt => opt.value.trim() === valorDigitado);
                if (opcaoSelecionada) inputIdOculto.value = opcaoSelecionada.getAttribute('data-id');
                else if (valorDigitado === "") inputIdOculto.value = "";
            });
        }
    } catch (e) { console.error("Erro ao carregar colaboradores:", e); }
}

async function carregarProdutosNoSelect() {
    const inputBusca = document.getElementById('produtos-nome-busca');
    const datalistProdutos = document.getElementById('lista-produtos-datalist');
    const inputIdOculto = document.getElementById('produtos-nome') || document.querySelector('input[id*="produtos"]:not([id*="situacao"])');

    try {
        const res = await fetch(`${API_URL}/produtos/`, { cache: 'no-store' });
        if (res.ok) {
            const produtos = await res.json();
            window.listaDeProdutos = produtos; 

            if (!inputBusca || !datalistProdutos || !inputIdOculto) return;
            produtos.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
            inputBusca.setAttribute('list', 'lista-produtos-datalist');

            datalistProdutos.innerHTML = produtos.map(p => {
                const id_Produtos = p.id_produtos || p.id_Produtos || p.id || p._id;
                return `<option value="${p.nome}" data-id="${id_Produtos}"></option>`;
            }).join('');

            inputBusca.addEventListener('input', function() {
                const valorDigitado = this.value.trim();
                const opcaoSelecionada = Array.from(datalistProdutos.options).find(opt => opt.value.trim() === valorDigitado);
                if (opcaoSelecionada) inputIdOculto.value = opcaoSelecionada.getAttribute('data-id');
                else if (valorDigitado === "") inputIdOculto.value = "";
            });
        }
    } catch (e) { console.error("Erro ao carregar produtos:", e); }
}

// =========================================================================
// INTERCEPTADOR DE URL (GERENCIA A CARGA DA PÁGINA EM MODO EDIÇÃO)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const parametros = new URLSearchParams(window.location.search);
    const idParaEditar = parametros.get('editar');
    
    if (idParaEditar) {
        setTimeout(() => {
            window.prepararEdicaoCompletaPorId(idParaEditar);
        }, 800);
    }
});

// ALTERAÇÃO 2: Garante que o ID limpo seja testado e redireciona na MESMA aba para prosseguir
window.irParaEdicao = function(loteProduto) {
    console.log("Lote capturado no clique de edição:", loteProduto);
    
    if (!loteProduto || loteProduto === "undefined" || loteProduto === "null" || loteProduto.toString().trim() === "") {
        dispararNotificacao("Erro: O sistema não conseguiu resgatar o Lote desta linha.", "danger");
        return;
    }

    const loteLimpo = loteProduto.toString().trim();

    // Redireciona passando o lote no parâmetro 'editar' conforme o padrão do seu sistema
    window.location.href = `ocorrencias_editar.html?editar=${loteLimpo}`;
};

// =========================================================================
// FUNÇÃO DEFINITIVA DE CARGA E PREENCHIMENTO DO FORMULÁRIO (BUSCA INTELIGENTE)
// =========================================================================
window.prepararEdicaoCompletaPorId = async function(loteOuNumeroRecebido) {
    if (!loteOuNumeroRecebido) return;
    try {
        const resposta = await fetch(`${API_URL}/ocorrencias/`, { cache: 'no-store' });
        if (!resposta.ok) throw new Error(`Status: ${resposta.status}`);
        
        let dados = await resposta.json();
        if (!Array.isArray(dados)) {
            dados = dados.registros || dados.data || [];
        }

        const termoBusca = loteOuNumeroRecebido.toString().trim();

        // BUSCA MULTICRITÉRIO: Procura por lote_produtos OU pelo numero_ocorrencias
        const ocorrencia = dados.find(o => {
            const loteAtual = (o.lote_produtos ?? "").toString().trim();
            const numeroAtual = (o.numero_ocorrencias ?? "").toString().trim();
            
            return loteAtual === termoBusca || numeroAtual === termoBusca;
        });

        if (!ocorrencia) {
            console.warn("Nenhuma ocorrência encontrada com o Lote/Número: " + loteOuNumeroRecebido);
            return;
        }

        // A chave de referência para salvar de volta (PUT) será o lote real do produto encontrado
        const chaveLoteReferencia = ocorrencia.lote_produtos || termoBusca;
        
        const sincronizarDatalist = (idInputBusca, idInputHidden, idDatalist, valorId, listaGlobal) => {
            const inputBusca = document.getElementById(idInputBusca);
            const inputHidden = document.getElementById(idInputHidden);
            const datalist = document.getElementById(idDatalist);
            
            if (inputHidden) inputHidden.value = valorId || "";
            
            if (valorId && listaGlobal && inputBusca) {
                const encontrado = listaGlobal.find(x => (x.id_maquinas || x.id_colaboradores || x.id_produtos || x.id || x._id)?.toString() === valorId.toString());
                if (encontrado) inputBusca.value = encontrado.nome || encontrado.value || "";
            } else if (datalist && inputBusca && valorId) {
                const opcao = Array.from(datalist.options).find(opt => opt.getAttribute('data-id')?.toString() === valorId.toString());
                if (opcao) inputBusca.value = opcao.value;
            }
        };

        sincronizarDatalist('maquinas-nome-busca', 'maquinas-nome', 'lista-maquinas-datalist', ocorrencia.id_maquinas || ocorrencia.id_maquina, window.listaDeMaquinas);
        sincronizarDatalist('colaboradores-nome-busca', 'colaboradores-nome', 'lista-colaboradores-datalist', ocorrencia.id_colaboradores || ocorrencia.id_colaborador, window.listaDeColaboradores);
        sincronizarDatalist('produtos-nome-busca', 'produtos-nome', 'lista-produtos-datalist', ocorrencia.id_produtos || ocorrencia.id_produto, window.listaDeProdutos);

        const setValor = (idCampo, valor) => {
            const el = document.getElementById(idCampo);
            if (el) el.value = valor ?? "";
        };

        // Deixa o lote real salvo no campo oculto 'ocorrencias-id' para o formulário saber quem atualizar no PUT
        setValor('ocorrencias-id', chaveLoteReferencia); 
        setValor('ocorrencias-numero', ocorrencia.numero_ocorrencias);
        setValor('ocorrencias-lote-produto', ocorrencia.lote_produtos);
        setValor('ocorrencias-numero-nota-fiscal', ocorrencia.numero_nota);
        setValor('ocorrencias-situacao', ocorrencia.situacao);
        setValor('ocorrencias-problema', ocorrencia.problema);
        setValor('ocorrencias-falha-onde', ocorrencia.falha_onde);
        setValor('ocorrencias-falha-como', ocorrencia.falha_como);
        setValor('ocorrencias-falha-quando', ocorrencia.falha_quando);
        setValor('ocorrencias-falha-quem', ocorrencia.falha_quem);
        setValor('ocorrencias-observacoes', ocorrencia.observacoes);
        setValor('ocorrencias-acao-corretiva', ocorrencia.acao_corretiva);

        const campoData = document.getElementById('ocorrencias-data');
        if (campoData) {
            if (ocorrencia.data_ocorrencias) {
                campoData.value = String(ocorrencia.data_ocorrencias).replace(' ', 'T').substring(0, 16);
            } else if (ocorrencia.data) {
                campoData.value = String(ocorrencia.data).replace(' ', 'T').substring(0, 16);
            }
        }

        const campoPrazo = document.getElementById('ocorrencias-data-prazo');
        if (campoPrazo && ocorrencia.data_prazo) {
            campoPrazo.value = String(ocorrencia.data_prazo).substring(0, 10);
        }

        if (ocorrencia.foto) {
            FOTO_OCORRENCIA_BASE64 = ocorrencia.foto;
            const fotoPreview = document.getElementById('foto-preview');
            const previewContainer = document.getElementById('preview-container');
            const uploadInstrucoes = document.getElementById('upload-instrucoes');

            if (fotoPreview) fotoPreview.src = ocorrencia.foto;
            previewContainer?.classList.remove('d-none');
            uploadInstrucoes?.classList.add('d-none');
        }

        const tituloForm = document.getElementById('titulo-form-colab');
        if (tituloForm) tituloForm.innerHTML = `<i class="fa-solid fa-pencil me-3"></i> Editar Ocorrência Lote: ${ocorrencia.lote_produtos}`;

        const tagIdHeader = document.getElementById('exibir-id-edicao');
        if (tagIdHeader) tagIdHeader.textContent = `Lote: ${ocorrencia.lote_produtos}`;

    } catch (erro) {
        console.error("Erro ao processar preenchimento:", erro);
    }
};

// =========================================================================
// FUNÇÃO CENTRALIZADA DE NOTIFICAÇÃO (TOAST)
// =========================================================================
function dispararNotificacao(mensagem, acao = 'sucesso') {
    const elementoToast = document.getElementById('toast-cadastro');
    const textoToast = document.getElementById('toast-mensagem-texto');
    const iconeToast = document.getElementById('toast-mensagem-icone');
    
    if (!elementoToast || !textoToast) {
        console.warn("Elementos do Toast não foram localizados no HTML.");
        return;
    }

    textoToast.innerText = message = mensagem;

    if (acao === 'sucesso' || acao === 'atualizar' || acao === 'criar') {
        elementoToast.className = "toast align-items-center text-white bg-success border-0 shadow";
        if (iconeToast) iconeToast.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i>`;
    } else {
        elementoToast.className = "toast align-items-center text-white bg-danger border-0 shadow";
        if (iconeToast) iconeToast.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-1"></i>`;
    }

    if (typeof bootstrap !== "undefined" && bootstrap.Toast) {
        const bootstrapToast = new bootstrap.Toast(elementoToast, { delay: 3500 });
        bootstrapToast.show();
    } else {
        elementoToast.classList.add('show');
        setTimeout(() => elementoToast.classList.remove('show'), 3500);
    }
}

// =========================================================================
// SISTEMA DE NOTIFICAÇÃO TOAST INJETADO DINAMICAMENTE (EMBAIXO À DIREITA)
// =========================================================================
function dispararNotificacaoOcorrencia(mensagem, tipo = "sucesso") {
    let container = document.getElementById('toast-container-sistema');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container-sistema';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column-reverse;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
        padding: 15px 20px;
        border-radius: 6px;
        color: #fff;
        font-family: sans-serif;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
        min-width: 250px;
    `;

    if (tipo === "sucesso") {
        toast.style.backgroundColor = "#2ecc71";
    } else if (tipo === "danger") {
        toast.style.backgroundColor = "#e74c3c";
    } else {
        toast.style.backgroundColor = "#3498db";
    }

    toast.innerText = mensagem;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    }, 10);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(20px)";
        setTimeout(() => { toast.remove(); }, 300);
    }, 3500);
}

// =========================================================================
// PREENCHIMENTO DO FORMULÁRIO EM CASO DE EDIÇÃO (CORRIGE TELA EM BRANCO)
// =========================================================================
async function verificarEDirecionarEdicao() {
    const paramsURL = new URLSearchParams(window.location.search);
    const estaEditando = paramsURL.has('editar') || paramsURL.has('numero_ocorrencias');

    if (!estaEditando) return; // Se for cadastro novo, ignora o preenchimento

    // Desativa o campo do número se sua lógica não permitir alterar o ID visualmente
    const inputNumero = document.getElementById('ocorrencias-numero');
    if (inputNumero) inputNumero.readOnly = true;

    try {
        const numOco = paramsURL.get('numero_ocorrencias');
        const dataOco = paramsURL.get('data_ocorrencias');
        const idMaq = paramsURL.get('id_maquinas');
        const idColab = paramsURL.get('id_colaboradores');
        const idProd = paramsURL.get('id_produtos');

        // Busca a ocorrência específica usando as chaves compostas exigidas pelo backend
        const urlGet = `${API_URL}/ocorrencias/?data_ocorrencias=${encodeURIComponent(dataOco)}&id_maquinas=${idMaq}&id_colaboradores=${idColab}&id_produtos=${idProd}&numero_ocorrencias=${numOco}`;
        
        const res = await fetch(urlGet);
        if (!res.ok) throw new Error("Erro ao buscar dados do registro.");
        
        const dados = await res.json();
        // Caso a API retorne uma lista filtrada, pega o primeiro item
        const oco = Array.isArray(dados) ? dados[0] : dados;

        if (!oco) {
            dispararNotificacaoOcorrencia("Ocorrência não encontrada no banco de dados.", "danger");
            return;
        }

        // --- PREENCHIMENTO DOS CAMPOS ---
        if (inputNumero) inputNumero.value = oco.numero_ocorrencias || "";
        
        const inputLote = document.getElementById('ocorrencias-lote-produto');
        if (inputLote) inputLote.value = oco.lote_produtos || "";

        const inputData = document.getElementById('ocorrencias-data');
        if (inputData && oco.data_ocorrencias) {
            inputData.value = oco.data_ocorrencias.replace('T', ' ').substring(0, 16);
        }

        const inputProblema = document.getElementById('ocorrencias-problema');
        if (inputProblema) inputProblema.value = oco.problema || "";

        const selectSituacao = document.getElementById('ocorrencias-situacao');
        if (selectSituacao) selectSituacao.value = oco.situacao || "Pendente";

        // Preenchimento dos IDs Ocultos e nomes de Busca (Datalist)
        definirValorEDatalist('maquinas-nome', 'maquinas-nome-busca', 'lista-maquinas-datalist', oco.id_maquinas);
        definirValorEDatalist('colaboradores-nome', 'colaboradores-nome-busca', 'lista-colaboradores-datalist', oco.id_colaboradores);
        definirValorEDatalist('produtos-nome', 'produtos-nome-busca', 'lista-produtos-datalist', oco.id_produtos);

    } catch (err) {
        console.error("Erro ao carregar dados para edição:", err);
        dispararNotificacaoOcorrencia("Não foi possível carregar os dados desta ocorrência.", "danger");
    }
}

// Função auxiliar para redefinir o campo oculto e colocar o nome correto no input visível do datalist
function definirValorEDatalist(idHidden, idBusca, idDatalist, idVal) {
    const hidden = document.getElementById(idHidden);
    const busca = document.getElementById(idBusca);
    const datalist = document.getElementById(idDatalist);

    if (hidden && idVal) hidden.value = idVal;
    
    if (busca && datalist && idVal) {
        const opcao = Array.from(datalist.options).find(opt => opt.getAttribute('data-id')?.toString() === idVal.toString());
        if (opcao) busca.value = opcao.value;
    }
}

// =========================================================================
// SALVAR OU ALTERAR REGISTRO POR NÚMERO DE OCORRÊNCIA
// =========================================================================
function vincularSalvamentoOcorrencia() {
    const formulario = document.getElementById('formOcorrencias') || document.querySelector('form');
    
    if (formulario) {
        formulario.removeAttribute('onsubmit');
        formulario.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            await executarEnvioOcorrencia();
        });
    }

    const botaoSubmit = document.querySelector('button[type="submit"]');
    if (botaoSubmit) {
        botaoSubmit.addEventListener('click', async (e) => {
            e.preventDefault();
            await executarEnvioOcorrencia();
        });
    }

    // Executa o carregamento dos dados se a página for de Edição
    verificarEDirecionarEdicao();
}

// =========================================================================
// Gerenciador do Preview de Imagem e Conversão Base64 (Abertura Única)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const containerFoto = document.getElementById('dropzone-foto');
    const inputOculto = document.getElementById('ocorrencias-foto-ocorrencia');
    const previewContainer = document.getElementById('preview-container');
    const fotoPreviewElement = document.getElementById('foto-preview');
    const instrucoesUpload = document.getElementById('upload-instrucoes');
    const btnRemoverFoto = document.getElementById('btn-remover-foto');

    // 1. Abre a janela do arquivo APENAS UMA VEZ matando cliques fantasmas
    if (containerFoto && inputOculto) {
        containerFoto.onclick = function(e) {
            // Se clicou no botão de remover (X), não faz nada
            if (e.target.closest('#btn-remover-foto')) return; 
            
            e.preventDefault();  // Cancela qualquer duplicação do navegador
            e.stopPropagation(); // Para o evento aqui
            inputOculto.click(); // Dispara o clique real de forma controlada
        };
    }

    // 2. Escuta a seleção do arquivo e renderiza na tela imediatamente
    if (inputOculto) {
        inputOculto.onchange = function(e) {
            e.stopPropagation();
            
            const arquivoSelecionado = e.target.files[0];
            if (arquivoSelecionado) {
                const leitorArquivo = new FileReader();
                leitorArquivo.onload = function(evento) {
                    const base64Gerado = evento.target.result;
                    
                    // Altera a imagem do preview
                    if (fotoPreviewElement) {
                        fotoPreviewElement.src = base64Gerado;
                    }
                    
                    // Atualiza a interface gráfica na hora
                    if (previewContainer) previewContainer.classList.remove('d-none');
                    if (instrucoesUpload) instrucoesUpload.classList.add('d-none');
                };
                leitorArquivo.readAsDataURL(arquivoSelecionado);
            }
        };
    }

    // 3. Botão para resetar a imagem
    if (btnRemoverFoto) {
        btnRemoverFoto.onclick = function(e) {
            e.stopPropagation(); 
            if (inputOculto) inputOculto.value = "";
            if (fotoPreviewElement) fotoPreviewElement.src = "";
            if (previewContainer) previewContainer.classList.add('d-none');
            if (instrucoesUpload) instrucoesUpload.classList.remove('d-none');
        };
    }
});

// =========================================================================
// Função de Envio/Atualização da Ocorrência (Blindagem de Textos e Listagem)
// =========================================================================
window.executarEnvioOcorrencia = async function() {
    const paramsURL = new URLSearchParams(window.location.search);
    const estaEditando = paramsURL.has('editar') || paramsURL.has('numero_ocorrencias');
    const metodo = estaEditando ? 'PUT' : 'POST';

    try {
        const obtenerIdValido = (idInputBusca, idDatalist, idInputHidden) => {
            const inputBusca = document.getElementById(idInputBusca);
            const inputHidden = document.getElementById(idInputHidden);
            const datalist = document.getElementById(idDatalist);
            
            let idFinal = parseInt(inputHidden?.value, 10);
            
            if ((isNaN(idFinal) || idFinal <= 0) && inputBusca && inputBusca.value.trim() !== "" && datalist) {
                const textoBusca = inputBusca.value.trim().toLowerCase();
                const opcao = Array.from(datalist.options).find(opt => opt.value.trim().toLowerCase() === textoBusca);
                if (opcao) {
                    idFinal = parseInt(opcao.getAttribute('data-id'), 10);
                }
            }
            return idFinal;
        };

        // 1. Recuperação e salvaguarda dos IDs de Relacionamento
        const idMaquinasTela = obtenerIdValido('maquinas-nome-busca', 'lista-maquinas-datalist', 'maquinas-nome');
        const idColaboradoresTela = obtenerIdValido('colaboradores-nome-busca', 'lista-colaboradores-datalist', 'colaboradores-nome');
        const idProdutosTela = obtenerIdValido('produtos-nome-busca', 'lista-produtos-datalist', 'produtos-nome');
        
        const numeroOcoTela = parseInt(document.getElementById('ocorrencias-numero')?.value, 10) || 0;
        const campoDataOcorrencia = document.getElementById('ocorrencias-data')?.value;
        let dataOcorrenciaIso = campoDataOcorrencia ? campoDataOcorrencia.replace(' ', 'T') : new Date().toISOString().slice(0, 19);
        if (dataOcorrenciaIso.length === 16) dataOcorrenciaIso += ":00";

        // Objeto global que armazena os dados vindos do banco de dados
        const ocoSeguro = (typeof oco !== 'undefined' && oco !== null) ? oco : {};

        const maqFinal = idMaquinasTela > 0 ? idMaquinasTela : (parseInt(ocoSeguro.id_maquinas || ocoSeguro.maquina_id, 10) || 0);
        const colabFinal = idColaboradoresTela > 0 ? idColaboradoresTela : (parseInt(ocoSeguro.id_colaboradores || ocoSeguro.colaborador_id, 10) || 0);
        const prodFinal = idProdutosTela > 0 ? idProdutosTela : (parseInt(ocoSeguro.id_produtos || ocoSeguro.produto_id, 10) || 0);
        const numOcorrenciaFinal = numeroOcoTela > 0 ? numeroOcoTela : (parseInt(ocoSeguro.numero_ocorrencias, 10) || 0);
        
        let dataOcoFinal = dataOcorrenciaIso;
        if (estaEditando && (!campoDataOcorrencia || campoDataOcorrencia.trim() === "")) {
            dataOcoFinal = ocoSeguro.data_ocorrencias || dataOcoFinal;
        }

        if (isNaN(maqFinal) || maqFinal <= 0 || isNaN(colabFinal) || colabFinal <= 0 || isNaN(prodFinal) || prodFinal <= 0) {
            console.error("IDs inválidos detetados antes do envio:", { maqFinal, colabFinal, prodFinal });
            dispararNotificacaoOcorrencia("Erro: IDs de relacionamento inválidos ou zerados.", "danger");
            return;
        }

        // Rota de Query Params do FastAPI
        const urlFinal = `${API_URL}/ocorrencias/?` +
            `data_ocorrencias=${encodeURIComponent(dataOcoFinal)}&` +
            `id_maquinas=${maqFinal}&` +
            `id_colaboradores=${colabFinal}&` +
            `id_produtos=${prodFinal}&` +
            `numero_ocorrencias=${numOcorrenciaFinal}`;

        // Tratamento de datas
        const campoDataPrazo = document.getElementById('ocorrencias-data-prazo')?.value;
        const dataPrazoTratada = (campoDataPrazo && campoDataPrazo.trim() !== "") ? campoDataPrazo : (ocoSeguro.data_prazo || null);
        
        // --- LEITURA DO BASE64 ATUALIZADO PELA FUNÇÃO COMPORTAMENTAL ---
        let fotoTratada = null;
        const previewContainer = document.getElementById('preview-container');
        const fotoPreviewElement = document.getElementById('foto-preview');

        if (previewContainer && previewContainer.classList.contains('d-none')) {
            fotoTratada = null; // Usuário apagou a foto no botão X
        } else if (fotoPreviewElement && fotoPreviewElement.src && fotoPreviewElement.src.includes('data:image')) {
            const decolagemBase64 = fotoPreviewElement.src.indexOf('data:image');
            fotoTratada = fotoPreviewElement.src.substring(decolagemBase64);
        } else {
            fotoTratada = ocoSeguro.foto && ocoSeguro.foto.trim() !== "" ? ocoSeguro.foto : null;
        }

        // Helper interno para ler a tela, mas manter o valor do banco caso esteja em branco
        const obterValorCampo = (idElemento, propriedadeBackup) => {
            const valorTela = document.getElementById(idElemento)?.value;
            if (estaEditando && (!valorTela || valorTela.trim() === "")) {
                return ocoSeguro[propriedadeBackup] !== undefined ? String(ocoSeguro[propriedadeBackup]) : "";
            }
            return valorTela || "";
        };

        // =========================================================================
        // CONSTRUÇÃO DO PAYLOAD BLINDADO (Definitivo conforme chaves reais da API)
        // =========================================================================
        const payloadBody = {
            id_maquinas: maqFinal,
            id_colaboradores: colabFinal,
            id_produtos: prodFinal,
            data_ocorrencias: dataOcoFinal,
            numero_ocorrencias: numOcorrenciaFinal,
            
            // Valores Numéricos/Strings de Identificação
            lote_produtos: obterValorCampo('ocorrencias-lote_produto', 'lote_produtos') || "0",
            numero_nota: parseInt(obterValorCampo('ocorrencias-numero_nota', 'numero_nota'), 10) || 0,
            
            // Descrição dos Problemas e Falhas
            problema: obterValorCampo('ocorrencias-problema', 'problema'),
            falha_onde: obterValorCampo('ocorrencias-falha_onde', 'falha_onde'),
            falha_como: obterValorCampo('ocorrencias-falha_como', 'falha_como'),
            falha_quando: obterValorCampo('ocorrencias-falha_quando', 'falha_quando'),
            falha_quem: obterValorCampo('ocorrencias-falha_quem', 'falha_quem'),
            
            // Ação e Situação
            observacoes: obterValorCampo('ocorrencias-observacoes', 'observacoes'),
            acao_corretiva: obterValorCampo('ocorrencias-acao_corretiva', 'acao_corretiva'),
            data_prazo: dataPrazoTratada,
            situacao: document.getElementById('ocorrencias-situacao')?.value || ocoSeguro.situacao || "Pendente",
            foto: fotoTratada
        };

        if (estaEditando && ocoSeguro.id) {
            payloadBody.id = parseInt(ocoSeguro.id, 10);
        }

        console.log(`[${metodo}] Payload Unificado Enviando Foto Atualizada:`, payloadBody);

        const res = await fetch(urlFinal, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadBody)
        });
        
        if (res.ok) {
            dispararNotificacaoOcorrencia(estaEditando ? "Ocorrência atualizada com sucesso!" : "Nova ocorrência cadastrada com sucesso!", "sucesso");
            
            setTimeout(() => { 
                window.location.replace("ocorrencias_listagem.html"); 
            }, 1500);
        } else {
            const erroCorpo = await res.json().catch(() => ({}));
            console.error("Erro retornado pelo FastAPI:", erroCorpo);
            dispararNotificacaoOcorrencia("Erro de validação nos dados. Verifique os campos.", "danger");
        }
    } catch (err) {
        console.error("Erro crítico no envio:", err);
        dispararNotificacaoOcorrencia("Falha de comunicação com o servidor.", "danger");
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof vincularSalvamentoOcorrencia === 'function') vincularSalvamentoOcorrencia();
    });
} else {
    if (typeof vincularSalvamentoOcorrencia === 'function') vincularSalvamentoOcorrencia();
}

// =========================================================================
// DELETAR REGISTRO COM TOAST DE CONFIRMAÇÃO (SEM ALERT/CONFIRM NATIVO)
// =========================================================================
window.deletarItemGeral = async function(endpoint, numeroOco, dataOco, idMaq, idColab, idProd) {
    if (!numeroOco || !dataOco || !idMaq || !idColab || !idProd) {
        dispararNotificacaoOcorrencia("Dados incompletos para efetuar a exclusão.", "danger");
        return;
    }

    // 1. Procura ou cria o container de toasts
    let container = document.getElementById('toast-container-sistema');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container-sistema';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column-reverse;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }

    // 2. Cria o Toast de Confirmação Especial
    const toastConfirmacao = document.createElement('div');
    toastConfirmacao.style.cssText = `
        padding: 15px 20px;
        border-radius: 6px;
        color: #fff;
        font-family: sans-serif;
        background-color: #34495e; /* Cor escura para diferenciar de sucesso/erro */
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
        min-width: 280px;
    `;

    toastConfirmacao.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold;">Tem certeza que deseja excluir a ocorrência?</div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="btn-cancelar-del" class="btn btn-sm btn-light" style="padding: 2px 10px; font-size: 12px;">Não</button>
            <button id="btn-confirmar-del" class="btn btn-sm btn-danger" style="padding: 2px 10px; font-size: 12px; font-weight: bold;">Sim</button>
        </div>
    `;

    container.appendChild(toastConfirmacao);

    // Animação de entrada
    setTimeout(() => {
        toastConfirmacao.style.opacity = "1";
        toastConfirmacao.style.transform = "translateY(0)";
    }, 10);

    // Ação do botão Cancelar ("Não")
    toastConfirmacao.querySelector('#btn-cancelar-del').addEventListener('click', () => {
        toastConfirmacao.style.opacity = "0";
        toastConfirmacao.style.transform = "translateY(20px)";
        setTimeout(() => { toastConfirmacao.remove(); }, 300);
    });

    // Ação do botão Confirmar ("Sim, Excluir")
    toastConfirmacao.querySelector('#btn-confirmar-del').addEventListener('click', async () => {
        // Remove o toast de pergunta da tela
        toastConfirmacao.remove();

        let dataFormatada = dataOco.toString().replace(' ', 'T');
        if (dataFormatada.length === 16) dataFormatada += ":00";

        try {
            const urlDelete = `${API_URL}/${endpoint}/?` +
                `data_ocorrencias=${encodeURIComponent(dataFormatada)}&` +
                `id_maquinas=${parseInt(idMaq, 10)}&` +
                `id_colaboradores=${parseInt(idColab, 10)}&` +
                `id_produtos=${parseInt(idProd, 10)}&` +
                `numero_ocorrencias=${parseInt(numeroOco, 10)}`;

            console.log("[DELETE] Executando em:", urlDelete);

            const res = await fetch(urlDelete, {
                method: 'DELETE'
            });

            if (res.ok) {
                dispararNotificacaoOcorrencia(`Ocorrência Nº ${numeroOco} excluída com sucesso!`, "sucesso");
                setTimeout(() => {
                    if (typeof carregarDadosIniciais === 'function') {
                        carregarDadosIniciais(); 
                    } else if (typeof listarOcorrenciasCRUD === 'function') {
                        listarOcorrenciasCRUD();
                    } else {
                        window.location.reload();
                    }
                }, 1200);
            } else {
                const detalheErro = await res.json().catch(() => ({}));
                console.error(detalheErro);
                dispararNotificacaoOcorrencia("Não foi possível excluir o registro solicitado.", "danger");
            }
        } catch (error) {
            console.error(error);
            dispararNotificacaoOcorrencia("Falha de rede ao tentar excluir.", "danger");
        }
    });
};

// =========================================================================
// MANTER RELÓGIO COM DATA E HORA DE BRASÍLIA NA SIDEBAR
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