package com.exercicio.demo.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    @Value("${RESEND_API_KEY}")
    private String resendApiKey;

    private static final String REMETENTE = "onboarding@resend.dev";

    public void enviarCodigoRedefinicaoSenha(
            String destinatario,
            String codigo
    ) {

        String conteudoHtml =
                "<div style='font-family: Arial, sans-serif; "
                + "padding: 20px; text-align: center;'>"
                + "<h2>Redefinição de Senha</h2>"
                + "<p>Você solicitou a redefinição da sua senha "
                + "no FinanceControl.</p>"
                + "<p>Seu código de recuperação é:</p>"
                + "<h1 style='color: #4CAF50; letter-spacing: 6px;'>"
                + codigo
                + "</h1>"
                + "<p>Esse código é válido por 10 minutos.</p>"
                + "<p style='margin-top: 20px; font-size: 12px; color: #777;'>"
                + "Se você não solicitou essa alteração, ignore este e-mail."
                + "</p>"
                + "</div>";

        String json = """
                {
                    "from": "%s",
                    "to": ["%s"],
                    "subject": "Código para redefinir sua senha",
                    "html": %s
                }
                """.formatted(
                        REMETENTE,
                        destinatario,
                        escapeJson(conteudoHtml)
                );

        try {

            HttpClient client = HttpClient.newHttpClient();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(
                            json,
                            StandardCharsets.UTF_8
                    ))
                    .build();

            HttpResponse<String> response =
                    client.send(
                            request,
                            HttpResponse.BodyHandlers.ofString()
                    );

            if (response.statusCode() < 200 ||
                    response.statusCode() >= 300) {

                throw new RuntimeException(
                        "Erro ao enviar e-mail pelo Resend: "
                        + response.body()
                );
            }

        } catch (Exception e) {

            throw new RuntimeException(
                    "Erro ao enviar o código de redefinição de senha.",
                    e
            );
        }
    }

    private String escapeJson(String texto) {

        return "\"" +
                texto
                        .replace("\\", "\\\\")
                        .replace("\"", "\\\"")
                        .replace("\n", "\\n")
                        .replace("\r", "\\r")
                + "\"";
    }
}