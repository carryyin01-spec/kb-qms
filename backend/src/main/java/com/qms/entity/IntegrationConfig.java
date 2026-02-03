package com.qms.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("integration_configs")
public class IntegrationConfig {
  @TableId
  private Long id;
  private String systemCode;
  private String systemName;
  private String baseUrl;
  private String authType;
  private String authConfig;
  private String apiVersion;
  private Integer isActive;
  private Integer timeout;
  private Integer retryTimes;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}

