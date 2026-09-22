// ==========================================
// CONFIGURAÇÕES E INICIALIZAÇÃO
// ==========================================
const CATEGORIAS_PADRAO = [
    'Alimentação', 'Moradia', 'Transporte', 
    'Lazer', 'Saúde', 'Educação', 'Serviços', 'Outros'
];

function getStorageKey(chave) {
    const usuarioId = localStorage.getItem('usuarioId') || 'convidado';
    return `${chave}_${usuarioId}`;
}

document.addEventListener('DOMContentLoaded', () => {
    checarAutenticacao();
    carregarPerfilUsuario();
    carregarCategorias();
});

function checarAutenticacao() {
    const usuarioId = localStorage.getItem('usuarioId');
    if (!usuarioId) {
        window.location.href = 'telaLogin.html';
    }
}

function handleLogout() {
    localStorage.clear();
    window.location.href = 'telaLogin.html';
}

// ==========================================
// CARREGAMENTO E PERFIL DO USUÁRIO
// ==========================================
function carregarPerfilUsuario() {
    const nome = localStorage.getItem('usuarioNome') || 'Usuário';
    const email = localStorage.getItem('usuarioEmail') || 'usuario@email.com';
    const foto = localStorage.getItem(getStorageKey('fotoPerfil'));

    // Atualiza nome e email na sidebar e header
    const elSidebarName = document.querySelector('aside .text-xs.font-semibold');
    if (elSidebarName) elSidebarName.textContent = nome;

    const elProfileName = document.querySelector('section h2.text-sm');
    const elProfileEmail = document.querySelector('section p.text-xs');
    if (elProfileName) elProfileName.textContent = nome;
    if (elProfileEmail) elProfileEmail.textContent = email;

    // Gerar iniciais dinâmicas
    const partesNome = nome.trim().split(' ');
    let iniciais = 'US';
    if (partesNome.length >= 2) {
        iniciais = partesNome[0][0] + partesNome[1][0];
    } else if (partesNome.length === 1 && partesNome[0].length > 0) {
        iniciais = partesNome[0].slice(0, 2);
    }
    iniciais = iniciais.toUpperCase();

    const elSidebarText = document.getElementById('sidebarAvatarText');
    const elAvatarInitials = document.getElementById('avatarInitials');
    if (elSidebarText) elSidebarText.textContent = iniciais;
    if (elAvatarInitials) elAvatarInitials.textContent = iniciais;

    if (foto) {
        exibirFotoPerfil(foto);
    }
}

// ==========================================
// GERENCIAMENTO DE FOTO DE PERFIL
// ==========================================
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido.');
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64Image = e.target.result;
        localStorage.setItem(getStorageKey('fotoPerfil'), base64Image);
        exibirFotoPerfil(base64Image);
    };
    reader.readAsDataURL(file);
}

function exibirFotoPerfil(src) {
    // Foto Sidebar
    const sideText = document.getElementById('sidebarAvatarText');
    const sideImg = document.getElementById('sidebarAvatarImg');
    if (sideText && sideImg) {
        sideText.classList.add('hidden');
        sideImg.src = src;
        sideImg.classList.remove('hidden');
    }

    // Foto Card Principal
    const mainText = document.getElementById('avatarInitials');
    const mainImg = document.getElementById('avatarImg');
    if (mainText && mainImg) {
        mainText.classList.add('hidden');
        mainImg.src = src;
        mainImg.classList.remove('hidden');
    }
}

function removeProfileImage() {
    localStorage.removeItem(getStorageKey('fotoPerfil'));

    const sideText = document.getElementById('sidebarAvatarText');
    const sideImg = document.getElementById('sidebarAvatarImg');
    if (sideText && sideImg) {
        sideText.classList.remove('hidden');
        sideImg.classList.add('hidden');
        sideImg.src = '';
    }

    const mainText = document.getElementById('avatarInitials');
    const mainImg = document.getElementById('avatarImg');
    if (mainText && mainImg) {
        mainText.classList.remove('hidden');
        mainImg.classList.add('hidden');
        mainImg.src = '';
    }

    const fileInput = document.getElementById('profileImageInput');
    if (fileInput) fileInput.value = '';
}

