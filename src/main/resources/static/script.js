// ==========================================
// CONFIGURAÇÕES GLOBAIS
// ==========================================
const API_BASE_URL = 'http://localhost:8080/api';
let instanceChart = null; // Instância do Chart.js
let listaTransacoesCache = []; // Cache local de transações para filtros rápidos

// Recupera o token JWT do localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Configuração padrão de cabeçalhos HTTP com Autenticação Bearer
function getHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Redireciona para o login caso o token/usuário não exista
function checarAutenticacao() {
    const usuarioId = localStorage.getItem('usuarioId');
    const paginasPublicas = ['login.html', 'telaLogin.html', 'registro.html', 'confirmar-email.html'];
    const paginaAtual = window.location.pathname.split('/').pop() || 'index.html';

    if (!usuarioId && !paginasPublicas.includes(paginaAtual)) {
        window.location.href = 'telaLogin.html';
    }
}

function fazerLogout() {
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('usuarioNome');
    localStorage.removeItem('usuarioSaldo');
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('token');

    sessionStorage.clear();
    window.location.href = 'telaLogin.html';
}

// ==========================================
// INICIALIZAÇÃO ÚNICA DA APLICAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa formulário de Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', fazerLogin);
    }

    // 2. Inicializa formulário de Cadastro e Modal de Verificação
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const passwordInput = document.getElementById('regPassword');
        passwordInput?.addEventListener('input', () => validarSenhaEmTempoReal(passwordInput.value));
        registerForm.addEventListener('submit', executarCadastro);
    }

    const verifyForm = document.getElementById('verifyForm');
    if (verifyForm) {
        verifyForm.addEventListener('submit', executarVerificacaoCodigo);
    }

    // 3. Checagem e carregamento de páginas autenticadas
    const exibeDashboard = document.getElementById('expenseListBody') || document.getElementById('totalBalance');
    if (exibeDashboard) {
        checarAutenticacao();
        carregarUsuario();
        carregarCategorias();
        carregarTransacoes();

        document.getElementById('btnSalvarSaldo')?.addEventListener('click', atualizarSaldoInicial);
        document.getElementById('expenseForm')?.addEventListener('submit', salvarTransacao);
        document.getElementById('editExpenseForm')?.addEventListener('submit', salvarEdicaoTransacao);
        document.getElementById('categoryForm')?.addEventListener('submit', salvarNovaCategoria);
        document.getElementById('btnLogout')?.addEventListener('click', fazerLogout);

        // Eventos de Filtro e Busca
        document.getElementById('searchInput')?.addEventListener('input', aplicarFiltros);
        document.getElementById('filterCategory')?.addEventListener('change', aplicarFiltros);
        document.getElementById('filterType')?.addEventListener('change', aplicarFiltros);

        // Exportação
        document.getElementById('btnExportCSV')?.addEventListener('click', exportarTransacoesCSV);

        // Formatação de entrada de moeda
        const inputAmount = document.getElementById('amount');
        if (inputAmount) {
            inputAmount.addEventListener('input', (e) => aplicarMascaraMoeda(e.target));
        }

        const editInputAmount = document.getElementById('editAmount');
        if (editInputAmount) {
            editInputAmount.addEventListener('input', (e) => aplicarMascaraMoeda(e.target));
        }
    }

    // 4. Inicializa visualização do Gráfico
    if (document.getElementById('expensesChart')) {
        checarAutenticacao();
        carregarDadosEExibirGrafico();
    }
});

