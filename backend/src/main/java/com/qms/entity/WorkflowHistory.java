package com.qms.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("workflow_history")
public class WorkflowHistory {
  @TableId
  private Long id;
  private Long instanceId;
  private String fromNode;
  private String toNode;
  private String action;
  private String comment;
  private Long operatorId;
  private LocalDateTime createdAt;
}

