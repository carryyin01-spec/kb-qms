package com.qms.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("documents")
public class Document {
  @TableId
  private Long id;
  private String title;
  private String content;
  private String status;
  private Long ownerId;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private Integer deleted;
}

