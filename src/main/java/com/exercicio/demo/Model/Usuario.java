package com.exercicio.demo.Model;

import jakarta.persistence.*;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    private String senha;
    private String codigoVerificacao;

   
    private Boolean emailVerificado = false;

    public Usuario() {
    }

    public Usuario(Long id, String nome, String email, String senha, String codigoVerificacao, Boolean emailVerificado) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.codigoVerificacao = codigoVerificacao;
        this.emailVerificado = (emailVerificado != null) ? emailVerificado : false;
    }


    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }


    public String getPassword() { return senha; }
    public void setPassword(String password) { this.senha = password; }

    public String getCodigoVerificacao() { return codigoVerificacao; }
    public void setCodigoVerificacao(String codigoVerificacao) { this.codigoVerificacao = codigoVerificacao; }

    public Boolean isEmailVerificado() { return emailVerificado; }
    public void setEmailVerificado(Boolean emailVerificado) { this.emailVerificado = emailVerificado; }
}