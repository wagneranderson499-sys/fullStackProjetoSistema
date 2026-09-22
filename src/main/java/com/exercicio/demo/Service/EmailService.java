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

    private static final String REMETENTE = "wagneranderson499@gmail.com";
    private static final String IP_LOCAL = "192.168.18.19";
    private static final String PORTA_FRONT = "5500";

    public void enviarCodigoVerificacao(String destinatario, String codigo) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(REMETENTE); // 👈 ADICIONADO AQUI
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

    public void enviarLinkRedefinicaoSenha(String destinatario) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(REMETENTE); // 👈 ADICIONADO AQUI
            helper.setTo(destinatario);
            helper.setSubject("Redefinição de Senha");

            String linkRedefinicao = "http://" + IP_LOCAL + ":" + PORTA_FRONT + "/redefinir-senha.html?email=" + destinatario;

            String conteudoHtml = "<div style='font-family: Arial, sans-serif; padding: 20px; text-align: center;'>"
                    + "<h2>Redefinição de Senha</h2>"
                    + "<p>Você solicitou a redefinição de senha. Clique no botão abaixo para criar uma nova senha:</p>"
                    + "<a href='" + linkRedefinicao + "' style='display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px;'>Redefinir Senha</a>"
                    + "<p style='margin-top: 20px; font-size: 12px; color: #777;'>Se você não solicitou isso, ignore este e-mail.</p>"
                    + "</div>";

            helper.setText(conteudoHtml, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Erro ao enviar o e-mail de redefinição de senha.", e);
        }
    }
}