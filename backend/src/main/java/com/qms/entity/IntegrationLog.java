package com.qms.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("integration_logs")
public class IntegrationLog {
  @TableId
  private Long id;
  private Long configId;
  private String direction;
  private String operation;
  private String entityType;
  private Long entityId;
  private String requestData;
  private String responseData;
  private String status;
  private String errorMessage;
  private Integer executionTime;
  
  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;
}