// ==========================================
// GESTÃO DE CATEGORIAS (ADICIONAR/LISTAR/EXCLUIR)
// ==========================================
function obterCategoriasDoUsuario() {
    const salvas = localStorage.getItem(getStorageKey('categorias'));
    if (salvas) {
        return JSON.parse(salvas);
    }
    localStorage.setItem(getStorageKey('categorias'), JSON.stringify(CATEGORIAS_PADRAO));
    return [...CATEGORIAS_PADRAO];
}

function carregarCategorias() {
    const container = document.getElementById('categoryListContainer');
    if (!container) return;

    const categorias = obterCategoriasDoUsuario();
    container.innerHTML = '';

    if (categorias.length === 0) {
        container.innerHTML = `<p class="text-xs text-zinc-500 italic py-2">Nenhuma categoria cadastrada.</p>`;
        return;
    }

    categorias.forEach((cat) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'flex items-center justify-between bg-zinc-950 border border-zinc-800/80 rounded-lg px-3.5 py-2.5 transition hover:border-zinc-700/80';
        
        itemDiv.innerHTML = `
            <span class="text-xs font-medium text-zinc-200">${cat}</span>
            <button type="button" onclick="removeCategory('${cat}')" title="Excluir Categoria" class="text-zinc-500 hover:text-rose-400 p-1 rounded transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        `;

        container.appendChild(itemDiv);
    });
}

function addNewCategory() {
    const input = document.getElementById('newCategoryName');
    if (!input) return;

    const nomeCategoria = input.value.trim();

    if (!nomeCategoria) {
        alert('Digite o nome da categoria.');
        return;
    }

    const categorias = obterCategoriasDoUsuario();

    const jaExiste = categorias.some(cat => cat.toLowerCase() === nomeCategoria.toLowerCase());
    if (jaExiste) {
        alert('Esta categoria já existe!');
        return;
    }

    categorias.push(nomeCategoria);
    localStorage.setItem(getStorageKey('categorias'), JSON.stringify(categorias));

    input.value = '';
    carregarCategorias();
    window.dispatchEvent(new Event('categoriasAtualizadas'));
}

function removeCategory(nomeCategoria) {
    if (!confirm(`Deseja realmente remover a categoria "${nomeCategoria}"?`)) {
        return;
    }

    let categorias = obterCategoriasDoUsuario();
    categorias = categorias.filter(cat => cat !== nomeCategoria);

    localStorage.setItem(getStorageKey('categorias'), JSON.stringify(categorias));
    carregarCategorias();
    window.dispatchEvent(new Event('categoriasAtualizadas'));
}

// ==========================================
// MODAL DE ALTERAÇÃO DE SENHA E VALIDAÇÃO
// ==========================================
function openPasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    const form = document.getElementById('passwordForm');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    if (form) form.reset();
    
    const meter = document.getElementById('strengthMeter');
    const feedback = document.getElementById('passwordFeedback');
    if (meter) meter.style.width = '0%';
    if (feedback) feedback.textContent = '';
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

function updateReqStatus(element, isValid) {
    if (element) {
        if (isValid) {
            element.classList.remove('text-zinc-400');
            element.classList.add('text-emerald-400', 'font-medium');
        } else {
            element.classList.remove('text-emerald-400', 'font-medium');
            element.classList.add('text-zinc-400');
        }
    }
}

