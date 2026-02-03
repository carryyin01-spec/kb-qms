package com.qms.scheduler;

import com.qms.entity.IntegrationConfig;
import com.qms.entity.IntegrationLog;
import com.qms.entity.IntegrationMapping;
import com.qms.mapper.IntegrationConfigMapper;
import com.qms.mapper.IntegrationLogMapper;
import com.qms.mapper.IntegrationMappingMapper;
import com.qms.service.IntegrationService;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class IntegrationScheduler {
  private final ThreadPoolTaskScheduler scheduler;
  private final IntegrationMappingMapper mappingMapper;
  private final IntegrationConfigMapper configMapper;
  private final IntegrationLogMapper logMapper;
  private final IntegrationService integrationService;

  public IntegrationScheduler(ThreadPoolTaskScheduler scheduler, IntegrationMappingMapper mappingMapper, IntegrationConfigMapper configMapper, IntegrationLogMapper logMapper, IntegrationService integrationService) {
    this.scheduler = scheduler;
    this.mappingMapper = mappingMapper;
    this.configMapper = configMapper;
    this.logMapper = logMapper;
    this.integrationService = integrationService;
  }

  @PostConstruct
  public void init() {
    List<IntegrationMapping> mappings = mappingMapper.selectList(null);
    for (IntegrationMapping m : mappings) {
      if (m.getAutoSync() != null && m.getAutoSync() == 1 && m.getSyncSchedule() != null && !m.getSyncSchedule().isEmpty()) {
        scheduler.schedule(() -> executeMapping(m.getId()), new CronTrigger(m.getSyncSchedule()));
      }
    }
  }

  private void executeMapping(Long mappingId) {
    IntegrationMapping m = mappingMapper.selectById(mappingId);
    if (m == null || m.getAutoSync() == null || m.getAutoSync() != 1) return;
    // 委托到服务执行带重试与告警
    integrationService.executeWithRetry(mappingId);
  }
}
