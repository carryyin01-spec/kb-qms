package com.qms.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("integration_mappings")
public class IntegrationMapping {
  @TableId
  private Long id;
  private Long configId;
  private String localEntity;
  private String remoteEntity;
  private String direction;
  private String fieldMapping;
  private String transformRules;
  private Integer autoSync;
  private String syncSchedule;
}