// ==========================================
// AUTENTICAÇÃO, CADASTRO E MODAL DE CÓDIGO
// ==========================================
async function fazerLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail')?.value.trim();
    const senha = document.getElementById('loginPassword')?.value.trim();

    if (!email || !senha) {
        alert('Preencha o e-mail e a senha.');
        return;
    }

    const btnLoginText = document.getElementById('btnLoginText');
    const btnLoginSpinner = document.getElementById('btnLoginSpinner');
    const btnLogin = document.getElementById('btnLogin');

    if (btnLoginSpinner && btnLoginText) {
        btnLoginSpinner.classList.remove('hidden');
        btnLoginText.textContent = 'Entrando...';
        btnLogin.disabled = true;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.token) localStorage.setItem('token', data.token);
            localStorage.setItem('usuarioId', data.id);
            if (data.nome) localStorage.setItem('usuarioNome', data.nome);
            if (data.saldo !== undefined) localStorage.setItem('usuarioSaldo', data.saldo);
            localStorage.setItem('usuarioLogado', JSON.stringify(data));

            window.location.href = 'index.html';
        } else {
            alert('Falha ao entrar: ' + (data.message || 'E-mail ou senha incorretos.'));
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        alert('Não foi possível conectar ao servidor Spring Boot.');
    } finally {
        if (btnLoginSpinner && btnLoginText) {
            btnLoginSpinner.classList.add('hidden');
            btnLoginText.textContent = 'Entrar';
            btnLogin.disabled = false;
        }
    }
}

async function executarCadastro(e) {
    e.preventDefault();

    const nome = document.getElementById('regName')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const senha = document.getElementById('regPassword')?.value;
    const confirmSenha = document.getElementById('regConfirmPassword')?.value;

    if (senha !== confirmSenha) {
        mostrarErro('As senhas não coincidem!');
        return;
    }

    const temOito = senha.length >= 8;
    const temNumero = /\d/.test(senha);
    const temEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(senha);

    if (!temOito || !temNumero || !temEspecial) {
        mostrarErro('A senha precisa atender a todos os requisitos de segurança.');
        return;
    }

    setLoadingState('btnRegisterText', 'btnRegisterSpinner', 'btnRegister', true);

    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        const data = await response.json().catch(() => null);

        if (response.ok) {
            localStorage.setItem('tempEmailVerification', email);
            exibirModalVerificacao();
        } else {
            mostrarErro(data?.message || 'Erro ao realizar cadastro.');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        mostrarErro('Erro ao conectar com o servidor Spring Boot.');
    } finally {
        setLoadingState('btnRegisterText', 'btnRegisterSpinner', 'btnRegister', false, 'Criar Conta');
    }
}

async function executarVerificacaoCodigo(e) {
    e.preventDefault();

    const codeInput = document.getElementById('verificationCode')?.value.trim();
    const verifyError = document.getElementById('verifyError');
    const email = localStorage.getItem('tempEmailVerification');

    if (verifyError) verifyError.classList.add('hidden');

    if (!codeInput) {
        mostrarErroModal('Por favor, informe o código enviado.');
        return;
    }

    setLoadingState('btnConfirmText', 'btnConfirmSpinner', 'btnConfirmCode', true);

    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, codigo: codeInput })
        });

        const data = await response.json().catch(() => null);

        if (response.ok) {
            localStorage.removeItem('tempEmailVerification');
            alert('E-mail verificado com sucesso!');
            window.location.href = 'telaLogin.html';
        } else {
            mostrarErroModal(data?.message || 'Código inválido ou expirado.');
        }
    } catch (error) {
        console.error('Erro na verificação do código:', error);
        mostrarErroModal('Falha de comunicação com o servidor.');
    } finally {
        setLoadingState('btnConfirmText', 'btnConfirmSpinner', 'btnConfirmCode', false, 'Validar e Entrar');
    }
}

function exibirModalVerificacao() {
    const modal = document.getElementById('verifyModal') || document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('btnIrParaLogin')?.addEventListener('click', () => {
            window.location.href = 'telaLogin.html';
        });
    } else {
        window.location.href = 'telaLogin.html';
    }
}

function setLoadingState(textId, spinnerId, buttonId, isLoading, defaultText = '') {
    const textEl = document.getElementById(textId);
    const spinnerEl = document.getElementById(spinnerId);
    const buttonEl = document.getElementById(buttonId);

    if (!buttonEl) return;

    if (isLoading) {
        if (textEl) textEl.textContent = 'Carregando...';
        if (spinnerEl) spinnerEl.classList.remove('hidden');
        buttonEl.disabled = true;
        buttonEl.classList.add('opacity-80', 'cursor-not-allowed');
    } else {
        if (textEl) textEl.textContent = defaultText;
        if (spinnerEl) spinnerEl.classList.add('hidden');
        buttonEl.disabled = false;
        buttonEl.classList.remove('opacity-80', 'cursor-not-allowed');
    }
}

