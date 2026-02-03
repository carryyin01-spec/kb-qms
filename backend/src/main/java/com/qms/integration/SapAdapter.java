package com.qms.integration;

import com.qms.entity.IntegrationConfig;
import com.qms.entity.IntegrationMapping;

public class SapAdapter implements IntegrationAdapter {
  @Override
  public IntegrationResult execute(IntegrationConfig cfg, IntegrationMapping mapping) throws Exception {
    long start = System.currentTimeMillis();
    IntegrationResult r = new IntegrationResult();
    String endpoint = (cfg.getBaseUrl() == null ? "" : cfg.getBaseUrl()) + "/sap/rfc/" + (mapping.getRemoteEntity() == null ? "" : mapping.getRemoteEntity());
    java.util.Map<String,Object> payloadObj = new java.util.HashMap<>();
    payloadObj.put("action", "rfc");
    payloadObj.put("entity", mapping.getLocalEntity());
    payloadObj.put("params", mapping.getFieldMapping());
    String payload = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payloadObj);
    java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
    java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
        .uri(java.net.URI.create(endpoint))
        .header("Content-Type", "application/json")
        .POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload))
        .build();
    java.net.http.HttpResponse<String> resp = client.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
    r.success = resp.statusCode() >= 200 && resp.statusCode() < 300;
    r.request = "POST " + endpoint + " " + payload;
    r.response = resp.body();
    r.error = r.success ? null : ("HTTP " + resp.statusCode());
    r.costMs = (int)(System.currentTimeMillis() - start);
    return r;
  }
}
