package com.qms.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("permissions")
public class Permission {
  @TableId
  private Long id;
  private String name;
  private String code;
  private Integer deleted;
}

