package com.qms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qms.entity.IntegrationConfig;
import com.qms.entity.IntegrationLog;
import com.qms.entity.IntegrationMapping;
import com.qms.mapper.IntegrationConfigMapper;
import com.qms.mapper.IntegrationLogMapper;
import com.qms.mapper.IntegrationMappingMapper;
import org.springframework.stereotype.Service;
import com.qms.integration.AdapterFactory;
import com.qms.integration.IntegrationAdapter;
import com.qms.integration.IntegrationResult;
import com.qms.entity.Notification;
import com.qms.service.NotificationService;

@Service
public class IntegrationService {
  private final IntegrationConfigMapper configMapper;
  private final IntegrationMappingMapper mappingMapper;
  private final IntegrationLogMapper logMapper;
  private final NotificationService notificationService;
  private final AlertService alertService;

  public IntegrationService(IntegrationConfigMapper configMapper, IntegrationMappingMapper mappingMapper, IntegrationLogMapper logMapper, NotificationService notificationService, AlertService alertService) {
    this.configMapper = configMapper;
    this.mappingMapper = mappingMapper;
    this.logMapper = logMapper;
    this.notificationService = notificationService;
    this.alertService = alertService;
  }

  public void createConfig(IntegrationConfig c) { configMapper.insert(c); }
  public void createMapping(IntegrationMapping m) { mappingMapper.insert(m); }
  public void log(IntegrationLog l) { logMapper.insert(l); }
  public IntegrationConfig getByCode(String code) { return configMapper.selectOne(new LambdaQueryWrapper<IntegrationConfig>().eq(IntegrationConfig::getSystemCode, code)); }

  public void executeWithRetry(Long mappingId) {
    IntegrationMapping m = mappingMapper.selectById(mappingId);
    if (m == null) return;
    IntegrationConfig cfg = configMapper.selectById(m.getConfigId());
    if (cfg == null || cfg.getIsActive() != null && cfg.getIsActive() == 0) return;
    int retries = cfg.getRetryTimes() == null ? 0 : cfg.getRetryTimes();
    int attempt = 0;
    boolean success = false;
    String error = null;
    IntegrationResult result = null;
    while (attempt <= retries && !success) {
      attempt++;
      try {
        IntegrationAdapter adapter = AdapterFactory.get(cfg);
        result = adapter.execute(cfg, m);
        success = result.success;
      } catch (Exception e) {
        error = e.getMessage();
        success = false;
      }
      if (!success) {
        try { Thread.sleep(200L * attempt); } catch (InterruptedException ignored) {}
      }
    }
    IntegrationLog log = new IntegrationLog();
    log.setConfigId(m.getConfigId());
    log.setDirection("outbound".equalsIgnoreCase(m.getDirection()) ? "outbound" : "outbound");
    log.setOperation(success ? "auto_sync" : "auto_sync_fail");
    log.setEntityType(m.getLocalEntity());
    log.setEntityId(null);
    log.setRequestData(result != null ? result.request : null);
    log.setResponseData(result != null ? result.response : null);
    log.setStatus(success ? "success" : "failed");
    log.setErrorMessage(success ? null : (result != null ? result.error : error));
    log.setExecutionTime(result != null ? result.costMs : null);
    log.setCreatedAt(java.time.LocalDateTime.now());
    logMapper.insert(log);
    if (!success) {
      Notification n = new Notification();
      n.setTitle("集成失败：" + cfg.getSystemName());
      n.setContent("映射ID " + mappingId + " 同步失败，错误：" + (result != null ? result.error : error));
      n.setRecipient("admin");
      n.setStatus("open");
      notificationService.create(n);
      String webhook = null;
      try {
        java.util.Map<?,?> cfgJson = cfg.getAuthConfig() == null ? null : new com.fasterxml.jackson.databind.ObjectMapper().readValue(cfg.getAuthConfig(), java.util.Map.class);
        if (cfgJson != null && cfgJson.get("webhookUrl") != null) webhook = String.valueOf(cfgJson.get("webhookUrl"));
      } catch (Exception ignored) {}
      if (webhook != null && !webhook.isEmpty()) {
        String payload = "{\"system\":\"" + cfg.getSystemName() + "\",\"mappingId\":" + mappingId + ",\"error\":\"" + (result != null ? result.error : error) + "\"}";
        alertService.sendWebhook(webhook, payload);
      }
    }
  }
}
