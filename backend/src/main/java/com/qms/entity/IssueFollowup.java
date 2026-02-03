package com.qms.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("issue_followups")
public class IssueFollowup {
  @TableId
  private Long id;
  private Long issueId;
  private String note;
  private String createdBy;
  private LocalDateTime createdAt;
  private Integer deleted;
}

