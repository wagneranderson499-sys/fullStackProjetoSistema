
// gerenciamento e armazenamneto de dados


const defaultCategories = [
    { slug: 'dia_a_dia', name: 'Despesas Diárias' },
    { slug: 'fixo', name: 'Contas Fixas' },
    { slug: 'emergencia', name: 'Imprevistos' }
];

/**
 * Gera um Hash SHA-256 para a senha utilizando a Web Crypto API nativa do navegador
 @param {string} password 
 @returns {Promise<string>} 
 */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Obter saldo inicial/total salvo
function getStoredSaldo() {
    return parseFloat(localStorage.getItem('saldoTotal')) || 0;
}

// Salvar saldo inicial/total
function setStoredSaldo(valor) {
    localStorage.setItem('saldoTotal', valor);
}

// Obter lançamentos/despesas salvos
function getStoredExpenses() {
    try {
        return JSON.parse(localStorage.getItem('despesasList')) || [];
    } catch (err) {
        return [];
    }
}

// Salvar lançamentos/despesas
function setStoredExpenses(expenses) {
    localStorage.setItem('despesasList', JSON.stringify(expenses));
}

// Obter categorias salvas
function getStoredCategories() {
    try {
        return JSON.parse(localStorage.getItem('customCategories')) || defaultCategories;
    } catch (err) {
        return defaultCategories;
    }
}

// Salvar categorias
function setStoredCategories(categories) {
    localStorage.setItem('customCategories', JSON.stringify(categories));
}

// Formatador Monetário (BRL)
function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Escape de HTML para segurança
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


// 2.registro


// Cadastro
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const errorMessage = document.getElementById('errorMessage');

        if (password !== confirmPassword) {
            if (errorMessage) {
                errorMessage.innerText = "As senhas não coincidem.";
                errorMessage.classList.remove('hidden');
            }
            return;
        }

        const codigoGerado = Math.floor(100000 + Math.random() * 900000).toString();

        // Aplicando a criptografia de hash na senha antes do salvamento
        const hashedPassword = await hashPassword(password);

        const usuarioPendente = {
            name: name,
            email: email,
            password: hashedPassword,
            emailVerificado: false,
            codigoVerificacao: codigoGerado
        };

        localStorage.setItem('tempUser', JSON.stringify(usuarioPendente));
        window.location.href = 'confirmar-email.html';
    });
}

// Confirmação de E-mail
const verifyForm = document.getElementById('verifyForm');
if (verifyForm) {
    verifyForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const inputCode = document.getElementById('inputCode').value.trim();
        const verifyError = document.getElementById('verifyError');
        const verifySuccess = document.getElementById('verifySuccess');
        const btnVerify = document.getElementById('btnVerify');
        let tempUser = null;

        try {
            tempUser = JSON.parse(localStorage.getItem('tempUser'));
        } catch (err) {
            console.error("Erro ao ler dados temporários do usuário:", err);
        }

        if (tempUser && inputCode === tempUser.codigoVerificacao) {
            tempUser.emailVerificado = true;

            localStorage.setItem('registeredUser', JSON.stringify(tempUser));
            localStorage.removeItem('tempUser');

            if (verifyError) verifyError.classList.add('hidden');
            if (verifySuccess) verifySuccess.classList.remove('hidden');
            if (btnVerify) {
                btnVerify.disabled = true;
                btnVerify.classList.add('opacity-50', 'cursor-not-allowed');
            }

            setTimeout(() => {
                window.location.href = 'telaLogin.html';
            }, 1500);
        } else {
            if (verifySuccess) verifySuccess.classList.add('hidden');
            if (verifyError) verifyError.classList.remove('hidden');
        }
    });
}

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        let registeredUser = null;

        try {
            registeredUser = JSON.parse(localStorage.getItem('registeredUser'));
        } catch (err) {
            console.error("Erro ao ler dados do usuário cadastrado:", err);
        }

        // Gera o hash da senha digitada no formulário de login
        const hashedPassword = await hashPassword(password);

        // Compara os hashes em vez do texto puro
        if (!registeredUser || registeredUser.email !== email || registeredUser.password !== hashedPassword) {
            alert('Acesso Negado! Usuário não encontrado ou senha incorreta.');
            return;
        }

        if (!registeredUser.emailVerificado) {
            alert('Sua conta ainda não foi ativada. Confirme o código enviado ao seu e-mail.');
            window.location.href = 'confirmar-email.html';
            return;
        }

        localStorage.setItem('userEmail', email);
        window.location.href = 'index.html';
    });
}

// Logout
function handleLogout() {
    if (confirm('Tem certeza de que deseja sair da sua conta?')) {
        window.location.href = 'login.html';
    }
}


// 3.renderização/principal


