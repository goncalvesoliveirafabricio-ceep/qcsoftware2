const API_URL = "http://127.0.0.1:8000";

// VARIÁVEIS DE CONTROLE DE ESTADO
let todosProdutos = [];
let produtosFiltrados = [];
let paginaAtual = 1;

const ITENS_POR_PAGINA = 10;

// =========================================================================
// 1. LISTAR PRODUTOS
// =========================================================================
async function listarProdutosCRUD() {

    const tabela = document.getElementById('tabela-produtos');

    try {

        const res = await fetch(`${API_URL}/produtos/`);

        if (!res.ok) {
            throw new Error(`Erro no servidor: Status ${res.status}`);
        }

        const dados = await res.json();

        todosProdutos = Array.isArray(dados) ? dados : [];

        const totalBadge = document.getElementById('total-produtos');

        if (totalBadge) {
            totalBadge.innerText = todosProdutos.length;
        }

        filtrarEAtualizarTabela();

    } catch (e) {

        console.error(
            "Erro detalhado na requisição dos Produtos:",
            e
        );

        if (tabela) {

            tabela.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger py-4">
                        ⚠️ Erro ao carregar produtos.<br>
                        <small class="text-muted">
                            Motivo: ${e.message}
                        </small>
                    </td>
                </tr>
            `;
        }
    }
}

// =========================================================================
// FILTRO E PAGINAÇÃO
// =========================================================================
function filtrarEAtualizarTabela() {

    const termoPesquisa =
        document.getElementById('pesquisa-produto')
        ?.value.toLowerCase() || "";

    produtosFiltrados = todosProdutos.filter(p =>
        p.nome &&
        p.nome.toLowerCase().includes(termoPesquisa)
    );

    const totalPaginas =
        Math.ceil(
            produtosFiltrados.length / ITENS_POR_PAGINA
        ) || 1;

    if (paginaAtual > totalPaginas) {
        paginaAtual = totalPaginas;
    }

    const indiceInicial =
        (paginaAtual - 1) * ITENS_POR_PAGINA;

    const indiceFinal =
        indiceInicial + ITENS_POR_PAGINA;

    const produtosExibidos =
        produtosFiltrados.slice(
            indiceInicial,
            indiceFinal
        );

    renderizarTabela(produtosExibidos);

    atualizarControlesPaginacao(totalPaginas);
}

// =========================================================================
// RENDERIZAR TABELA
// =========================================================================
function renderizarTabela(produtos) {

    const tabela =
        document.getElementById('tabela-produtos');

    if (!tabela) return;

    if (!produtos || produtos.length === 0) {

        tabela.innerHTML = `
            <tr>
                <td colspan="4"
                    class="text-center py-4 text-muted">
                    Nenhum produto encontrado.
                </td>
            </tr>
        `;

        return;
    }

    tabela.innerHTML = produtos.map(p => {

        let idBruto = undefined;

        if (p) {

            if (p.id_produtos !== undefined && p.id_produtos !== null) {
                idBruto = p.id_produtos;
            }

            else if (p.id !== undefined && p.id !== null) {
                idBruto = p.id;
            }

            else if (p._id !== undefined && p._id !== null) {
                idBruto = p._id;
            }
        }

        const produtoId =
            idBruto !== undefined
                ? idBruto.toString().trim()
                : "";

        if (!produtoId) {

            console.warn(
                "Produto sem ID detectado:",
                p
            );

            return `
                <tr class="table-warning">

                    <td>
                        <strong>
                            ${p.nome || "Sem Nome"}
                        </strong>
                    </td>

                    <td>
                        ${p.categoria || "Sem Categoria"}
                    </td>

                    <td>
                        <span class="badge bg-warning text-dark">
                            Erro de ID
                        </span>
                    </td>

                    <td class="text-end text-muted small">
                        ⚠️ ID ausente
                    </td>

                </tr>
            `;
        }

        let situacaoTratada = "Ativo";

        if (p.ativo !== undefined && p.ativo !== null) {
            situacaoTratada = p.ativo;
        }

        else if (p.situacao !== undefined && p.situacao !== null) {
            situacaoTratada = p.situacao;
        }

        if (typeof situacaoTratada === 'boolean') {

            situacaoTratada =
                situacaoTratada
                    ? "Ativo"
                    : "Inativo";
        }

        if (
            typeof situacaoTratada === 'string' &&
            situacaoTratada.length > 0
        ) {

            situacaoTratada =
                situacaoTratada.charAt(0).toUpperCase() +
                situacaoTratada.slice(1).toLowerCase();
        }

        p.id = produtoId;
        p.situacao = situacaoTratada;

        const produtoEncoded =
            encodeURIComponent(
                JSON.stringify(p)
            );

        const badgeClasse =
            situacaoTratada === 'Ativo'
                ? 'bg-success-subtle text-success'
                : 'bg-secondary-subtle text-secondary';

        return `
            <tr class="align-middle">

                <td>
                    <strong>
                        ${p.nome || "Sem Nome"}
                    </strong>
                </td>

                <td>
                    ${p.categoria || "Sem Categoria"}
                </td>

                <td>
                    <span class="badge ${badgeClasse}">
                        ${situacaoTratada}
                    </span>
                </td>

                <td class="text-end">

                    <button
                        class="btn btn-sm btn-outline-primary me-1 border-0"
                        onclick="prepararEdicaoSegura('${produtoEncoded}')"
                        title="Editar produto">

                        <i class="bi bi-pencil"></i>

                    </button>

                    <button
                        class="btn btn-sm btn-outline-danger border-0"
                        onclick="deletarItemGeral(
                            'produtos',
                            '${produtoId}',
                            listarProdutosCRUD
                        )"
                        title="Excluir produto">

                        <i class="bi bi-trash"></i>

                    </button>

                </td>

            </tr>
        `;

    }).join('');
}

// =========================================================================
// CONTROLES PAGINAÇÃO
// =========================================================================
function atualizarControlesPaginacao(totalPaginas) {

    const btnAnterior =
        document.getElementById('btn-anterior');

    const btnProximo =
        document.getElementById('btn-proximo');

    const infoPaginacao =
        document.getElementById('info-paginacao');

    if (infoPaginacao) {

        infoPaginacao.innerText =
            `Página ${paginaAtual} de ${totalPaginas}`;
    }

    if (btnAnterior) {
        btnAnterior.disabled = (paginaAtual === 1);
    }

    if (btnProximo) {
        btnProximo.disabled = (paginaAtual === totalPaginas);
    }
}

// =========================================================================
// RELÓGIO
// =========================================================================
function atualizarRelogioBrasilia() {

    const agora = new Date();

    const opcoesData = {

        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    };

    const opcoesHora = {

        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    const dataStr =
        agora.toLocaleDateString(
            'pt-BR',
            opcoesData
        );

    const horaStr =
        agora.toLocaleTimeString(
            'pt-BR',
            opcoesHora
        );

    const elData =
        document.getElementById('data-brasilia');

    const elHora =
        document.getElementById('hora-brasilia');

    if (elData) {
        elData.textContent = dataStr;
    }

    if (elHora) {
        elHora.textContent = `${horaStr} horas`;
    }
}

// =========================================================================
// LOAD DA PÁGINA
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {

    listarProdutosCRUD();

    atualizarRelogioBrasilia();

    setInterval(
        atualizarRelogioBrasilia,
        1000
    );

    document.getElementById('pesquisa-produto')
    ?.addEventListener('input', () => {

        paginaAtual = 1;

        filtrarEAtualizarTabela();
    });

    document.getElementById('btn-anterior')
    ?.addEventListener('click', () => {

        if (paginaAtual > 1) {

            paginaAtual--;

            filtrarEAtualizarTabela();
        }
    });

    document.getElementById('btn-proximo')
    ?.addEventListener('click', () => {

        const totalPaginas =
            Math.ceil(
                produtosFiltrados.length /
                ITENS_POR_PAGINA
            ) || 1;

        if (paginaAtual < totalPaginas) {

            paginaAtual++;

            filtrarEAtualizarTabela();
        }
    });
});