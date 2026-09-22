// ==========================================
// CONFIGURAÇÕES GLOBAIS E AUTENTICAÇÃO
// ==========================================
const API_BASE_URL = 'http://localhost:8080/api';

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
    
    // Pega o nome do arquivo da URL atual (ex: index.html)
    const paginaAtual = window.location.pathname.split('/').pop() || 'index.html';

    // Se não tiver ID salvo e tentar acessar tela privada, manda pro login
    if (!usuarioId && !paginasPublicas.includes(paginaAtual)) {
        window.location.href = 'telaLogin.html';
    }
}

function fazerLogout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'telaLogin.html';
}

// ==========================================
// INICIALIZAÇÃO DE EVENTOS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Executa a checagem de sessão assim que a página carregar
    checarAutenticacao();

    // Form de Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', fazerLogin);
    }

    // Form de Cadastro e Senha
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const passwordInput = document.getElementById('regPassword');
        passwordInput?.addEventListener('input', () => validarSenhaEmTempoReal(passwordInput.value));
        registerForm.addEventListener('submit', executarCadastro);
    }

    // Form do Modal de Verificação de E-mail
    const verifyForm = document.getElementById('verifyForm');
    if (verifyForm) {
        verifyForm.addEventListener('submit', executarVerificacaoCodigo);
    }
});

// ==========================================
// REQUISIÇÕES DE AUTENTICAÇÃO
// ==========================================
async function fazerLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail')?.value.trim();
    const senha = document.getElementById('loginPassword')?.value.trim();

    if (!email || !senha) {
        mostrarErro('Preencha o e-mail e a senha.');
        return;
    }

    setLoadingState('btnLoginText', 'btnLoginSpinner', 'btnLogin', true);

    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            // Guarda dados importantes no LocalStorage individualmente
            if (data.token) localStorage.setItem('token', data.token);
            
            localStorage.setItem('usuarioId', data.id);
            localStorage.setItem('usuarioNome', data.nome || '');
            localStorage.setItem('usuarioEmail', data.email || email);
            localStorage.setItem('usuarioSaldo', data.saldo !== undefined ? data.saldo : 0);
            localStorage.setItem('usuarioLogado', JSON.stringify(data));

            // Direciona para a Dashboard
            window.location.href = 'index.html';
        } else {
            mostrarErro(data.message || 'E-mail ou senha incorretos.');
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        mostrarErro('Não foi possível conectar ao servidor. Verifique se o Spring Boot está rodando.');
    } finally {
        setLoadingState('btnLoginText', 'btnLoginSpinner', 'btnLogin', false, 'Entrar');
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
        mostrarErro('Erro ao conectar com o servidor.');
    } finally {
        setLoadingState('btnRegisterText', 'btnRegisterSpinner', 'btnRegister', false, 'Criar Conta');
    }
}

async function executarVerificacaoCodigo(e) {
    e.preventDefault();

    const codeInput = document.getElementById('verificationCode')?.value.trim();
    const email = localStorage.getItem('tempEmailVerification');

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
            alert('E-mail verificado com sucesso! Faça seu login.');
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

// ==========================================
// FUNÇÕES AUXILIARES DE UI
// ==========================================
function exibirModalVerificacao() {
    const modal = document.getElementById('verifyModal') || document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('hidden');
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
    } else {
        alert(mensagem);
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