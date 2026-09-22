package com.exercicio.demo.dto;

import jakarta.validation.constraints.NotBlank;

public record RedefinirSenhaDTO(
    @NotBlank String email,
    @NotBlank String novaSenha
) {}