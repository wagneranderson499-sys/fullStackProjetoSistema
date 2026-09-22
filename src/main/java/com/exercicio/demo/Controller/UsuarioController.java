package com.exercicio.demo.Controller;

import com.exercicio.demo.Model.Usuario;
import com.exercicio.demo.Repository.UsuarioRepository;
import com.exercicio.demo.Service.UsuarioService;
import com.exercicio.demo.Service.EmailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*") 
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final JavaMailSender mailSender;

    @Autowired
    private EmailService emailService;

    // Injeção via Construtor das dependências
    public UsuarioController(UsuarioService usuarioService, UsuarioRepository usuarioRepository, JavaMailSender mailSender) {
        this.usuarioService = usuarioService;
        this.usuarioRepository = usuarioRepository;
        this.mailSender = mailSender;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registrar(@RequestBody Usuario usuario) {
        try {
            if (usuarioRepository.existsByEmail(usuario.getEmail())) {
                return ResponseEntity.badRequest().body(Map.of("message", "E-mail já cadastrado no sistema!"));
            }

            usuarioService.cadastrar(
                usuario.getNome(), 
                usuario.getEmail(), 
                usuario.getSenha()
            );

            return ResponseEntity.ok(Map.of(
                "message", "Usuário cadastrado com sucesso!"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Erro ao realizar cadastro: " + e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verificarCodigo(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String codigo = request.get("codigo");

        if (email == null || codigo == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "E-mail e código são obrigatórios!"));
        }

        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Usuário não encontrado!"));
        }

        Usuario usuario = usuarioOpt.get();

        if (codigo.equals(usuario.getCodigoVerificacao())) {
            usuario.setEmailVerificado(true);
            usuario.setCodigoVerificacao(null); 
            usuarioRepository.save(usuario);

            return ResponseEntity.ok(Map.of("message", "E-mail verificado com sucesso!"));
        }

        return ResponseEntity.badRequest().body(Map.of("message", "Código de verificação inválido!"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String senha = request.get("senha");

        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();

            boolean senhaValida = usuarioService.autenticar(email, senha);

            if (senhaValida) {
                Map<String, Object> response = new HashMap<>();
                response.put("id", usuario.getId());
                response.put("email", usuario.getEmail() != null ? usuario.getEmail() : "");
                response.put("nome", usuario.getNome() != null ? usuario.getNome() : "");
                response.put("saldo", usuario.getSaldo() != null ? usuario.getSaldo() : BigDecimal.ZERO);
                response.put("message", "Login realizado com sucesso!");

                return ResponseEntity.ok(response);
            }
        }

        Map<String, String> erroResponse = new HashMap<>();
        erroResponse.put("message", "E-mail ou senha incorretos.");
        return ResponseEntity.badRequest().body(erroResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarUsuarioPorId(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .map(usuario -> ResponseEntity.ok(Map.of(
                    "id", usuario.getId(),
                    "nome", usuario.getNome() != null ? usuario.getNome() : "",
                    "email", usuario.getEmail(),
                    "saldo", usuario.getSaldo() != null ? usuario.getSaldo() : BigDecimal.ZERO
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/saldo")
    public ResponseEntity<?> atualizarSaldo(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            if (!payload.containsKey("saldo") || payload.get("saldo") == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "O campo 'saldo' é obrigatório."));
            }

            BigDecimal novoSaldo = new BigDecimal(payload.get("saldo").toString());

            Optional<Usuario> usuarioOpt = usuarioRepository.findById(id);
            if (usuarioOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Usuário não encontrado!"));
            }

            Usuario usuario = usuarioOpt.get();
            usuario.setSaldo(novoSaldo);
            usuarioRepository.save(usuario);

            return ResponseEntity.ok(Map.of(
                "message", "Saldo atualizado com sucesso!",
                "saldo", usuario.getSaldo()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao atualizar saldo: " + e.getMessage()));
        }
    }

    // Endpoint de solicitação por E-mail (Tela de Esqueci Senha / Configurações)
    @PostMapping("/esqueci-senha")
    public ResponseEntity<?> solicitarRedefinicaoSenha(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "O e-mail é obrigatório."));
        }

        String emailLimpo = email.trim().toLowerCase();
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(emailLimpo);

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "E-mail não encontrado no sistema."));
        }

        return enviarEmailRedefinicao(usuarioOpt.get().getEmail());
    }

    // Endpoint de solicitação por ID (Usado caso já tenha o ID na sessão)
    @PostMapping("/{id}/solicitar-redefinicao")
    public ResponseEntity<?> solicitarRedefinicaoPorId(@PathVariable Long id) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(id);

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Usuário não encontrado no sistema."));
        }

        return enviarEmailRedefinicao(usuarioOpt.get().getEmail());
    }

    // Método auxiliar reutilizável para o envio da mensagem
    private ResponseEntity<?> enviarEmailRedefinicao(String email) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("wagneranderson499@gmail.com");
            message.setTo(email.trim().toLowerCase());
            message.setSubject("Redefinição de Senha - FinanceControl");
            message.setText("Olá!\n\nVocê solicitou a redefinição de senha da sua conta no FinanceControl.\n\n" +
                           "Para redefinir sua senha, acesse o link abaixo:\n" +
                           "http://localhost:5500/redefinir-senha.html?email=" + email.trim().toLowerCase() + "\n\n" +
                           "Se você não fez esta solicitação, desconsidere este e-mail.");

            mailSender.send(message);

            return ResponseEntity.ok(Map.of("message", "Instruções enviadas para o seu e-mail com sucesso!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", "Erro ao enviar e-mail: " + e.getMessage()));
        }
    }

    // Endpoint para efetivar a redefinição da senha
    @PostMapping("/redefinir-senha")
    public ResponseEntity<?> redefinirSenha(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String novaSenha = payload.get("novaSenha");

        if (email == null || novaSenha == null || email.isBlank() || novaSenha.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "E-mail e nova senha são obrigatórios."));
        }

        boolean atualizado = usuarioService.atualizarSenha(email.trim().toLowerCase(), novaSenha);
        if (atualizado) {
            return ResponseEntity.ok(Map.of("message", "Senha redefinida com sucesso!"));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Usuário não encontrado."));
        }
    }
}