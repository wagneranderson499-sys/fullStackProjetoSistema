package com.exercicio.demo.Repository;

import org.hibernate.boot.archive.scan.spi.ClassDescriptor.Categorization;
import org.springframework.data.jpa.repository.JpaRepository;
import com.exercicio.demo.Model.Categoria; // <-- Garanta que importou a SUA entidade Categoria

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    Categorization save(Categorization categoria);
}