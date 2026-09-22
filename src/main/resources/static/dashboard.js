// ==========================================
// CONFIGURAÇÕES GLOBAIS E AUTENTICAÇÃO
// ==========================================
const API_BASE_URL = 'http://localhost:8080/api';

// Lista padrão de categorias pré-definidas no Front
const CATEGORIAS_PADRAO = [
    'Alimentação',
    'Moradia',
    'Transporte',
    'Lazer',
    'Saúde',
    'Educação',
    'Serviços',
    'Outros'
];

function getToken() {
    return localStorage.getItem('token');
}

function getHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

function checarAutenticacao() {
    const usuarioId = localStorage.getItem('usuarioId');
    const paginasPublicas = ['login.html', 'telaLogin.html', 'registro.html', 'confirmar-email.html'];
    const paginaAtual = window.location.pathname.split('/').pop() || 'index.html';

    if (!usuarioId && !paginasPublicas.includes(paginaAtual)) {
        window.location.href = 'telaLogin.html';
    }
}

function fazerLogout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'telaLogin.html';
}

// Chaves dinâmicas do LocalStorage para cada usuário
function getStorageKey(tipo) {
    const usuarioId = localStorage.getItem('usuarioId') || 'convidado';
    return `${tipo}_${usuarioId}`;
}

// ==========================================
// INICIALIZAÇÃO DA DASHBOARD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    checarAutenticacao();
    carregarUsuario();
    
    // Inicializa Dropdown de Categorias dinâmicas
    popularCategorias();

    // Carregar e Exibir dados locais
    atualizarDashboard();

    // Listeners de Eventos
    document.getElementById('btnLogout')?.addEventListener('click', fazerLogout);
    document.getElementById('expenseForm')?.addEventListener('submit', adicionarLancamento);
    document.getElementById('btnSalvarSaldo')?.addEventListener('click', salvarSaldoInicial);
});

// Re-popula as categorias caso o usuário navegue entre abas e altere as configurações
window.addEventListener('focus', () => {
    popularCategorias();
});

// ------------------------------------------
// GERENCIAMENTO DE DADOS LOCAIS
// ------------------------------------------
function obterLancamentosLocais() {
    const dados = localStorage.getItem(getStorageKey('transacoes'));
    return dados ? JSON.parse(dados) : [];
}

function salvarLancamentosLocais(lancamentos) {
    localStorage.setItem(getStorageKey('transacoes'), JSON.stringify(lancamentos));
}

function obterSaldoInicialLocal() {
    const saldo = localStorage.getItem(getStorageKey('saldoInicial'));
    return saldo ? parseFloat(saldo) : 0;
}

function obterCategorias() {
    const salvas = localStorage.getItem(getStorageKey('categorias'));
    return salvas ? JSON.parse(salvas) : CATEGORIAS_PADRAO;
}

