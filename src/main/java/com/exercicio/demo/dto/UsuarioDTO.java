package com.exercicio.demo.dto;

public record UsuarioDTO(
    Long id,
    String nome,
    String email,
    Double saldoInicial
) {}