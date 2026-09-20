package com.exercicio.demo.Controller;

import com.exercicio.demo.Model.Usuario;
import com.exercicio.demo.Repository.UsuarioRepository;
import com.exercicio.demo.Service.UsuarioService;
import org.springframework.http.ResponseEntity;
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

    public UsuarioController(UsuarioService usuarioService, UsuarioRepository usuarioRepository) {
        this.usuarioService = usuarioService;
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registrar(@RequestBody Usuario usuario) {
        try {
            // Check de e-mail duplicado
            if (usuarioRepository.existsByEmail(usuario.getEmail())) {
                return ResponseEntity.badRequest().body(Map.of("message", "E-mail já cadastrado no sistema!"));
            }

            // Executa a criação através da service
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

            // Validação da senha
            boolean senhaValida = usuarioService.autenticar(email, senha);

            if (senhaValida) {
                // Caso queira reativar a obrigatoriedade de e-mail, basta descomentar abaixo:
                /*
                if (Boolean.FALSE.equals(usuario.isEmailVerificado())) {
                    Map<String, String> erroEmail = new HashMap<>();
                    erroEmail.put("message", "Por favor, verifique seu e-mail antes de fazer login.");
                    return ResponseEntity.badRequest().body(erroEmail);
                }
                */

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
}