// Preenche os selects de categoria dinamicamente
function populateCategoryDropdown() {
    const categorySelects = document.querySelectorAll('.category-select-dropdown, #category');
    if (!categorySelects.length) return;

    const categories = getStoredCategories();

    categorySelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="" disabled selected>Selecione uma categoria</option>';

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.slug || cat.name;
            option.textContent = cat.name;
            select.appendChild(option);
        });

        if (currentValue) select.value = currentValue;
    });
}

// Atualiza lista e resumos financeiros da Dashboard
function updateDashboard() {
    const despesas = getStoredExpenses();
    const saldoInicial = getStoredSaldo();
    const categories = getStoredCategories();

    // Mapeamento de Slugs para Nomes
    const categoryMap = {};
    categories.forEach(c => { categoryMap[c.slug || c.name] = c.name; });

    const expenseListBody = document.getElementById('expenseListBody');
    const totalExpensesElement = document.getElementById('totalExpenses');
    const totalBalanceElement = document.getElementById('totalBalance');
    const expenseCount = document.getElementById('expenseCount');

    let totalGastos = 0;

    if (expenseListBody) {
        expenseListBody.innerHTML = '';

        if (despesas.length === 0) {
            expenseListBody.innerHTML = `
                <tr>
                    <td colspan="4" class="py-6 text-center text-slate-500 text-xs">
                        Nenhuma transação cadastrada.
                    </td>
                </tr>
            `;
        } else {
            despesas.forEach((item, index) => {
                const valorNum = Number(item.valor || item.amount) || 0;
                const desc = item.descricao || item.description || '';
                const catKey = item.categoria || item.category || '';
                totalGastos += valorNum;

                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-700/30 transition';
                tr.innerHTML = `
                    <td class="py-3.5 px-4 font-medium text-slate-200">${escapeHtml(desc)}</td>
                    <td class="py-3.5 px-4">
                        <span class="bg-sky-500/10 text-sky-400 text-xs px-2.5 py-1 rounded-full font-medium">
                            ${escapeHtml(categoryMap[catKey] || catKey)}
                        </span>
                    </td>
                    <td class="py-3.5 px-4 text-right text-rose-400 font-semibold">- ${formatarMoeda(valorNum)}</td>
                    <td class="py-3.5 px-4 text-center">
                        <button onclick="removerDespesa(${index})" class="p-1.5 hover:bg-slate-700 rounded transition text-slate-400 hover:text-rose-400" title="Excluir">
                            ✕
                        </button>
                    </td>
                `;
                expenseListBody.appendChild(tr);
            });
        }
    }

    // Atualização dos Cards
    if (totalExpensesElement) totalExpensesElement.innerText = formatarMoeda(totalGastos);
    if (totalBalanceElement) totalBalanceElement.innerText = formatarMoeda(saldoInicial - totalGastos);
    if (expenseCount) expenseCount.innerText = `${despesas.length} ${despesas.length === 1 ? 'item' : 'itens'}`;

    // Atualizar Gráfico (se existir)
    renderChart();
}

// Remover Despesa
window.removerDespesa = function (index) {
    const despesas = getStoredExpenses();
    despesas.splice(index, 1);
    setStoredExpenses(despesas);
    updateDashboard();
};

// Submeter Novo Lançamento
function handleExpenseSubmit(e) {
    e.preventDefault();

    const descInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const categorySelect = document.getElementById('category');

    const desc = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

    if (!desc || isNaN(amount) || amount <= 0 || !category) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    const despesas = getStoredExpenses();
    despesas.unshift({
        descricao: desc,
        valor: amount,
        categoria: category,
        data: new Date().toISOString()
    });

    setStoredExpenses(despesas);
    updateDashboard();

    descInput.value = '';
    amountInput.value = '';
    categorySelect.selectedIndex = 0;
}

// Salvar Saldo Inicial
function handleSaveSaldo() {
    const inputSaldo = document.getElementById('inputSaldo');
    if (!inputSaldo) return;

    const novoSaldo = parseFloat(inputSaldo.value);
    if (!isNaN(novoSaldo)) {
        setStoredSaldo(novoSaldo);
        inputSaldo.value = '';
        updateDashboard();
    } else {
        alert('Informe um valor de saldo válido.');
    }
}


//grafico


let chartInstance = null;

