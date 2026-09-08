document.addEventListener('DOMContentLoaded', function () {

  
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
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

        const usuarioPendente = {
            name: name,
            email: email,
            password: password,
            emailVerificado: false,
            codigoVerificacao: codigoGerado
        };

       
        localStorage.setItem('tempUser', JSON.stringify(usuarioPendente));

        window.location.href = 'confirmar-email.html';
    });
}
 
//confirmar email

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

    // tela/login
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            let registeredUser = null;

            try {
                registeredUser = JSON.parse(localStorage.getItem('registeredUser'));
            } catch (err) {
                console.error("Erro ao ler dados do usuário cadastrado:", err);
            }

            if (!registeredUser || registeredUser.email !== email || registeredUser.password !== password) {
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

   
    // dados compartilhados
    
    let despesas = [];
    try {
        despesas = JSON.parse(localStorage.getItem('despesasList')) || [];
    } catch (err) {
        despesas = [];
    }

    let saldoTotal = parseFloat(localStorage.getItem('saldoTotal')) || 0;

    function salvarDespesas() {
        localStorage.setItem('despesasList', JSON.stringify(despesas));
    }

    function salvarSaldo() {
        localStorage.setItem('saldoTotal', saldoTotal);
    }

    function formatarMoeda(valor) {
        return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    const nomesCategorias = {
        'dia_a_dia': 'Dia a Dia',
        'fixo': 'Contas Fixas',
        'emergencia': 'Emergência'
    };

    
    //tela principal
    const expenseForm = document.getElementById('expenseForm');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const categorySelect = document.getElementById('category');
    const expenseListBody = document.getElementById('expenseListBody');
    const totalExpensesElement = document.getElementById('totalExpenses');
    const totalBalanceElement = document.getElementById('totalBalance');
    const inputSaldo = document.getElementById('inputSaldo');
    const btnSalvarSaldo = document.getElementById('btnSalvarSaldo');
    const expenseCount = document.getElementById('expenseCount');

    function renderizarLista() {
        if (!expenseListBody) return;

        expenseListBody.innerHTML = '';
        let totalGastos = 0;

        despesas.forEach((item, index) => {
            const valorNum = Number(item.valor) || 0;
            totalGastos += valorNum;

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-700/30 transition';
            tr.innerHTML = `
                <td class="py-3.5 px-4 font-medium text-slate-200">${item.descricao}</td>
                <td class="py-3.5 px-4">
                    <span class="bg-sky-500/10 text-sky-400 text-xs px-2.5 py-1 rounded-full font-medium">
                        ${nomesCategorias[item.categoria] || item.categoria}
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

        if (totalExpensesElement) totalExpensesElement.innerText = formatarMoeda(totalGastos);
        if (totalBalanceElement) totalBalanceElement.innerText = formatarMoeda(saldoTotal - totalGastos);
        if (expenseCount) expenseCount.innerText = `${despesas.length} ${despesas.length === 1 ? 'item' : 'itens'}`;
        if (inputSaldo && saldoTotal > 0) inputSaldo.value = saldoTotal;
    }

    window.removerDespesa = function (index) {
        despesas.splice(index, 1);
        salvarDespesas();
        renderizarLista();
    };

    if (btnSalvarSaldo && inputSaldo) {
        btnSalvarSaldo.addEventListener('click', () => {
            const novoSaldo = parseFloat(inputSaldo.value);
            if (!isNaN(novoSaldo)) {
                saldoTotal = novoSaldo;
                salvarSaldo();
                renderizarLista();
            }
        });
    }

    if (expenseForm) {
        expenseForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const desc = descriptionInput.value.trim();
            const amount = parseFloat(amountInput.value);
            const category = categorySelect.value;

            if (desc && !isNaN(amount) && amount > 0) {
                despesas.push({
                    descricao: desc,
                    valor: amount,
                    categoria: category,
                    data: new Date().toISOString()
                });

                salvarDespesas();
                renderizarLista();

                descriptionInput.value = '';
                amountInput.value = '';
            }
        });

        renderizarLista();
    }


    //grafico

    const expensesChartCanvas = document.getElementById('expensesChart');
    if (expensesChartCanvas && typeof Chart !== 'undefined') {
        const selectMes = document.getElementById('selectMes');
        const topCategory = document.getElementById('topCategory');
        const topCategoryAmount = document.getElementById('topCategoryAmount');
        const monthTotal = document.getElementById('monthTotal');
        let chartInstance = null;

        function atualizarRelatorioMes() {
            const mesSelecionado = selectMes ? selectMes.value : '';

            const despesasFiltradas = despesas.filter(item => {
                if (!mesSelecionado || !item.data) return true;
                const dataItem = new Date(item.data);
                const mesItem = `${dataItem.getFullYear()}-${String(dataItem.getMonth() + 1).padStart(2, '0')}`;
                return mesItem === mesSelecionado;
            });

            const totais = { 'dia_a_dia': 0, 'fixo': 0, 'emergencia': 0 };
            let totalGastoMes = 0;

            despesasFiltradas.forEach(item => {
                const cat = totais.hasOwnProperty(item.categoria) ? item.categoria : 'dia_a_dia';
                const valorNum = Number(item.valor) || 0;
                totais[cat] += valorNum;
                totalGastoMes += valorNum;
            });

            let maiorCat = 'dia_a_dia';
            for (const cat in totais) {
                if (totais[cat] > totais[maiorCat]) maiorCat = cat;
            }

            if (monthTotal) monthTotal.innerText = formatarMoeda(totalGastoMes);
            if (topCategory && topCategoryAmount) {
                if (totalGastoMes > 0) {
                    topCategory.innerText = nomesCategorias[maiorCat] || maiorCat;
                    topCategoryAmount.innerText = formatarMoeda(totais[maiorCat]);
                } else {
                    topCategory.innerText = 'Sem gastos';
                    topCategoryAmount.innerText = 'R$ 0,00';
                }
            }

            if (chartInstance) chartInstance.destroy();

            const ctx = expensesChartCanvas.getContext('2d');
            chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Gastos do Dia a Dia', 'Contas Fixas Mensais', 'Emergência / Imprevisto'],
                    datasets: [{
                        data: [totais['dia_a_dia'], totais['fixo'], totais['emergencia']],
                        backgroundColor: ['#38bdf8', '#fbbf24', '#f87171'],
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

        if (selectMes) selectMes.addEventListener('change', atualizarRelatorioMes);
        atualizarRelatorioMes();
    }
});

