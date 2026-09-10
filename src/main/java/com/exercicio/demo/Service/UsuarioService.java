package com.exercicio.demo.Service;

import com.exercicio.demo.Model.Usuario;
import com.exercicio.demo.Repository.UsuarioRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UsuarioService {

    private final UsuarioRepository repository;
    private final BCryptPasswordEncoder passwordEncoder;

    // Injeção via Construtor (o Spring SecurityConfig irá fornecer o BCryptPasswordEncoder)
    public UsuarioService(UsuarioRepository repository, BCryptPasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public Usuario cadastrar(String name, String email, String rawPassword, String codigo) {
        String passwordHash = passwordEncoder.encode(rawPassword);
        
        Usuario usuario = new Usuario();
        usuario.setName(name);
        usuario.setEmail(email);
        usuario.setPassword(passwordHash);
        usuario.setCodigoVerificacao(codigo);
        usuario.setEmailVerificado(false);

        return repository.save(usuario);
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