function evaluatePasswordStrength() {
    const input = document.getElementById('newPassword');
    if (!input) return;
    const password = input.value;
    const meter = document.getElementById('strengthMeter');

    const reqLength = document.getElementById('req-length');
    const reqUpper = document.getElementById('req-uppercase');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');

    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    updateReqStatus(reqLength, hasLength);
    updateReqStatus(reqUpper, hasUpper);
    updateReqStatus(reqNumber, hasNumber);
    updateReqStatus(reqSpecial, hasSpecial);

    let score = 0;
    if (hasLength) score++;
    if (hasUpper) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    const percentages = ['w-0', 'w-1/4 bg-red-500', 'w-2/4 bg-orange-500', 'w-3/4 bg-yellow-500', 'w-full bg-emerald-500'];
    if (meter) {
        meter.className = `h-full transition-all duration-300 ${percentages[score]}`;
    }
}

async function handlePasswordUpdate(event) {
    event.preventDefault();

    const currentPasswordInput = document.getElementById('currentPassword');
    const currentPassword = currentPasswordInput ? currentPasswordInput.value : '';
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    const feedback = document.getElementById('passwordFeedback');

    if (newPassword !== confirmNewPassword) {
        if (feedback) {
            feedback.innerText = "As senhas não coincidem.";
            feedback.className = "text-xs font-medium min-h-[16px] text-red-400";
        }
        return;
    }

    if (newPassword.length < 8) {
        if (feedback) {
            feedback.innerText = "A nova senha precisa ter no mínimo 8 caracteres.";
            feedback.className = "text-xs font-medium min-h-[16px] text-red-400";
        }
        return;
    }

    const email = localStorage.getItem('usuarioEmail') || localStorage.getItem('userEmail');

    if (!email) {
        if (feedback) {
            feedback.innerText = "E-mail não identificado. Faça login novamente.";
            feedback.className = "text-xs font-medium min-h-[16px] text-red-400";
        }
        return;
    }

    try {
        if (feedback) {
            feedback.innerText = "Enviando alteração...";
            feedback.className = "text-xs font-medium min-h-[16px] text-zinc-400";
        }

        const response = await fetch('http://localhost:8080/api/usuarios/alterar-senha', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                senhaAtual: currentPassword,
                novaSenha: newPassword
            })
        });

        if (response.ok) {
            if (feedback) {
                feedback.innerText = "Senha alterada com sucesso!";
                feedback.className = "text-xs font-medium min-h-[16px] text-emerald-400";
            }
            
            setTimeout(() => {
                const form = document.getElementById('passwordForm');
                if (form) form.reset();
                if (typeof evaluatePasswordStrength === 'function') {
                    evaluatePasswordStrength();
                }
                closePasswordModal();
            }, 1500);
        } else {
            const errorMsg = await response.text();
            if (feedback) {
                feedback.innerText = errorMsg || "Erro ao alterar a senha. Verifique sua senha atual.";
                feedback.className = "text-xs font-medium min-h-[16px] text-red-400";
            }
        }
    } catch (error) {
        console.error('Erro:', error);
        if (feedback) {
            feedback.innerText = "Falha de conexão com o servidor.";
            feedback.className = "text-xs font-medium min-h-[16px] text-red-400";
        }
    }
}

async function handleForgotPassword() {
    const email = localStorage.getItem('usuarioEmail') || localStorage.getItem('userEmail');
    
    if (!email) {
        alert("E-mail não identificado. Por favor, faça login novamente.");
        return;
    }

    if (confirm(`Deseja enviar um e-mail de redefinição para ${email}?`)) {
        try {
            const response = await fetch('http://localhost:8080/api/usuarios/esqueci-senha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });

            if (response.ok) {
                alert("E-mail de redefinição enviado com sucesso! Verifique sua caixa de entrada.");
                closePasswordModal();
            } else {
                alert("Erro ao enviar o e-mail de redefinição. Tente novamente mais tarde.");
            }
        } catch (error) {
            console.error('Erro:', error);
            alert("Erro ao conectar com o servidor.");
        }
    }
}

// Garante que o evento onClick do HTML consiga encontrar a função globalmente
window.handleForgotPassword = handleForgotPassword;