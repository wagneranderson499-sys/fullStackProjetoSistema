package com.exercicio.demo.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void enviarCodigoVerificacao(String destinatario, String codigo) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(destinatario);
            helper.setSubject("Seu código de verificação");
            
            String conteudoHtml = "<div style='font-family: Arial, sans-serif; padding: 20px; text-align: center;'>"
                    + "<h2>Confirmação de Cadastro</h2>"
                    + "<p>Seu código para ativar a conta é:</p>"
                    + "<h1 style='color: #4CAF50; letter-spacing: 4px;'>" + codigo + "</h1>"
                    + "</div>";

            helper.setText(conteudoHtml, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Erro ao enviar o e-mail de verificação.", e);
        }
    }
}