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

        @Value("${resend.api.key}")
private String resendApiKey;

        @Value("${emailjs.public.key:}")
        private String emailjsPublicKey;

        @Value("${emailjs.private.key:}")
        private String emailjsPrivateKey;

        @Value("${emailjs.service.id:service_2paew2v}")
        private String emailjsServiceId;

        @Value("${emailjs.template.id:template_p7r9zfa}")
        private String emailjsTemplateId;

        private static final String REMETENTE = "onboarding@resend.dev";

    public void enviarCodigoRedefinicaoSenha(
            String destinatario,
            String codigo
    ) {

        if (emailjsPublicKey != null && !emailjsPublicKey.isBlank()) {
            enviarPeloEmailJs(destinatario, codigo);
            return;
        }

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

    private void enviarPeloEmailJs(String destinatario, String codigo) {
        String json = """
                {
                    "service_id": %s,
                    "template_id": %s,
                    "user_id": %s,
                    "template_params": {
                        "email": %s,
                        "passcode": %s
                    }%s
                }
                """.formatted(
                escapeJson(emailjsServiceId),
                escapeJson(emailjsTemplateId),
                escapeJson(emailjsPublicKey),
                escapeJson(destinatario),
                escapeJson(codigo),
                emailjsPrivateKey == null || emailjsPrivateKey.isBlank()
                        ? ""
                        : ", \"accessToken\": " + escapeJson(emailjsPrivateKey)
        );

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.emailjs.com/api/v1.0/email/send"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException(
                        "EmailJS recusou o envio (HTTP " + response.statusCode() + "): "
                        + response.body()
                );
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Envio do e-mail interrompido.", e);
        } catch (Exception e) {
            throw new IllegalStateException("Não foi possível enviar o código pelo EmailJS.", e);
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