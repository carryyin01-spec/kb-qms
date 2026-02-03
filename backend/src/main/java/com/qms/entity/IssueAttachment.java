package com.qms.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("issue_attachments")
public class IssueAttachment {
  @TableId
  private Long id;
  private Long issueId;
  private String filename;
  private String url;
  private LocalDateTime createdAt;
  private Integer deleted;
}

