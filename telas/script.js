const API_URL = "http://127.0.0.1:8000";

let todosProdutos = [];
let produtosFiltrados = [];

let paginaAtual = 1;

const ITENS_POR_PAGINA = 10;

// ==========================================================
// LISTAR PRODUTOS
// ==========================================================
async function listarProdutosCRUD() {

    const tabela =
        document.getElementById('tabela-produtos');

    try {

        const res =
            await fetch(`${API_URL}/produtos/`);

        if (!res.ok) {
            throw new Error(`Erro ${res.status}`);
        }

        const dados = await res.json();

        console.log("RETORNO API:", dados);

        if (Array.isArray(dados)) {

            todosProdutos = dados;

        } else if (Array.isArray(dados.produtos)) {

            todosProdutos = dados.produtos;

        } else if (Array.isArray(dados.data)) {

            todosProdutos = dados.data;

        } else {

            todosProdutos = [];
        }

        const totalBadge =
            document.getElementById('total-produtos');

        if (totalBadge) {
            totalBadge.innerText = todosProdutos.length;
        }

        filtrarEAtualizarTabela();

    } catch (e) {

        console.error(e);

        tabela.innerHTML = `
            <tr>
                <td colspan="4"
                    class="text-center text-danger py-4">

                    ⚠️ Erro ao carregar produtos.<br>

                    <small class="text-muted">
                        ${e.message}
                    </small>

                </td>
            </tr>
        `;
    }
}

// ==========================================================
// FILTRO
// ==========================================================
function filtrarEAtualizarTabela() {

    const termoPesquisa =
        document.getElementById('pesquisa-produto')
        ?.value.toLowerCase() || "";

    produtosFiltrados =
        todosProdutos.filter(p =>
            p.nome &&
            p.nome.toLowerCase()
                .includes(termoPesquisa)
        );

    const totalPaginas =
        Math.ceil(
            produtosFiltrados.length /
            ITENS_POR_PAGINA
        ) || 1;

    if (paginaAtual > totalPaginas) {
        paginaAtual = totalPaginas;
    }

    const indiceInicial =
        (paginaAtual - 1) *
        ITENS_POR_PAGINA;

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

// ==========================================================
// RENDER TABELA
// ==========================================================
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

        let idBruto = null;

        if (p.id_produtos != null) {
            idBruto = p.id_produtos;
        }

        else if (p.id_produto != null) {
            idBruto = p.id_produto;
        }

        else if (p.id != null) {
            idBruto = p.id;
        }

        else if (p._id != null) {
            idBruto = p._id;
        }

        const produtoId =
            idBruto
                ? idBruto.toString().trim()
                : "";

        let situacaoTratada = "Ativo";

        if (p.situacao != null) {
            situacaoTratada = p.situacao;
        }

        if (p.ativo != null) {
            situacaoTratada =
                p.ativo
                    ? "Ativo"
                    : "Inativo";
        }

        const badgeClasse =
            situacaoTratada === "Ativo"
                ? "bg-success-subtle text-success"
                : "bg-secondary-subtle text-secondary";

        p.id = produtoId;

        p.situacao = situacaoTratada;

        const produtoEncoded =
            encodeURIComponent(
                JSON.stringify(p)
            );

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
                        onclick="prepararEdicaoSegura('${produtoEncoded}')">

                        <i class="bi bi-pencil"></i>

                    </button>

                    <button
                        class="btn btn-sm btn-outline-danger border-0"
                        onclick="deletarItemGeral(
                            'produtos',
                            '${produtoId}',
                            listarProdutosCRUD
                        )">

                        <i class="bi bi-trash"></i>

                    </button>

                </td>

            </tr>
        `;

    }).join('');
}

// ==========================================================
// PAGINAÇÃO
// ==========================================================
function atualizarControlesPaginacao(totalPaginas) {

    const info =
        document.getElementById('info-paginacao');

    const anterior =
        document.getElementById('btn-anterior');

    const proximo =
        document.getElementById('btn-proximo');

    if (info) {
        info.innerText =
            `Página ${paginaAtual} de ${totalPaginas}`;
    }

    if (anterior) {
        anterior.disabled = (paginaAtual === 1);
    }

    if (proximo) {
        proximo.disabled = (paginaAtual === totalPaginas);
    }
}

// ==========================================================
// RELÓGIO
// ==========================================================
function atualizarRelogioBrasilia() {

    const agora = new Date();

    const dataStr =
        agora.toLocaleDateString(
            'pt-BR',
            {
                timeZone: 'America/Sao_Paulo'
            }
        );

    const horaStr =
        agora.toLocaleTimeString(
            'pt-BR',
            {
                timeZone: 'America/Sao_Paulo',
                hour12: false
            }
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

// ==========================================================
// LOAD
// ==========================================================
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