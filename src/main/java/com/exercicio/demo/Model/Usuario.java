package com.exercicio.demo.Model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "usuarios", schema = "app")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    // Impede que a senha seja retornada no JSON para o frontend por segurança
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;

    private String codigoVerificacao;

    private Boolean emailVerificado = false;

    // Guarda o saldo do usuário com valor padrão 0.00
    @Column(precision = 10, scale = 2)
    private BigDecimal saldo = BigDecimal.ZERO;

    // Construtor Padrão (Obrigatório para o JPA)
    public Usuario() {
    }

    // Construtor para novos cadastros no Controller/Service
    public Usuario(String nome, String email, String senha) {
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.emailVerificado = false;
        this.saldo = BigDecimal.ZERO;
    }

    // Construtor completo
    public Usuario(Long id, String nome, String email, String senha, String codigoVerificacao, Boolean emailVerificado, BigDecimal saldo) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.codigoVerificacao = codigoVerificacao;
        this.emailVerificado = (emailVerificado != null) ? emailVerificado : false;
        this.saldo = (saldo != null) ? saldo : BigDecimal.ZERO;
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }

    // Métodos utilitários de compatibilidade para senha
    public String getPassword() { return senha; }
    public void setPassword(String password) { this.senha = password; }

    public String getCodigoVerificacao() { return codigoVerificacao; }
    public void setCodigoVerificacao(String codigoVerificacao) { this.codigoVerificacao = codigoVerificacao; }

    public Boolean isEmailVerificado() { return emailVerificado; }
    public void setEmailVerificado(Boolean emailVerificado) { this.emailVerificado = emailVerificado; }

    public BigDecimal getSaldo() { return saldo; }
    public void setSaldo(BigDecimal saldo) { this.saldo = saldo; }
}