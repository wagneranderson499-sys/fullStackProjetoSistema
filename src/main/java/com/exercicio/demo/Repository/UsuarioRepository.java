package com.exercicio.demo.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.exercicio.demo.Model.Usuario;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
}