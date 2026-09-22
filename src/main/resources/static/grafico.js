// ==========================================
// CONFIGURAÇÕES E CONSTANTES
// ==========================================
const CORES_CATEGORIAS = {
    'Alimentação': '#f59e0b',
    'Moradia': '#3b82f6',
    'Transporte': '#8b5cf6',
    'Lazer': '#ec4899',
    'Saúde': '#10b981',
    'Educação': '#06b6d4',
    'Serviços': '#f97316',
    'Outros': '#6b7280'
};

let meuGrafico = null;

// ==========================================
// FUNÇÕES UTILITÁRIAS E LOCALSTORAGE
// ==========================================
function getStorageKey(tipo) {
    const usuarioId = localStorage.getItem('usuarioId') || 'convidado';
    return `${tipo}_${usuarioId}`;
}

function obterLancamentosLocais() {
    const dados = localStorage.getItem(getStorageKey('transacoes'));
    return dados ? JSON.parse(dados) : [];
}

function checarAutenticacao() {
    const usuarioId = localStorage.getItem('usuarioId');
    if (!usuarioId) {
        window.location.href = 'telaLogin.html';
    }
}

// ==========================================
// RENDERIZAÇÃO DA SIDEBAR E DADOS DO USUÁRIO
// ==========================================
function carregarUsuarioSidebar() {
    const nomeUsuario = localStorage.getItem('usuarioNome') || 'Usuário';
    
    const elNome = document.getElementById('nomeUsuarioSidebar');
    const elAvatar = document.getElementById('avatarUsuario');

    if (elNome) {
        elNome.textContent = nomeUsuario;
    }

    if (elAvatar) {
        const partesNome = nomeUsuario.trim().split(' ');
        let iniciais = '';

        if (partesNome.length >= 2) {
            iniciais = partesNome[0][0] + partesNome[1][0];
        } else if (partesNome.length === 1 && partesNome[0].length > 0) {
            iniciais = partesNome[0].slice(0, 2);
        } else {
            iniciais = 'US';
        }

        elAvatar.textContent = iniciais.toUpperCase();
    }
}

function configurarLogout() {
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'telaLogin.html';
        });
    }
}

// ==========================================
// RENDERIZAÇÃO DO GRÁFICO E CARDS
// ==========================================
function atualizarGraficoECards() {
    if (typeof Chart === 'undefined') {
        console.error('A biblioteca Chart.js não foi carregada no HTML.');
        return;
    }

    const lancamentos = obterLancamentosLocais();
    const totaisPorCategoria = {};
    let valorTotalGeral = 0;

    // Filtra e soma apenas despesas/gastos
    lancamentos.forEach(item => {
        const valorNumerico = parseFloat(item.valor) || 0;
        totaisPorCategoria[item.categoria] = (totaisPorCategoria[item.categoria] || 0) + valorNumerico;
        valorTotalGeral += valorNumerico;
    });

    // 1. Descobrir a Maior Categoria de Gasto
    let maiorCategoria = 'Nenhum gasto';
    let maiorValor = 0;

    for (const [cat, val] of Object.entries(totaisPorCategoria)) {
        if (val > maiorValor) {
            maiorValor = val;
            maiorCategoria = cat;
        }
    }

    // 2. Atualizar Cards no HTML (Mapeado com os IDs da sua tela)
    const elTopCategory = document.getElementById('topCategory');
    const elTopCategoryAmount = document.getElementById('topCategoryAmount');
    const elMonthTotal = document.getElementById('monthTotal');

    if (elTopCategory) {
        elTopCategory.textContent = maiorValor > 0 ? maiorCategoria : 'Nenhum gasto';
    }
    if (elTopCategoryAmount) {
        elTopCategoryAmount.textContent = `R$ ${maiorValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (elMonthTotal) {
        elMonthTotal.textContent = `R$ ${valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // 3. Atualizar o Canvas do Chart.js
    const canvas = document.getElementById('expensesChart');
    if (!canvas) return;

    const categorias = Object.keys(totaisPorCategoria);
    const valores = Object.values(totaisPorCategoria);
    const cores = categorias.map(cat => CORES_CATEGORIAS[cat] || '#6b7280');

    if (meuGrafico) {
        meuGrafico.destroy();
    }

    const ctx = canvas.getContext('2d');

    // Estado Vazio (Sem lançamentos)
    if (categorias.length === 0) {
        meuGrafico = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Sem lançamentos'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#27272a'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
        return;
    }

    // Renderiza o gráfico com dados reais
    meuGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categorias,
            datasets: [{
                data: valores,
                backgroundColor: cores,
                borderColor: '#18181b',
                borderWidth: 2
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
                        font: { size: 12 },
                        padding: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const valor = context.raw || 0;
                            return ` ${context.label}: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                    }
                }
            }
        }
    });
}

// ==========================================
// INICIALIZAÇÃO E EVENTOS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    checarAutenticacao();
    carregarUsuarioSidebar();
    configurarLogout();
    atualizarGraficoECards();
});

// Atualiza o gráfico em tempo real caso transações sejam alteradas
window.addEventListener('transacoesAtualizadas', atualizarGraficoECards);