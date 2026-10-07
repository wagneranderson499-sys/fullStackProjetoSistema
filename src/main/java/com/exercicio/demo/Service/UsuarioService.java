package com.exercicio.demo.Service;

import com.exercicio.demo.Model.Usuario;
import com.exercicio.demo.Repository.UsuarioRepository;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UsuarioService {

    private final UsuarioRepository repository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UsuarioService(
            UsuarioRepository repository,
            BCryptPasswordEncoder passwordEncoder,
            EmailService emailService
    ) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public Usuario cadastrar(String name, String email, String rawPassword) {

        // Criptografa a senha antes de salvar
        String passwordHash = passwordEncoder.encode(rawPassword);

        // Gera um código de 6 dígitos aleatório com SecureRandom
        String codigoGerado = String.format(
                "%06d",
                new SecureRandom().nextInt(1000000)
        );

        Usuario usuario = new Usuario();

        usuario.setNome(name);
        usuario.setEmail(email);
        usuario.setSenha(passwordHash);
        usuario.setCodigoVerificacao(codigoGerado);
        usuario.setEmailVerificado(true);

        // Salva o usuário no banco de dados (schema app)
        Usuario usuarioSalvo = repository.save(usuario);

        // Tenta enviar o e-mail de verificação
        try {
            // emailService.enviarCodigoVerificacao(
            //     usuarioSalvo.getEmail(),
            //     codigoGerado
            // );
        } catch (Exception e) {
            System.err.println(
                    "Erro ao enviar e-mail de verificação: "
                            + e.getMessage()
            );
        }

        return usuarioSalvo;
    }

    public boolean autenticar(String email, String rawPassword) {

        Optional<Usuario> opt = repository.findByEmail(email);

        if (opt.isEmpty()) {
            return false;
        }

        Usuario usuario = opt.get();

        return passwordEncoder.matches(
                rawPassword,
                usuario.getSenha()
        );
    }

    // -----------------------------------------------------------
    // MÉTODO 1: Atualizar senha verificando a senha atual
    // (Tela de Configurações)
    // -----------------------------------------------------------

    public boolean atualizarSenha(
            String email,
            String senhaAtual,
            String novaSenha
    ) {

        Optional<Usuario> opt = repository.findByEmail(email);

        if (opt.isEmpty()) {
            return false;
        }

        Usuario usuario = opt.get();

        // Valida se a senha atual está correta
        if (!passwordEncoder.matches(
                senhaAtual,
                usuario.getSenha()
        )) {
            return false;
        }

        // Criptografa e salva a nova senha
        usuario.setSenha(
                passwordEncoder.encode(novaSenha)
        );

        repository.save(usuario);

        return true;
    }

    // -----------------------------------------------------------
    // MÉTODO 2: Redefinir senha sem senha antiga
    // (Fluxo "Esqueci a Senha")
    // -----------------------------------------------------------

    public boolean atualizarSenha(
            String email,
            String novaSenha
    ) {

        Optional<Usuario> opt = repository.findByEmail(email);

        if (opt.isEmpty()) {
            return false;
        }

        Usuario usuario = opt.get();

        usuario.setSenha(
                passwordEncoder.encode(novaSenha)
        );

        repository.save(usuario);

        return true;
    }

    // -----------------------------------------------------------
    // MÉTODO 3: Gerar código para recuperação de senha
    // -----------------------------------------------------------

    public boolean gerarCodigoRedefinicaoSenha(String email) {

        Optional<Usuario> opt = repository.findByEmail(
                email.trim().toLowerCase()
        );

        if (opt.isEmpty()) {
            return false;
        }

        Usuario usuario = opt.get();

        // Gera um código de 6 dígitos
        String codigo = String.format(
                "%06d",
                new SecureRandom().nextInt(1000000)
        );

        // Salva o código no usuário
        usuario.setCodigoRedefinicaoSenha(codigo);

        // Código válido por 10 minutos
        usuario.setExpiracaoCodigoRedefinicao(
                LocalDateTime.now().plusMinutes(10)
        );

        repository.save(usuario);

        return true;
    }

    // -----------------------------------------------------------
    // MÉTODO 4: Validar código de recuperação
    // -----------------------------------------------------------

    public boolean validarCodigoRedefinicaoSenha(
            String email,
            String codigo
    ) {

        Optional<Usuario> opt = repository.findByEmail(
                email.trim().toLowerCase()
        );

        if (opt.isEmpty()) {
            return false;
        }

        Usuario usuario = opt.get();

        // Verifica se existe código
        if (usuario.getCodigoRedefinicaoSenha() == null) {
            return false;
        }

        // Verifica se o código informado está correto
        if (!usuario.getCodigoRedefinicaoSenha().equals(codigo)) {
            return false;
        }

        // Verifica se o código ainda está dentro da validade
        if (usuario.getExpiracaoCodigoRedefinicao() == null ||
                LocalDateTime.now().isAfter(
                        usuario.getExpiracaoCodigoRedefinicao()
                )) {
            return false;
        }

        return true;
    }
}