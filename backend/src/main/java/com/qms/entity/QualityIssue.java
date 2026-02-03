package com.qms.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("quality_issues")
public class QualityIssue {
  @TableId
  private Long id;
  private String title;
  private String description;
  private String severity;
  private String category;
  private String module;
  private String department;
  private String status;
  private Long reporterId;
  
  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;
  
  @TableField(fill = FieldFill.INSERT_UPDATE)
  private LocalDateTime updatedAt;
  
  private Integer deleted;
}
