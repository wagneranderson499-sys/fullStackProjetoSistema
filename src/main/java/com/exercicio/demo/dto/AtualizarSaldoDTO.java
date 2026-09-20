package com.exercicio.demo.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AtualizarSaldoDTO(
    @NotNull(message = "O saldo inicial é obrigatório.")
    @Min(value = 0, message = "O saldo inicial não pode ser negativo.")
    Double saldoInicial
) {}