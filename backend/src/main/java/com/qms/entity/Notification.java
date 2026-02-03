package com.qms.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("notifications")
public class Notification {
  @TableId
  private Long id;
  private String title;
  private String content;
  private String recipient;
  private String status;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private Integer deleted;
}

