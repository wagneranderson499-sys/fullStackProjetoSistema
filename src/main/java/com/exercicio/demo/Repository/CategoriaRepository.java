package com.exercicio.demo.Repository;

import org.hibernate.boot.archive.scan.spi.ClassDescriptor.Categorization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoriaRepository extends JpaRepository <Categorization, Long> {
}