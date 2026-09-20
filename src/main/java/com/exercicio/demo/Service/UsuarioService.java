package com.exercicio.demo.Service;

import com.exercicio.demo.Model.Usuario;
import com.exercicio.demo.Repository.UsuarioRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Optional;

@Service
public class UsuarioService {

    private final UsuarioRepository repository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public UsuarioService(UsuarioRepository repository, BCryptPasswordEncoder passwordEncoder, EmailService emailService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public Usuario cadastrar(String name, String email, String rawPassword) {
        // Criptografa a senha antes de salvar
        String passwordHash = passwordEncoder.encode(rawPassword);
        
        // Gera um código de 6 dígitos aleatório com SecureRandom
        String codigoGerado = String.format("%06d", new SecureRandom().nextInt(1000000));
        
        Usuario usuario = new Usuario();
        usuario.setNome(name);
        usuario.setEmail(email);
        usuario.setSenha(passwordHash);
        usuario.setCodigoVerificacao(codigoGerado);
        usuario.setEmailVerificado(false);

        // Salva o usuário no banco de dados (schema app)
        Usuario usuarioSalvo = repository.save(usuario);

        // Tenta enviar o e-mail de verificação
        try {
            emailService.enviarCodigoVerificacao(usuarioSalvo.getEmail(), codigoGerado);
        } catch (Exception e) {
            System.err.println("Erro ao enviar e-mail de verificação: " + e.getMessage());
            // Opcional: pode lançar uma exceção ou apenas registrar o log
        }

        return usuarioSalvo;
    }

    public boolean autenticar(String email, String rawPassword) {
        Optional<Usuario> opt = repository.findByEmail(email);
        if (opt.isEmpty()) {
            return false;
        }

        Usuario usuario = opt.get();
        return passwordEncoder.matches(rawPassword, usuario.getSenha());
    }
}