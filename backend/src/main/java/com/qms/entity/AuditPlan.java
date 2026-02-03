package com.qms.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("audit_plans")
public class AuditPlan {
  @TableId
  private Long id;
  private String title;
  private LocalDate auditDate;
  private String status;
  private String approver;
  
  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;
  
  @TableField(fill = FieldFill.INSERT_UPDATE)
  private LocalDateTime updatedAt;
  
  private Integer deleted;
}
