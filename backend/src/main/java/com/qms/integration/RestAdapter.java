package com.qms.integration;

import com.qms.entity.IntegrationConfig;
import com.qms.entity.IntegrationMapping;

public class RestAdapter implements IntegrationAdapter {
  @Override
  public IntegrationResult execute(IntegrationConfig cfg, IntegrationMapping mapping) throws Exception {
    long start = System.currentTimeMillis();
    IntegrationResult r = new IntegrationResult();
    String endpoint = (cfg.getBaseUrl() == null ? "" : cfg.getBaseUrl()) + "/" + (mapping.getRemoteEntity() == null ? "" : mapping.getRemoteEntity());
    java.util.Map<String,Object> payloadObj = new java.util.HashMap<>();
    payloadObj.put("action", "sync");
    payloadObj.put("entity", mapping.getLocalEntity());
    payloadObj.put("direction", mapping.getDirection());
    payloadObj.put("fieldMapping", mapping.getFieldMapping());
    payloadObj.put("transformRules", mapping.getTransformRules());
    String payload = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payloadObj);
    java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
    java.net.http.HttpRequest.Builder builder = java.net.http.HttpRequest.newBuilder().uri(java.net.URI.create(endpoint)).header("Content-Type", "application/json");
    String authType = cfg.getAuthType() == null ? "" : cfg.getAuthType().toLowerCase();
    java.util.Map<String,Object> cfgJson = null;
    try { cfgJson = cfg.getAuthConfig() == null ? null : (java.util.Map<String,Object>) new com.fasterxml.jackson.databind.ObjectMapper().readValue(cfg.getAuthConfig(), java.util.Map.class); } catch (Exception ignored) {}
    if ("basic".equals(authType) && cfgJson != null) {
      String u = String.valueOf(cfgJson.getOrDefault("username",""));
      String p = String.valueOf(cfgJson.getOrDefault("password",""));
      String token = java.util.Base64.getEncoder().encodeToString((u + ":" + p).getBytes());
      builder.header("Authorization", "Basic " + token);
    } else if ("apikey".equals(authType) && cfgJson != null) {
      String header = String.valueOf(cfgJson.getOrDefault("header","X-API-Key"));
      String key = String.valueOf(cfgJson.getOrDefault("key",""));
      builder.header(header, key);
    } else if ("oauth2".equals(authType) && cfgJson != null) {
      try {
        String tokenUrl = String.valueOf(cfgJson.getOrDefault("token_url",""));
        String clientId = String.valueOf(cfgJson.getOrDefault("client_id",""));
        String clientSecret = String.valueOf(cfgJson.getOrDefault("client_secret",""));
        String scope = String.valueOf(cfgJson.getOrDefault("scope",""));
        String form = "grant_type=client_credentials&client_id="+clientId+"&client_secret="+clientSecret+"&scope="+scope;
        java.net.http.HttpRequest tokenReq = java.net.http.HttpRequest.newBuilder().uri(java.net.URI.create(tokenUrl))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .POST(java.net.http.HttpRequest.BodyPublishers.ofString(form)).build();
        java.net.http.HttpResponse<String> tokenResp = client.send(tokenReq, java.net.http.HttpResponse.BodyHandlers.ofString());
        java.util.Map<String,Object> tokenJson = (java.util.Map<String,Object>) new com.fasterxml.jackson.databind.ObjectMapper().readValue(tokenResp.body(), java.util.Map.class);
        String accessToken = String.valueOf(tokenJson.getOrDefault("access_token",""));
        if (!accessToken.isEmpty()) builder.header("Authorization", "Bearer " + accessToken);
      } catch (Exception ignored) {}
    }
    java.net.http.HttpRequest req = builder.POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload)).build();
    java.net.http.HttpResponse<String> resp = client.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
    r.success = resp.statusCode() >= 200 && resp.statusCode() < 300;
    r.request = "POST " + endpoint + " " + payload;
    r.response = resp.body();
    r.error = r.success ? null : ("HTTP " + resp.statusCode());
    r.costMs = (int)(System.currentTimeMillis() - start);
    return r;
  }
}
