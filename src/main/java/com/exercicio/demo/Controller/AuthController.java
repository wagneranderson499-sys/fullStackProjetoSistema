package com.exercicio.demo.Controller;

import com.exercicio.demo.Model.Usuario;
import com.exercicio.demo.Repository.UsuarioRepository;
import com.exercicio.demo.Service.UsuarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") 
public class AuthController {

    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;

   
    public AuthController(UsuarioService usuarioService, UsuarioRepository usuarioRepository) {
        this.usuarioService = usuarioService;
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registrar(@RequestBody Usuario usuario) {
        try {
          usuarioService.cadastrar(
    usuario.getNome(), 
    usuario.getEmail(), 
    usuario.getSenha()
);

            return ResponseEntity.ok(Map.of(
                "message", "Usuário cadastrado com sucesso! Verifique seu e-mail para ativar a conta."
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

            
            if (Boolean.FALSE.equals(usuario.isEmailVerificado())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Por favor, verifique seu e-mail antes de fazer login."));
            }

           
            boolean senhaValida = usuarioService.autenticar(email, senha);

            if (senhaValida) {
                return ResponseEntity.ok(Map.of("message", "Login realizado com sucesso!"));
            }
        }

        return ResponseEntity.badRequest().body(Map.of("message", "E-mail ou senha incorretos."));
    }
}