function validarSenhaEmTempoReal(senha) {
    atualizarRegra('ruleLength', senha.length >= 8);
    atualizarRegra('ruleNumber', /\d/.test(senha));
    atualizarRegra('ruleSpecial', /[!@#$%^&*(),.?":{}|<>]/.test(senha));
}

function atualizarRegra(idElemento, estaValido) {
    const el = document.getElementById(idElemento);
    if (!el) return;
    if (estaValido) {
        el.classList.remove('text-zinc-500');
        el.classList.add('text-emerald-400', 'font-medium');
    } else {
        el.classList.remove('text-emerald-400', 'font-medium');
        el.classList.add('text-zinc-500');
    }
}

function mostrarErro(mensagem) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.innerText = mensagem;
        errorMessage.classList.remove('hidden');
    }
}

function mostrarErroModal(mensagem) {
    const verifyError = document.getElementById('verifyError');
    if (verifyError) {
        verifyError.innerText = mensagem;
        verifyError.classList.remove('hidden');
    } else {
        mostrarErro(mensagem);
    }
}

// ==========================================
// USUÁRIO E SALDO
// ==========================================
async function carregarUsuario() {
    try {
        const response = await fetch(`${API_BASE_URL}/usuario/me`, {
            headers: getHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            fazerLogout();
            return;
        }

        const usuario = await response.json();

        const nomeSidebar = document.getElementById('nomeUsuarioSidebar');
        const avatarSidebar = document.getElementById('avatarUsuario');

        if (nomeSidebar) nomeSidebar.textContent = usuario.nome;
        if (avatarSidebar && usuario.nome) {
            const iniciais = usuario.nome
                .split(' ')
                .map(n => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
            avatarSidebar.textContent = iniciais;
        }

        document.body.dataset.saldoInicial = usuario.saldoInicial || 0;

    } catch (error) {
        console.error('Erro ao carregar usuário:', error);
    }
}

async function atualizarSaldoInicial() {
    const inputSaldo = document.getElementById('inputSaldo');
    const valor = parseFloat(inputSaldo.value);

    if (isNaN(valor) || valor < 0) {
        alert('Por favor, insira um valor de saldo válido.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/usuario/saldo`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ saldoInicial: valor })
        });

        if (response.ok) {
            inputSaldo.value = '';
            await carregarUsuario();
            await carregarTransacoes();
        } else {
            alert('Falha ao atualizar o saldo inicial.');
        }
    } catch (error) {
        console.error('Erro ao atualizar saldo:', error);
    }
}

// ==========================================
// CATEGORIAS
// ==========================================
async function carregarCategorias() {
    const selectCategory = document.getElementById('category');
    const filterCategory = document.getElementById('filterCategory');
    const editCategory = document.getElementById('editCategory');

    try {
        const response = await fetch(`${API_BASE_URL}/categorias`, {
            headers: getHeaders()
        });

        if (!response.ok) return;

        const categorias = await response.json();

        if (selectCategory) {
            selectCategory.innerHTML = '<option value="" disabled selected>Selecione uma categoria</option>';
            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nome;
                selectCategory.appendChild(option);
            });
        }

        if (editCategory) {
            editCategory.innerHTML = '<option value="" disabled selected>Selecione uma categoria</option>';
            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nome;
                editCategory.appendChild(option);
            });
        }

        if (filterCategory) {
            filterCategory.innerHTML = '<option value="">Todas as Categorias</option>';
            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nome;
                filterCategory.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

async function salvarNovaCategoria(e) {
    e.preventDefault();

    const nomeInput = document.getElementById('newCategoryName');
    const nome = nomeInput?.value.trim();

    if (!nome) {
        alert('Digite o nome da categoria.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/categorias`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ nome })
        });

        if (response.ok) {
            if (nomeInput) nomeInput.value = '';
            await carregarCategorias();
            alert('Categoria cadastrada com sucesso!');
        } else {
            alert('Erro ao cadastrar categoria.');
        }
    } catch (error) {
        console.error('Erro ao salvar categoria:', error);
    }
}

