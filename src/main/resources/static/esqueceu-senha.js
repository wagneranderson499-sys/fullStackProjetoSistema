// ==========================================
// RECUPERAÇÃO DE SENHA (esqueceu-senha.js)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('formEsqueceuSenha');
    const mensagemFeedback = document.getElementById('mensagemFeedback');
    const btnEnviar = document.getElementById('btnEnviar');

    const campoEmail = document.getElementById('campoEmail');
    const campoCodigo = document.getElementById('campoCodigo');
    const btnValidarCodigo = document.getElementById('btnValidarCodigo');
    const textoInstrucao = document.getElementById('textoInstrucao');

    if (!form) return;

    // ==========================================
    // ETAPA 1 - ENVIAR CÓDIGO POR E-MAIL
    // ==========================================

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        const emailInput = document.getElementById('email');
        const email = emailInput ? emailInput.value.trim() : '';

        if (!email) {
            exibirMensagem(
                'Por favor, informe seu e-mail.',
                '#ef4444'
            );
            return;
        }

        btnEnviar.disabled = true;

        exibirMensagem(
            'Enviando código... Por favor, aguarde.',
            '#3b82f6'
        );

        try {

            const response = await fetch('/api/usuarios/esqueci-senha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email
                })
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {

                exibirMensagem(
                    data.mensagem ||
                    data.message ||
                    'Código enviado! Verifique seu e-mail.',
                    '#10b981'
                );

                // Esconde o campo de e-mail
                if (campoEmail) {
                    campoEmail.style.display = 'none';
                }

                // Mostra o campo do código
                if (campoCodigo) {
                    campoCodigo.style.display = 'block';
                }

                // Esconde o botão de enviar e-mail
                btnEnviar.style.display = 'none';

                // Mostra o botão de validar código
                if (btnValidarCodigo) {
                    btnValidarCodigo.style.display = 'block';
                }

                // Atualiza a instrução
                if (textoInstrucao) {
                    textoInstrucao.textContent =
                        'Digite o código de 6 dígitos que enviamos para o seu e-mail.';
                }

            } else {

                exibirMensagem(
                    data.mensagem ||
                    data.message ||
                    'E-mail não encontrado no sistema.',
                    '#ef4444'
                );
            }

        } catch (erro) {

            console.error('Erro na requisição:', erro);

            exibirMensagem(
                'Erro ao conectar com o servidor. Tente novamente mais tarde.',
                '#ef4444'
            );

        } finally {

            btnEnviar.disabled = false;
        }
    });


    // ==========================================
    // ETAPA 2 - VALIDAR CÓDIGO
    // ==========================================

    if (btnValidarCodigo) {

        btnValidarCodigo.addEventListener('click', async () => {

            const emailInput = document.getElementById('email');
            const codigoInput = document.getElementById('codigo');

            const email = emailInput ? emailInput.value.trim() : '';
            const codigo = codigoInput ? codigoInput.value.trim() : '';

            if (!codigo) {

                exibirMensagem(
                    'Digite o código recebido por e-mail.',
                    '#ef4444'
                );

                return;
            }

            if (codigo.length !== 6) {

                exibirMensagem(
                    'O código deve ter 6 dígitos.',
                    '#ef4444'
                );

                return;
            }

            btnValidarCodigo.disabled = true;

            exibirMensagem(
                'Validando código...',
                '#3b82f6'
            );

            try {

                const response = await fetch(
                    '/api/usuarios/validar-codigo-redefinicao',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email: email,
                            codigo: codigo
                        })
                    }
                );

                const data = await response.json().catch(() => ({}));

                if (response.ok) {

                    exibirMensagem(
                        data.mensagem ||
                        data.message ||
                        'Código validado com sucesso!',
                        '#10b981'
                    );

                    console.log('Código validado com sucesso.');

                    // A próxima etapa será criada aqui:
                    // mostrar os campos para criar a nova senha.

                } else {

                    exibirMensagem(
                        data.mensagem ||
                        data.message ||
                        'Código inválido ou expirado.',
                        '#ef4444'
                    );
                }

            } catch (erro) {

                console.error('Erro ao validar código:', erro);

                exibirMensagem(
                    'Erro ao conectar com o servidor. Tente novamente mais tarde.',
                    '#ef4444'
                );

            } finally {

                btnValidarCodigo.disabled = false;
            }
        });
    }


    // ==========================================
    // FUNÇÃO AUXILIAR
    // ==========================================

    function exibirMensagem(texto, corHex) {

        if (mensagemFeedback) {

            mensagemFeedback.style.display = 'block';
            mensagemFeedback.style.color = corHex;
            mensagemFeedback.textContent = texto;
        }
    }

});