// ------------------------------------------
// CARREGAR USUÁRIO DO BACKEND E/OU LOCALSTORAGE
// ------------------------------------------
async function carregarUsuario() {
    const nomeSidebar = document.getElementById('nomeUsuarioSidebar');
    const avatarSidebar = document.getElementById('avatarUsuario');

    const nomeSalvo = localStorage.getItem('usuarioNome');
    if (nomeSalvo) {
        renderizarDadosUsuario(nomeSalvo, nomeSidebar, avatarSidebar);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/me`, {
            headers: getHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            fazerLogout();
            return;
        }

        if (!response.ok) return;

        const usuario = await response.json();
        if (usuario.nome) {
            localStorage.setItem('usuarioNome', usuario.nome);
            renderizarDadosUsuario(usuario.nome, nomeSidebar, avatarSidebar);
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

function renderizarDadosUsuario(nome, elNome, elAvatar) {
    if (elNome) elNome.textContent = nome;
    if (elAvatar && nome) {
        const iniciais = nome
            .split(' ')
            .filter(n => n.length > 0)
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
        elAvatar.textContent = iniciais;
    }
}

// ------------------------------------------
// POPULAR SELECT DE CATEGORIAS (DINÂMICO)
// ------------------------------------------
function popularCategorias() {
    // Busca por qualquer select de categoria na tela principal
    const selects = document.querySelectorAll('#category, #categoriaSelect, #filtroCategoria');
    const categorias = obterCategorias();

    selects.forEach(select => {
        if (!select) return;

        const primeiraOpcao = select.options[0] 
            ? select.options[0].outerHTML 
            : '<option value="" disabled selected>Selecione uma categoria</option>';

        select.innerHTML = primeiraOpcao;

        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });
    });
}

// ------------------------------------------
// GERENCIAMENTO DE SALDO INICIAL
// ------------------------------------------
function salvarSaldoInicial() {
    const inputSaldo = document.getElementById('inputSaldo');
    if (!inputSaldo) return;

    const valor = parseFloat(inputSaldo.value);

    if (isNaN(valor)) {
        alert('Por favor, informe um valor válido para o saldo.');
        return;
    }

    localStorage.setItem(getStorageKey('saldoInicial'), valor.toString());
    atualizarDashboard();
}

// ------------------------------------------
// GERENCIAMENTO DE LANÇAMENTOS (SAÍDAS)
// ------------------------------------------
function adicionarLancamento(e) {
    e.preventDefault();

    const descricao = document.getElementById('description')?.value.trim();
    const valor = parseFloat(document.getElementById('amount')?.value);

    // Aceita id 'category' ou 'categoriaSelect'
    const selectCat = document.getElementById('category') || document.getElementById('categoriaSelect');
    const categoria = selectCat?.value;

    if (!descricao || isNaN(valor) || valor <= 0 || !categoria) {
        alert('Preencha todos os campos do lançamento corretamente.');
        return;
    }

    const novoLancamento = {
        id: Date.now(),
        descricao,
        valor,
        categoria,
        data: new Date().toISOString()
    };

    const lancamentos = obterLancamentosLocais();
    lancamentos.unshift(novoLancamento);
    salvarLancamentosLocais(lancamentos);

    document.getElementById('expenseForm')?.reset();
    atualizarDashboard();
}

function deletarLancamento(id) {
    let lancamentos = obterLancamentosLocais();
    lancamentos = lancamentos.filter(item => item.id !== id);
    salvarLancamentosLocais(lancamentos);
    atualizarDashboard();
}

// ------------------------------------------
// ATUALIZAR INTERFACE E TABELA
// ------------------------------------------
function atualizarDashboard() {
    const lancamentos = obterLancamentosLocais();
    const saldoInicial = obterSaldoInicialLocal();

    const inputSaldo = document.getElementById('inputSaldo');
    if (inputSaldo && document.activeElement !== inputSaldo) {
        inputSaldo.value = saldoInicial > 0 ? saldoInicial : '';
    }

    let totalSaidas = 0;
    const tbody = document.getElementById('expenseListBody');
    if (tbody) tbody.innerHTML = '';

    lancamentos.forEach(item => {
        totalSaidas += item.valor;

        if (tbody) {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-zinc-800/40 transition-colors';

            tr.innerHTML = `
                <td class="py-3 px-4 font-medium text-zinc-200">${item.descricao}</td>
                <td class="py-3 px-4 text-zinc-400">
                    <span class="inline-block bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-xs px-2.5 py-1 rounded-md">
                        ${item.categoria}
                    </span>
                </td>
                <td class="py-3 px-4 text-right font-semibold text-rose-400">
                    - R$ ${item.valor.toFixed(2)}
                </td>
                <td class="py-3 px-4 text-center">
                    <button onclick="deletarLancamento(${item.id})" title="Excluir" class="text-zinc-500 hover:text-rose-400 p-1 transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        }
    });

    if (tbody && lancamentos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-8 text-center text-zinc-500 text-sm">
                    Nenhuma transação registrada. Cadastre uma nova saída acima!
                </td>
            </tr>
        `;
    }

    const saldoLiquido = saldoInicial - totalSaidas;

    const totalBalanceEl = document.getElementById('totalBalance');
    if (totalBalanceEl) {
        totalBalanceEl.textContent = `R$ ${saldoLiquido.toFixed(2)}`;
        if (saldoLiquido < 0) {
            totalBalanceEl.classList.remove('text-emerald-400');
            totalBalanceEl.classList.add('text-rose-400');
        } else {
            totalBalanceEl.classList.remove('text-rose-400');
            totalBalanceEl.classList.add('text-emerald-400');
        }
    }

    const totalExpensesEl = document.getElementById('totalExpenses');
    if (totalExpensesEl) {
        totalExpensesEl.textContent = `R$ ${totalSaidas.toFixed(2)}`;
    }

    const expenseCountEl = document.getElementById('expenseCount');
    if (expenseCountEl) {
        expenseCountEl.textContent = `${lancamentos.length} ${lancamentos.length === 1 ? 'item' : 'itens'}`;
    }

    window.dispatchEvent(new Event('transacoesAtualizadas'));
}