// ==========================================
// TRANSAÇÕES
// ==========================================
async function carregarTransacoes() {
    try {
        const response = await fetch(`${API_BASE_URL}/transacoes`, {
            headers: getHeaders()
        });

        if (!response.ok) return;

        const transacoes = await response.json();
        listaTransacoesCache = transacoes;
        renderizarTabela(transacoes);
        atualizarDashboard(transacoes);
    } catch (error) {
        console.error('Erro ao carregar transações:', error);
    }
}

async function salvarTransacao(e) {
    e.preventDefault();

    const descricao = document.getElementById('description').value.trim();
    const rawAmount = document.getElementById('amount').value;
    const valor = parseFloat(rawAmount.replace(/[^\d.]/g, ''));
    const tipo = document.getElementById('transactionType').value;
    const categoriaId = document.getElementById('category').value;

    if (!descricao || isNaN(valor) || !categoriaId) {
        alert('Preencha todos os campos corretamente.');
        return;
    }

    const payload = {
        descricao: descricao,
        valor: valor,
        tipo: tipo,
        categoriaId: parseInt(categoriaId),
        categoria: { id: parseInt(categoriaId) }
    };

    try {
        const response = await fetch(`${API_BASE_URL}/transacoes`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            document.getElementById('expenseForm').reset();
            await carregarTransacoes();
            if (document.getElementById('expensesChart')) {
                await carregarDadosEExibirGrafico();
            }
        } else {
            alert('Erro ao cadastrar transação.');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
    }
}

async function deletarTransacao(id) {
    if (!confirm('Deseja realmente excluir esta transação?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/transacoes/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (response.ok) {
            await carregarTransacoes();
            if (document.getElementById('expensesChart')) {
                await carregarDadosEExibirGrafico();
            }
        } else {
            alert('Erro ao excluir a transação.');
        }
    } catch (error) {
        console.error('Erro ao deletar transação:', error);
    }
}

// ==========================================
// EDIÇÃO DE TRANSAÇÃO
// ==========================================
function abrirModalEdicao(id) {
    const transacao = listaTransacoesCache.find(t => t.id === id);
    if (!transacao) return;

    const elId = document.getElementById('editId');
    const elDesc = document.getElementById('editDescription');
    const elAmount = document.getElementById('editAmount');
    const elType = document.getElementById('editTransactionType');
    const elCategory = document.getElementById('editCategory');

    if (elId) elId.value = transacao.id;
    if (elDesc) elDesc.value = transacao.descricao;
    if (elAmount) elAmount.value = Number(transacao.valor).toFixed(2);
    if (elType) elType.value = transacao.tipo;
    if (elCategory) elCategory.value = transacao.categoria ? transacao.categoria.id : '';

    const modal = document.getElementById('editModal');
    if (modal) modal.classList.remove('hidden');
}

async function salvarEdicaoTransacao(e) {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const descricao = document.getElementById('editDescription').value.trim();
    const rawAmount = document.getElementById('editAmount').value;
    const valor = parseFloat(rawAmount.replace(/[^\d.]/g, ''));
    const tipo = document.getElementById('editTransactionType').value;
    const categoriaId = document.getElementById('editCategory').value;

    if (!id || !descricao || isNaN(valor) || !categoriaId) {
        alert('Preencha todos os campos do formulário de edição.');
        return;
    }

    const payload = {
        descricao,
        valor,
        tipo,
        categoriaId: parseInt(categoriaId),
        categoria: { id: parseInt(categoriaId) }
    };

    try {
        const response = await fetch(`${API_BASE_URL}/transacoes/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const modal = document.getElementById('editModal');
            if (modal) modal.classList.add('hidden');
            await carregarTransacoes();
            if (document.getElementById('expensesChart')) {
                await carregarDadosEExibirGrafico();
            }
        } else {
            alert('Erro ao atualizar transação.');
        }
    } catch (error) {
        console.error('Erro ao atualizar transação:', error);
    }
}

// ==========================================
// FILTROS E BUSCA
// ==========================================
function aplicarFiltros() {
    const termoBusca = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoriaFiltro = document.getElementById('filterCategory')?.value || '';
    const tipoFiltro = document.getElementById('filterType')?.value || '';

    const filtradas = listaTransacoesCache.filter(t => {
        const bateNome = t.descricao.toLowerCase().includes(termoBusca);
        const bateCategoria = !categoriaFiltro || (t.categoria && t.categoria.id == categoriaFiltro);
        const bateTipo = !tipoFiltro || t.tipo === tipoFiltro;

        return bateNome && bateCategoria && bateTipo;
    });

    renderizarTabela(filtradas);
}

// ==========================================
// EXPORTAÇÃO CSV
// ==========================================
function exportarTransacoesCSV() {
    if (listaTransacoesCache.length === 0) {
        alert('Não há transações para exportar.');
        return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,ID;Descrição;Tipo;Categoria;Valor\n';

    listaTransacoesCache.forEach(t => {
        const catNome = t.categoria ? t.categoria.nome : 'Sem Categoria';
        csvContent += `${t.id};"${t.descricao}";${t.tipo};"${catNome}";${t.valor}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transacoes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==========================================
// MÁSCARA E FORMATAÇÃO
// ==========================================
function aplicarMascaraMoeda(input) {
    let valor = input.value.replace(/\D/g, '');
    if (!valor) {
        input.value = '';
        return;
    }
    valor = (parseFloat(valor) / 100).toFixed(2);
    input.value = valor;
}

function formatarMoeda(valor) {
    const num = Number(valor);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// ==========================================
// RENDERIZAÇÃO E DASHBOARD
// ==========================================
function renderizarTabela(transacoes) {
    const tbody = document.getElementById('expenseListBody');
    const countSpan = document.getElementById('expenseCount');

    if (!tbody) return;

    tbody.innerHTML = '';
    if (countSpan) countSpan.textContent = `${transacoes.length} itens`;

    if (transacoes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-6 text-center text-zinc-500 text-xs">
                    Nenhuma transação cadastrada.
                </td>
            </tr>`;
        return;
    }

    transacoes.forEach(t => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-zinc-900/50 transition';

        const isReceita = t.tipo === 'RECEITA';
        const corValor = isReceita ? 'text-emerald-400' : 'text-rose-400';
        const sinal = isReceita ? '+' : '-';

        tr.innerHTML = `
            <td class="py-3 px-4 font-medium text-zinc-200">${t.descricao}</td>
            <td class="py-3 px-4">
                <span class="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded border border-zinc-700/40">
                    ${t.categoria ? t.categoria.nome : 'Sem Categoria'}
                </span>
            </td>
            <td class="py-3 px-4 text-right font-mono font-semibold ${corValor}">
                ${sinal} R$ ${Math.abs(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </td>
            <td class="py-3 px-4 text-center">
                <button onclick="abrirModalEdicao(${t.id})" title="Editar" class="text-zinc-500 hover:text-amber-400 transition p-1 mr-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button onclick="deletarTransacao(${t.id})" title="Excluir" class="text-zinc-500 hover:text-rose-400 transition p-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function atualizarDashboard(transacoes) {
    const totalBalanceSpan = document.getElementById('totalBalance');
    const totalExpensesSpan = document.getElementById('totalExpenses');

    if (!totalBalanceSpan || !totalExpensesSpan) return;

    const saldoInicial = parseFloat(document.body.dataset.saldoInicial) || 0;

    let totalEntradas = 0;
    let totalSaidas = 0;

    transacoes.forEach(t => {
        if (t.tipo === 'RECEITA') {
            totalEntradas += t.valor;
        } else {
            totalSaidas += t.valor;
        }
    });

    const saldoLiquido = saldoInicial + totalEntradas - totalSaidas;

    totalExpensesSpan.textContent = `R$ ${totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    totalBalanceSpan.textContent = `R$ ${saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (saldoLiquido < 0) {
        totalBalanceSpan.className = 'text-2xl font-bold text-rose-400 mt-1';
    } else {
        totalBalanceSpan.className = 'text-2xl font-bold text-emerald-400 mt-1';
    }
}

// ==========================================
// RELATÓRIOS E GRÁFICOS (CHART.JS)
// ==========================================
async function carregarDadosEExibirGrafico() {
    try {
        const response = await fetch(`${API_BASE_URL}/transacoes`, {
            headers: getHeaders()
        });

        let transacoes = [];
        if (response.ok) {
            transacoes = await response.json();
        } else {
            console.warn('Buscando dados do cache local...');
            transacoes = listaTransacoesCache || [];
        }

        // Filtra apenas as despesas para a renderização do gráfico de rosca
        const despesas = transacoes.filter(t => t.tipo === 'DESPESA' || !t.tipo);
        processarEGerarGrafico(despesas);

    } catch (error) {
        console.error('Erro de conexão ao buscar transações para o gráfico:', error);
        const despesasLocais = listaTransacoesCache.filter(t => t.tipo === 'DESPESA');
        processarEGerarGrafico(despesasLocais);
    }
}

function processarEGerarGrafico(despesas) {
    const categoriasAgrupadas = {};
    let valorTotalGeral = 0;

    despesas.forEach(item => {
        const valor = parseFloat(item.valor || item.amount || 0);

        let nomeCategoria = 'Outros';
        if (typeof item.categoria === 'object' && item.categoria !== null) {
            nomeCategoria = item.categoria.nome || 'Outros';
        } else if (typeof item.categoria === 'string' && item.categoria.trim() !== '') {
            nomeCategoria = item.categoria;
        } else if (item.categoriaNome) {
            nomeCategoria = item.categoriaNome;
        }

        if (valor > 0) {
            valorTotalGeral += valor;
            categoriasAgrupadas[nomeCategoria] = (categoriasAgrupadas[nomeCategoria] || 0) + valor;
        }
    });

    let maiorCategoriaNome = '--';
    let maiorCategoriaValor = 0;

    Object.entries(categoriasAgrupadas).forEach(([cat, val]) => {
        if (val > maiorCategoriaValor) {
            maiorCategoriaValor = val;
            maiorCategoriaNome = cat;
        }
    });

    const elTopCategory = document.getElementById('topCategory');
    const elTopCategoryAmount = document.getElementById('topCategoryAmount');
    const elMonthTotal = document.getElementById('monthTotal');

    if (elTopCategory) elTopCategory.innerText = maiorCategoriaNome;
    if (elTopCategoryAmount) elTopCategoryAmount.innerText = formatarMoeda(maiorCategoriaValor);
    if (elMonthTotal) elMonthTotal.innerText = formatarMoeda(valorTotalGeral);

    const labels = Object.keys(categoriasAgrupadas);
    const dataValues = Object.values(categoriasAgrupadas);

    renderizarChartJS(labels, dataValues, labels.length === 0);
}

function renderizarChartJS(labels, dataValues, semDados = false) {
    const canvas = document.getElementById('expensesChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (instanceChart) {
        instanceChart.destroy();
    }

    const coresBase = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];
    const backgroundColors = semDados ? ['#27272a'] : coresBase.slice(0, labels.length);

    instanceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: semDados ? ['Sem registros'] : labels,
            datasets: [{
                data: semDados ? [1] : dataValues,
                backgroundColor: backgroundColors,
                borderColor: '#18181b',
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#a1a1aa',
                        font: { family: 'Inter', size: 12 },
                        padding: 16,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (semDados) return ' Nenhuma despesa cadastrada';
                            const label = context.label || '';
                            const valor = context.raw || 0;
                            return ` ${label}: ${formatarMoeda(valor)}`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}