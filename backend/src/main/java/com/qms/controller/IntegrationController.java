package com.qms.controller;

import com.qms.dto.ApiResponse;
import com.qms.entity.IntegrationConfig;
import com.qms.entity.IntegrationLog;
import com.qms.entity.IntegrationMapping;
import com.qms.service.IntegrationService;
import com.qms.mapper.IntegrationConfigMapper;
import com.qms.mapper.IntegrationMappingMapper;
import com.qms.mapper.IntegrationLogMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/integration")
public class IntegrationController {
  private final IntegrationService integrationService;
  private final IntegrationConfigMapper configMapper;
  private final IntegrationMappingMapper mappingMapper;
  private final IntegrationLogMapper logMapper;

  public IntegrationController(IntegrationService integrationService, IntegrationConfigMapper configMapper, IntegrationMappingMapper mappingMapper, IntegrationLogMapper logMapper) {
    this.integrationService = integrationService;
    this.configMapper = configMapper;
    this.mappingMapper = mappingMapper;
    this.logMapper = logMapper;
  }

  @PostMapping("/configs")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> createConfig(@RequestBody IntegrationConfig c) {
    integrationService.createConfig(c);
    return ApiResponse.ok(null);
  }
  
  @GetMapping("/configs")
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<java.util.List<IntegrationConfig>> listConfigs() {
    return ApiResponse.ok(configMapper.selectList(null));
  }

  @PostMapping("/mappings")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> createMapping(@RequestBody IntegrationMapping m) {
    integrationService.createMapping(m);
    return ApiResponse.ok(null);
  }
  
  @GetMapping("/mappings")
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<java.util.List<IntegrationMapping>> listMappings() {
    return ApiResponse.ok(mappingMapper.selectList(null));
  }

  @PostMapping("/logs")
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<Void> addLog(@RequestBody IntegrationLog l) {
    integrationService.log(l);
    return ApiResponse.ok(null);
  }
  
  @GetMapping("/logs")
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<java.util.List<IntegrationLog>> listLogs() {
    return ApiResponse.ok(logMapper.selectList(null));
  }
}
