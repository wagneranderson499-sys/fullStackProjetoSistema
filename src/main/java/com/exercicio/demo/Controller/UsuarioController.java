package com.exercicio.demo.Controller;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.exercicio.demo.Model.Usuario;
import com.exercicio.demo.Repository.UsuarioRepository;
import com.exercicio.demo.Service.EmailService;
import com.exercicio.demo.Service.UsuarioService;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;

    // Injeção via Construtor das dependências
    public UsuarioController(
            UsuarioService usuarioService,
            UsuarioRepository usuarioRepository,
            EmailService emailService) {

        this.usuarioService = usuarioService;
        this.usuarioRepository = usuarioRepository;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registrar(@RequestBody Usuario usuario) {
        try {
            if (usuarioRepository.existsByEmail(usuario.getEmail())) {
                return ResponseEntity.badRequest().body(
                    Map.of("message", "E-mail já cadastrado no sistema!")
                );
            }

            usuarioService.cadastrar(
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getSenha()
            );

            return ResponseEntity.ok(
                Map.of("message", "Usuário cadastrado com sucesso!")
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                Map.of("message", e.getMessage())
            );

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                Map.of("message", "Erro ao realizar cadastro: " + e.getMessage())
            );
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verificarCodigo(
            @RequestBody Map<String, String> request) {

        String email = request.get("email");
        String codigo = request.get("codigo");

        if (email == null || codigo == null) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "E-mail e código são obrigatórios!")
            );
        }

        Optional<Usuario> usuarioOpt =
                usuarioRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "Usuário não encontrado!")
            );
        }

        Usuario usuario = usuarioOpt.get();

        if (codigo.equals(usuario.getCodigoVerificacao())) {
            usuario.setEmailVerificado(true);
            usuario.setCodigoVerificacao(null);
            usuarioRepository.save(usuario);

            return ResponseEntity.ok(
                Map.of("message", "E-mail verificado com sucesso!")
            );
        }

        return ResponseEntity.badRequest().body(
            Map.of("message", "Código de verificação inválido!")
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> request) {

        String email = request.get("email");
        String senha = request.get("senha");

        Optional<Usuario> usuarioOpt =
                usuarioRepository.findByEmail(email);

        if (usuarioOpt.isPresent()) {

            Usuario usuario = usuarioOpt.get();

            boolean senhaValida =
                    usuarioService.autenticar(email, senha);

            if (senhaValida) {

                Map<String, Object> response = new HashMap<>();

                response.put("id", usuario.getId());
                response.put(
                    "email",
                    usuario.getEmail() != null
                        ? usuario.getEmail()
                        : ""
                );
                response.put(
                    "nome",
                    usuario.getNome() != null
                        ? usuario.getNome()
                        : ""
                );
                response.put(
                    "saldo",
                    usuario.getSaldo() != null
                        ? usuario.getSaldo()
                        : BigDecimal.ZERO
                );
                response.put(
                    "message",
                    "Login realizado com sucesso!"
                );

                return ResponseEntity.ok(response);
            }
        }

        Map<String, String> erroResponse = new HashMap<>();
        erroResponse.put(
            "message",
            "E-mail ou senha incorretos."
        );

        return ResponseEntity.badRequest().body(erroResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarUsuarioPorId(
            @PathVariable Long id) {

        return usuarioRepository.findById(id)
            .map(usuario -> ResponseEntity.ok(
                Map.of(
                    "id", usuario.getId(),
                    "nome",
                    usuario.getNome() != null
                        ? usuario.getNome()
                        : "",
                    "email", usuario.getEmail(),
                    "saldo",
                    usuario.getSaldo() != null
                        ? usuario.getSaldo()
                        : BigDecimal.ZERO
                )
            ))
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/saldo")
    public ResponseEntity<?> atualizarSaldo(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        try {

            if (!payload.containsKey("saldo")
                    || payload.get("saldo") == null) {

                return ResponseEntity.badRequest().body(
                    Map.of(
                        "message",
                        "O campo 'saldo' é obrigatório."
                    )
                );
            }

            BigDecimal novoSaldo =
                    new BigDecimal(
                        payload.get("saldo").toString()
                    );

            Optional<Usuario> usuarioOpt =
                    usuarioRepository.findById(id);

            if (usuarioOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(
                    Map.of(
                        "message",
                        "Usuário não encontrado!"
                    )
                );
            }

            Usuario usuario = usuarioOpt.get();

            usuario.setSaldo(novoSaldo);

            usuarioRepository.save(usuario);

            return ResponseEntity.ok(
                Map.of(
                    "message",
                    "Saldo atualizado com sucesso!",
                    "saldo",
                    usuario.getSaldo()
                )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest().body(
                Map.of(
                    "message",
                    "Erro ao atualizar saldo: "
                    + e.getMessage()
                )
            );
        }
    }

    // Solicitação de recuperação de senha
    @PostMapping("/esqueci-senha")
    public ResponseEntity<?> solicitarRedefinicaoSenha(
            @RequestParam(required = false) String email,
            @RequestBody(required = false) Map<String, String> request) {

        String targetEmail = email;

        if ((targetEmail == null || targetEmail.isBlank())
                && request != null) {

            targetEmail = request.get("email");
        }

        if (targetEmail == null
                || targetEmail.trim().isEmpty()) {

            return ResponseEntity.badRequest().body(
                Map.of(
                    "message",
                    "O e-mail é obrigatório."
                )
            );
        }

        String emailLimpo =
                targetEmail.trim().toLowerCase();

        Optional<Usuario> usuarioOpt =
                usuarioRepository.findByEmail(emailLimpo);

        if (usuarioOpt.isEmpty()) {

            return ResponseEntity.badRequest().body(
                Map.of(
                    "message",
                    "E-mail não encontrado no sistema."
                )
            );
        }

        // Gera o código de recuperação
        boolean codigoGerado =
                usuarioService.gerarCodigoRedefinicaoSenha(
                    emailLimpo
                );

        if (!codigoGerado) {

            return ResponseEntity.internalServerError().body(
                Map.of(
                    "message",
                    "Não foi possível gerar o código de recuperação."
                )
            );
        }

        // Busca novamente o usuário para pegar o código gerado
        Usuario usuario = usuarioOpt.get();

        String codigo =
                usuario.getCodigoRedefinicaoSenha();

        try {

            emailService.enviarCodigoRedefinicaoSenha(
                emailLimpo,
                codigo
            );

            return ResponseEntity.ok(
                Map.of(
                    "message",
                    "Código de recuperação enviado para o seu e-mail!"
                )
            );

        } catch (Exception e) {

            return ResponseEntity.internalServerError().body(
                Map.of(
                    "message",
                    "Erro ao enviar o código por e-mail: "
                    + e.getMessage()
                )
            );
        }
    }

    @PostMapping("/validar-codigo-redefinicao")
public ResponseEntity<?> validarCodigoRedefinicao(
        @RequestBody Map<String, String> request) {

    String email = request.get("email");
    String codigo = request.get("codigo");

    if (email == null || codigo == null
            || email.isBlank() || codigo.isBlank()) {

        return ResponseEntity.badRequest().body(
            Map.of(
                "message",
                "E-mail e código são obrigatórios."
            )
        );
    }

    boolean codigoValido =
            usuarioService.validarCodigoRedefinicaoSenha(
                email.trim().toLowerCase(),
                codigo.trim()
            );

    if (!codigoValido) {

        return ResponseEntity.badRequest().body(
            Map.of(
                "message",
                "Código inválido ou expirado."
            )
        );
    }

    return ResponseEntity.ok(
        Map.of(
            "message",
            "Código validado com sucesso!"
        )
    );
}

    @PostMapping("/{id}/solicitar-redefinicao")
    public ResponseEntity<?> solicitarRedefinicaoPorId(
            @PathVariable Long id) {

        Optional<Usuario> usuarioOpt =
                usuarioRepository.findById(id);

        if (usuarioOpt.isEmpty()) {

            return ResponseEntity.badRequest().body(
                Map.of(
                    "message",
                    "Usuário não encontrado no sistema."
                )
            );
        }

        Usuario usuario = usuarioOpt.get();

        String email =
                usuario.getEmail();

        boolean codigoGerado =
                usuarioService.gerarCodigoRedefinicaoSenha(
                    email
                );

        if (!codigoGerado) {

            return ResponseEntity.internalServerError().body(
                Map.of(
                    "message",
                    "Não foi possível gerar o código de recuperação."
                )
            );
        }

        try {

            emailService.enviarCodigoRedefinicaoSenha(
                email,
                usuario.getCodigoRedefinicaoSenha()
            );

            return ResponseEntity.ok(
                Map.of(
                    "message",
                    "Código de recuperação enviado para o e-mail!"
                )
            );

        } catch (Exception e) {

            return ResponseEntity.internalServerError().body(
                Map.of(
                    "message",
                    "Erro ao enviar o código: "
                    + e.getMessage()
                )
            );
        }
    }
@PostMapping("/redefinir-senha")
public ResponseEntity<?> redefinirSenha(
        @RequestBody Map<String, String> payload) {

    String email = payload.get("email");
    String codigo = payload.get("codigo");
    String novaSenha = payload.get("novaSenha");

    if (email == null
            || codigo == null
            || novaSenha == null
            || email.isBlank()
            || codigo.isBlank()
            || novaSenha.isBlank()) {

        return ResponseEntity.badRequest().body(
            Map.of(
                "message",
                "E-mail, código e nova senha são obrigatórios."
            )
        );
    }

    String emailLimpo = email.trim().toLowerCase();
    String codigoLimpo = codigo.trim();

    Optional<Usuario> usuarioOpt =
            usuarioRepository.findByEmail(emailLimpo);

    if (usuarioOpt.isEmpty()) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            Map.of(
                "message",
                "Usuário não encontrado."
            )
        );
    }

    Usuario usuario = usuarioOpt.get();

    // Verifica se existe um código de recuperação
    if (usuario.getCodigoRedefinicaoSenha() == null) {
        return ResponseEntity.badRequest().body(
            Map.of(
                "message",
                "Código de recuperação inválido ou expirado."
            )
        );
    }

    // Verifica se o código informado é o correto
    if (!usuario.getCodigoRedefinicaoSenha().equals(codigoLimpo)) {
        return ResponseEntity.badRequest().body(
            Map.of(
                "message",
                "Código de recuperação inválido."
            )
        );
    }

    // Verifica se o código ainda está dentro do prazo
    if (usuario.getExpiracaoCodigoRedefinicao() == null
            || java.time.LocalDateTime.now()
                .isAfter(usuario.getExpiracaoCodigoRedefinicao())) {

        return ResponseEntity.badRequest().body(
            Map.of(
                "message",
                "O código de recuperação expirou."
            )
        );
    }

    // Atualiza a senha usando o método que já utiliza BCrypt
    boolean atualizado =
            usuarioService.atualizarSenha(
                emailLimpo,
                novaSenha
            );

    if (!atualizado) {
        return ResponseEntity.internalServerError().body(
            Map.of(
                "message",
                "Não foi possível atualizar a senha."
            )
        );
    }

    // Invalida o código depois de usar
    usuario.setCodigoRedefinicaoSenha(null);
    usuario.setExpiracaoCodigoRedefinicao(null);
    usuarioRepository.save(usuario);

    return ResponseEntity.ok(
        Map.of(
            "message",
            "Senha redefinida com sucesso!"
        )
    );
}
    // Endpoint de alteração de senha logado
    // (valida senha antiga)
    @PutMapping("/alterar-senha")
    public ResponseEntity<?> alterarSenha(
            @RequestBody Map<String, String> payload) {

        String email = payload.get("email");
        String senhaAtual = payload.get("senhaAtual");
        String novaSenha = payload.get("novaSenha");

        if (email == null
                || senhaAtual == null
                || novaSenha == null) {

            return ResponseEntity.badRequest().body(
                Map.of(
                    "message",
                    "Todos os campos são obrigatórios."
                )
            );
        }

        Optional<Usuario> usuarioOpt =
                usuarioRepository.findByEmail(
                    email.trim().toLowerCase()
                );

        if (usuarioOpt.isEmpty()) {

            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(
                    Map.of(
                        "message",
                        "Usuário não encontrado."
                    )
                );
        }

        boolean autenticado =
                usuarioService.autenticar(
                    email.trim().toLowerCase(),
                    senhaAtual
                );

        if (!autenticado) {

            return ResponseEntity.badRequest().body(
                Map.of(
                    "message",
                    "Senha atual incorreta."
                )
            );
        }

        boolean atualizado =
                usuarioService.atualizarSenha(
                    email.trim().toLowerCase(),
                    novaSenha
                );

        if (atualizado) {

            return ResponseEntity.ok(
                Map.of(
                    "message",
                    "Senha alterada com sucesso!"
                )
            );
        }

        return ResponseEntity.internalServerError().body(
            Map.of(
                "message",
                "Erro ao atualizar a senha."
            )
        );
    }
}