package com.qms.integration;

import com.qms.entity.IntegrationConfig;

public class AdapterFactory {
  public static IntegrationAdapter get(IntegrationConfig cfg) {
    String code = cfg.getSystemCode() == null ? "" : cfg.getSystemCode().toUpperCase();
    if (code.contains("SAP")) return new SapAdapter();
    return new RestAdapter();
  }
}

