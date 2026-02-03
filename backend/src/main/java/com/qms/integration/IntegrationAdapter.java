package com.qms.integration;

import com.qms.entity.IntegrationConfig;
import com.qms.entity.IntegrationMapping;

public interface IntegrationAdapter {
  IntegrationResult execute(IntegrationConfig cfg, IntegrationMapping mapping) throws Exception;
}