function renderChart() {
    const expensesChartCanvas = document.getElementById('expensesChart');
    if (!expensesChartCanvas || typeof Chart === 'undefined') return;

    const selectMes = document.getElementById('selectMes');
    const topCategory = document.getElementById('topCategory');
    const topCategoryAmount = document.getElementById('topCategoryAmount');
    const monthTotal = document.getElementById('monthTotal');

    const despesas = getStoredExpenses();
    const categories = getStoredCategories();
    const mesSelecionado = selectMes ? selectMes.value : '';

    const despesasFiltradas = despesas.filter(item => {
        if (!mesSelecionado || !item.data) return true;
        const dataItem = new Date(item.data);
        const mesItem = `${dataItem.getFullYear()}-${String(dataItem.getMonth() + 1).padStart(2, '0')}`;
        return mesItem === mesSelecionado;
    });

    const totaisPorCategoria = {};
    let totalGastoMes = 0;

    categories.forEach(c => { totaisPorCategoria[c.slug || c.name] = 0; });

    despesasFiltradas.forEach(item => {
        const cat = item.categoria || item.category;
        const valorNum = Number(item.valor || item.amount) || 0;

        if (totaisPorCategoria.hasOwnProperty(cat)) {
            totaisPorCategoria[cat] += valorNum;
        } else {
            totaisPorCategoria[cat] = valorNum;
        }
        totalGastoMes += valorNum;
    });

    let maiorCatKey = '';
    let maiorValor = -1;

    for (const catKey in totaisPorCategoria) {
        if (totaisPorCategoria[catKey] > maiorValor) {
            maiorValor = totaisPorCategoria[catKey];
            maiorCatKey = catKey;
        }
    }

    if (monthTotal) monthTotal.innerText = formatarMoeda(totalGastoMes);
    if (topCategory && topCategoryAmount) {
        if (totalGastoMes > 0 && maiorValor > 0) {
            const catObj = categories.find(c => (c.slug || c.name) === maiorCatKey);
            topCategory.innerText = catObj ? catObj.name : maiorCatKey;
            topCategoryAmount.innerText = formatarMoeda(maiorValor);
        } else {
            topCategory.innerText = 'Sem gastos';
            topCategoryAmount.innerText = 'R$ 0,00';
        }
    }

    if (chartInstance) chartInstance.destroy();

    const labels = categories.map(c => c.name);
    const dataValues = categories.map(c => totaisPorCategoria[c.slug || c.name] || 0);
    const backgroundColors = ['#38bdf8', '#fbbf24', '#f87171', '#a78bfa', '#34d399', '#f472b6'];

    const ctx = expensesChartCanvas.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderColor: '#1e293b',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { family: 'Inter', size: 13 }, padding: 20 }
                }
            }
        }
    });
}


// perfil e configuração de categoria


function renderCategoryList() {
    const container = document.getElementById('categoryListContainer');
    if (!container) return;

    const categories = getStoredCategories();
    container.innerHTML = '';

    categories.forEach((cat, index) => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between bg-zinc-950 border border-zinc-800/80 rounded-lg px-4 py-2.5';
        item.innerHTML = `
            <span class="text-sm font-medium text-zinc-200">${escapeHtml(cat.name)}</span>
            <button onclick="removeCategory(${index})" class="text-zinc-500 hover:text-rose-400 transition p-1" title="Excluir Categoria">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        `;
        container.appendChild(item);
    });
}

function addNewCategory() {
    const input = document.getElementById('newCategoryName');
    const name = input?.value.trim();
    if (!name) return;

    const categories = getStoredCategories();
    const slug = name.toLowerCase().replace(/\s+/g, '_');

    categories.push({ slug, name });
    setStoredCategories(categories);

    input.value = '';
    renderCategoryList();
    populateCategoryDropdown();
}

function removeCategory(index) {
    let categories = getStoredCategories();
    if (categories.length <= 1) {
        alert('É necessário manter ao menos uma categoria cadastrada.');
        return;
    }
    categories.splice(index, 1);
    setStoredCategories(categories);

    renderCategoryList();
    populateCategoryDropdown();
}

// Avatar / Foto de Perfil
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert('A imagem excede o tamanho máximo permitido de 2MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64Image = e.target.result;
        localStorage.setItem('userAvatar', base64Image);
        applyProfileImage(base64Image);
    };
    reader.readAsDataURL(file);
}

function removeProfileImage() {
    localStorage.removeItem('userAvatar');

    const avatarImg = document.getElementById('avatarImg');
    const avatarInitials = document.getElementById('avatarInitials');
    if (avatarImg) avatarImg.classList.add('hidden');
    if (avatarInitials) avatarInitials.classList.remove('hidden');

    const sidebarAvatarImg = document.getElementById('sidebarAvatarImg');
    const sidebarAvatarText = document.getElementById('sidebarAvatarText');
    if (sidebarAvatarImg) sidebarAvatarImg.classList.add('hidden');
    if (sidebarAvatarText) sidebarAvatarText.classList.remove('hidden');

    const fileInput = document.getElementById('profileImageInput');
    if (fileInput) fileInput.value = '';
}

function loadSavedProfileImage() {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
        applyProfileImage(savedAvatar);
    }
}

