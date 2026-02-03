package com.qms.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("workflow_instances")
public class WorkflowInstance {
  @TableId
  private Long id;
  private Long templateId;
  private Long entityId;
  private String entityType;
  private String currentNode;
  private String status;
  private String variables;
  private Long starterId;
  private LocalDateTime startedAt;
  private LocalDateTime completedAt;
}

