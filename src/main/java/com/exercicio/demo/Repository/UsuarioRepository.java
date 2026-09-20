package com.exercicio.demo.Repository;

import com.exercicio.demo.Model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    
    // Busca um usuário pelo e-mail (usado no Login)
    Optional<Usuario> findByEmail(String email);

    // Verifica se já existe um cadastro com o e-mail (usado no Cadastro)
    boolean existsByEmail(String email);
}