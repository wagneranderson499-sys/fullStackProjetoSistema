
// gerenciamento e armazenamento de dados

const API_BASE_URL = 'http://localhost:8080/api/auth';

const defaultCategories = [
    { slug: 'dia_a_dia', name: 'Despesas Diárias' },
    { slug: 'fixo', name: 'Contas Fixas' },
    { slug: 'emergencia', name: 'Imprevistos' }
];

/**
 * Gera um Hash SHA-256 para uso em validações locais
 */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


function getStoredSaldo() {
    return parseFloat(localStorage.getItem('saldoTotal')) || 0;
}


function setStoredSaldo(valor) {
    localStorage.setItem('saldoTotal', valor);
}


function getStoredExpenses() {
    try {
        return JSON.parse(localStorage.getItem('despesasList')) || [];
    } catch (err) {
        return [];
    }
}


function setStoredExpenses(expenses) {
    localStorage.setItem('despesasList', JSON.stringify(expenses));
}


function getStoredCategories() {
    try {
        return JSON.parse(localStorage.getItem('customCategories')) || defaultCategories;
    } catch (err) {
        return defaultCategories;
    }
}


function setStoredCategories(categories) {
    localStorage.setItem('customCategories', JSON.stringify(categories));
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


// spring boot api e codigo


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

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome: name,
                    email: email,
                    senha: password
                })
            });

            if (response.ok) {
               
                localStorage.setItem('userEmailPendingVerification', email);

               
                window.location.href = 'confirmar-email.html';
            } else {
                const erroData = await response.json().catch(() => null);
                const erroText = erroData?.message || await response.text();
                
                if (errorMessage) {
                    errorMessage.innerText = erroText || 'Erro ao realizar cadastro.';
                    errorMessage.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Erro de conexão:', error);
            if (errorMessage) {
                errorMessage.innerText = 'Não foi possível conectar ao servidor backend.';
                errorMessage.classList.remove('hidden');
            }
        }
    });
}

const verifyForm = document.getElementById('verifyForm');
if (verifyForm) {
    verifyForm.addEventListener('submit', async function (e) {
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

        let isCodeValid = false;

        try {
            const response = await fetch(`${API_BASE_URL}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: tempUser ? tempUser.email : '',
                    codigo: inputCode 
                })
            });

            if (response.ok) {
                isCodeValid = true;
            } else if (tempUser && inputCode === tempUser.codigoVerificacao) {   
                isCodeValid = true;
            }
        } catch (err) {
            if (tempUser && inputCode === tempUser.codigoVerificacao) {
                isCodeValid = true;
            }
        }

        if (isCodeValid) {
            if (tempUser) {
                tempUser.emailVerificado = true;
                localStorage.setItem('registeredUser', JSON.stringify(tempUser));
                localStorage.removeItem('tempUser');
            }

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

// Login de Usuário
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const loginError = document.getElementById('loginError');

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    senha: password 
                })
            });

            if (response.ok) {
                localStorage.setItem('usuarioLogado', email);
                localStorage.setItem('userEmail', email);

                window.location.href = 'index.html';
            } else {
                const errorMsg = await response.text();
                if (loginError) {
                    loginError.innerText = errorMsg || 'E-mail ou senha incorretos.';
                    loginError.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Erro de autenticação:', error);
            if (loginError) {
                loginError.innerText = 'Não foi possível conectar ao servidor.';
                loginError.classList.remove('hidden');
            }
        }
    });
}

// Verificar Permissão de Sessão nas Páginas Privadas
function verificarSessao() {
    const isPublicPage = window.location.pathname.includes('telaLogin.html') || 
                         window.location.pathname.includes('login.html') || 
                         window.location.pathname.includes('confirmar-email.html') ||
                         window.location.pathname.includes('verificacao.html') ||
                         window.location.pathname.includes('cadastro.html');

    const usuarioLogado = localStorage.getItem('usuarioLogado');

    if (!usuarioLogado && !isPublicPage) {
        window.location.href = 'telaLogin.html';
    }
}

// Logout
function handleLogout() {
    if (confirm('Tem certeza de que deseja sair da sua conta?')) {
        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem('userEmail');
        window.location.href = 'telaLogin.html';
    }
}



//renderização e principal
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

    if (totalExpensesElement) totalExpensesElement.innerText = formatarMoeda(totalGastos);
    if (totalBalanceElement) totalBalanceElement.innerText = formatarMoeda(saldoInicial - totalGastos);
    if (expenseCount) expenseCount.innerText = `${despesas.length} ${despesas.length === 1 ? 'item' : 'itens'}`;

    renderChart();
}


window.removerDespesa = function (index) {
    const despesas = getStoredExpenses();
    despesas.splice(index, 1);
    setStoredExpenses(despesas);
    updateDashboard();
};


function handleExpenseSubmit(e) {
    e.preventDefault();

    const descInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const categorySelect = document.getElementById('category');

    const desc = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

    if (!desc || isNaN(amount) || amount <= 0 || !category) {
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
    }
}


// grafico
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



// 5. perfil, foto de perfil e categoria
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

async function addNewCategory() {
    const input = document.getElementById('newCategoryName');
    const name = input?.value.trim();
   
    if (!name) return;

    try {
        // Envia os dados para a API Spring Boot
        const response = await fetch('http://localhost:8080/api/categorias', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome: name }) // Envia o JSON esperado pelo DTO/Entity Categoria
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        const novaCategoria = await response.json();
        console.log('Categoria salva no banco:', novaCategoria);

        // Limpa o campo de texto
        input.value = '';

        // Atualiza a interface gráfica chamando as funções que buscam do backend
        renderCategoryList();
        populateCategoryDropdown();

    } catch (error) {
        console.error('Falha ao salvar a categoria no backend:', error);
        alert('Não foi possível salvar a categoria. Verifique se o servidor Spring Boot está rodando.');
    }
}
function removeCategory(index) {
    let categories = getStoredCategories();
    if (categories.length <= 1) {
        return;
    }
    categories.splice(index, 1);
    setStoredCategories(categories);

    renderCategoryList();
    populateCategoryDropdown();
}

// Upload do Avatar
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
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

// Modal de Alteração de Senha
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

async function handlePasswordUpdate(event) {
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

    try {
        const registeredUser = JSON.parse(localStorage.getItem('registeredUser'));
        if (registeredUser) {
            registeredUser.password = await hashPassword(newPass);
            localStorage.setItem('registeredUser', JSON.stringify(registeredUser));
        }
    } catch (err) {
        console.error('Erro ao salvar nova senha:', err);
    }

    feedback.className = 'text-xs font-medium text-emerald-400';
    feedback.innerText = 'Senha alterada com sucesso!';

    setTimeout(() => {
        closePasswordModal();
    }, 1200);
}




// iniciar aplicação
document.addEventListener('DOMContentLoaded', function () {
    verificarSessao();
    loadSavedProfileImage();
    populateCategoryDropdown();
    updateDashboard();

    const inputSaldo = document.getElementById('inputSaldo');
    if (inputSaldo) {
        const saldoAtual = getStoredSaldo();
        if (saldoAtual > 0) inputSaldo.placeholder = saldoAtual.toFixed(2);
    }

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

    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordUpdate);
    }

    if (document.getElementById('categoryListContainer')) {
        renderCategoryList();
    }
});