package com.exercicio.demo.Service;

import com.exercicio.demo.Model.Usuario;
import com.exercicio.demo.Repository.UsuarioRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Random;

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
        String passwordHash = passwordEncoder.encode(rawPassword);
        
       
        String codigoGerado = String.format("%06d", new Random().nextInt(999999));
        
        Usuario usuario = new Usuario();
        usuario.setNome(name);
        usuario.setEmail(email);
        usuario.setPassword(passwordHash);
        usuario.setCodigoVerificacao(codigoGerado);
        usuario.setEmailVerificado(false);

        
        Usuario usuarioSalvo = repository.save(usuario);

       
        emailService.enviarCodigoVerificacao(usuarioSalvo.getEmail(), codigoGerado);

        return usuarioSalvo;
    }

    public boolean autenticar(String email, String rawPassword) {
        Optional<Usuario> opt = repository.findByEmail(email);
        if (opt.isEmpty()) {
            return false;
        }

        Usuario usuario = opt.get();
        return passwordEncoder.matches(rawPassword, usuario.getPassword());
    }
}