function applyProfileImage(src) {
    const avatarImg = document.getElementById('avatarImg');
    const avatarInitials = document.getElementById('avatarInitials');
    if (avatarImg && avatarInitials) {
        avatarImg.src = src;
        avatarImg.classList.remove('hidden');
        avatarInitials.classList.add('hidden');
    }

    const sidebarAvatarImg = document.getElementById('sidebarAvatarImg');
    const sidebarAvatarText = document.getElementById('sidebarAvatarText');
    if (sidebarAvatarImg && sidebarAvatarText) {
        sidebarAvatarImg.src = src;
        sidebarAvatarImg.classList.remove('hidden');
        sidebarAvatarText.classList.add('hidden');
    }
}

// Modal de Senha
function openPasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        
        document.getElementById('passwordForm')?.reset();
        const feedback = document.getElementById('passwordFeedback');
        if (feedback) feedback.innerText = '';
        const meter = document.getElementById('strengthMeter');
        if (meter) meter.style.width = '0%';
    }
}

function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.type = field.type === 'password' ? 'text' : 'password';
}

function evaluatePasswordStrength() {
    const pass = document.getElementById('newPassword')?.value || '';
    const meter = document.getElementById('strengthMeter');

    const hasLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass);

    updateRequirementUI('req-length', hasLength);
    updateRequirementUI('req-uppercase', hasUpper);
    updateRequirementUI('req-number', hasNumber);
    updateRequirementUI('req-special', hasSpecial);

    let score = 0;
    if (hasLength) score++;
    if (hasUpper) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    if (!meter) return;

    if (pass.length === 0) {
        meter.style.width = '0%';
        meter.className = 'h-full transition-all duration-300';
    } else if (score <= 1) {
        meter.style.width = '25%';
        meter.className = 'h-full bg-rose-500 transition-all duration-300';
    } else if (score === 2 || score === 3) {
        meter.style.width = '65%';
        meter.className = 'h-full bg-amber-500 transition-all duration-300';
    } else {
        meter.style.width = '100%';
        meter.className = 'h-full bg-emerald-500 transition-all duration-300';
    }
}

function updateRequirementUI(elementId, isValid) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.className = isValid ? 'text-emerald-400 font-medium' : 'text-zinc-400';
}

function handlePasswordUpdate(event) {
    event.preventDefault();
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmNewPassword').value;
    const feedback = document.getElementById('passwordFeedback');

    const hasLength = newPass.length >= 8;
    const hasUpper = /[A-Z]/.test(newPass);
    const hasNumber = /[0-9]/.test(newPass);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPass);

    if (!hasLength || !hasUpper || !hasNumber || !hasSpecial) {
        feedback.className = 'text-xs font-medium text-rose-400';
        feedback.innerText = 'A nova senha precisa atender a todos os requisitos de segurança.';
        return;
    }

    if (newPass !== confirmPass) {
        feedback.className = 'text-xs font-medium text-rose-400';
        feedback.innerText = 'A nova senha e a confirmação não coincidem.';
        return;
    }

    feedback.className = 'text-xs font-medium text-emerald-400';
    feedback.innerText = 'Senha alterada com sucesso!';

    setTimeout(() => {
        closePasswordModal();
    }, 1200);
}

function handleForgotPassword() {
    const feedback = document.getElementById('passwordFeedback');
    if (feedback) {
        feedback.className = 'text-xs font-medium text-emerald-400';
        feedback.innerText = 'Enviamos um link de redefinição para o seu e-mail.';
    }
    alert('Enviamos um link de redefinição de senha para o seu e-mail cadastrado.');
}


//aplicação


document.addEventListener('DOMContentLoaded', function () {
    // Carrega avatar salvo
    loadSavedProfileImage();

    // Carrega dropdowns de categoria
    populateCategoryDropdown();

    // Atualiza o painel financeiro / tabela
    updateDashboard();

    // Preenche input de saldo se houver valor prévio
    const inputSaldo = document.getElementById('inputSaldo');
    if (inputSaldo) {
        const saldoAtual = getStoredSaldo();
        if (saldoAtual > 0) inputSaldo.placeholder = saldoAtual.toFixed(2);
    }

    // Registra listeners de formulários e botões principais
    const btnSalvarSaldo = document.getElementById('btnSalvarSaldo');
    if (btnSalvarSaldo) {
        btnSalvarSaldo.addEventListener('click', handleSaveSaldo);
    }

    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', handleExpenseSubmit);
    }

    const selectMes = document.getElementById('selectMes');
    if (selectMes) {
        selectMes.addEventListener('change', renderChart);
    }

    // Carrega lista de categorias na aba de configurações (se presente)
    if (document.getElementById('categoryListContainer')) {
        renderCategoryList();
    }
});