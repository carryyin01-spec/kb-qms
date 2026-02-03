package com.qms.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("workflow_templates")
public class WorkflowTemplate {
  @TableId
  private Long id;
  private String templateCode;
  private String templateName;
  private String entityType;
  private String description;
  private String config;
  private Integer isActive;
  private Long createdBy;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}

