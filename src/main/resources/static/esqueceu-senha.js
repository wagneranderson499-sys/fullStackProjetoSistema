// ==========================================
// RECUPERAÇÃO DE SENHA (esqueceu-senha.js)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formEsqueceuSenha');
    const mensagemFeedback = document.getElementById('mensagemFeedback');
    const btnEnviar = document.getElementById('btnEnviar');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById('email');
        const email = emailInput ? emailInput.value.trim() : '';

        if (!email) {
            exibirMensagem('Por favor, informe seu e-mail.', '#ef4444');
            return;
        }

        // Feedback visual de carregamento
        btnEnviar.disabled = true;
        exibirMensagem('Enviando e-mail... Por favor, aguarde.', '#3b82f6');

        try {
            // Requisição para a API do Spring Boot em JSON
            const response = await fetch('http://localhost:8080/api/usuarios/esqueci-senha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                exibirMensagem(
                    data.mensagem || data.message || 'Instruções enviadas! Verifique sua caixa de entrada.', 
                    '#10b981'
                );
                form.reset();
            } else {
                exibirMensagem(
                    data.mensagem || data.message || 'E-mail não encontrado no sistema.', 
                    '#ef4444'
                );
            }
        } catch (erro) {
            console.error('Erro na requisição:', erro);
            exibirMensagem('Erro ao conectar com o servidor. Tente novamente mais tarde.', '#ef4444');
        } finally {
            btnEnviar.disabled = false;
        }
    });

    // Função auxiliar para exibir feedback na tela
    function exibirMensagem(texto, corHex) {
        if (mensagemFeedback) {
            mensagemFeedback.style.display = 'block';
            mensagemFeedback.style.color = corHex;
            mensagemFeedback.textContent = texto;
        }
    }
});