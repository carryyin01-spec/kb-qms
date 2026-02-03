package com.qms.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("document_versions")
public class DocumentVersion {
  @TableId
  private Long id;
  private Long documentId;
  private Integer versionNo;
  private String content;
  
  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;
  
  private Integer deleted;
}

