package com.qms.service;

import org.springframework.stereotype.Service;

@Service
public class AlertService {
  public void sendWebhook(String url, String payload) {
    try {
      java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
      java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
          .uri(java.net.URI.create(url))
          .header("Content-Type", "application/json")
          .POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload == null ? "{}" : payload))
          .build();
      client.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
    } catch (Exception ignored) {}
  }
}

