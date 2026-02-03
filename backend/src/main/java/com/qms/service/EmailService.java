package com.qms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
  @Autowired(required = false)
  private JavaMailSender sender;

  public void send(String to, String subject, String text, String from) {
    if (sender == null) return;
    SimpleMailMessage msg = new SimpleMailMessage();
    msg.setTo(to);
    msg.setSubject(subject);
    msg.setText(text);
    if (from != null && !from.isEmpty()) msg.setFrom(from);
    sender.send(msg);
  }
}

