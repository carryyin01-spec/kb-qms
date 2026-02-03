package com.qms.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("roles")
public class Role {
  @TableId
  private Long id;
  private String name;
  private String code;
  private Integer deleted;
}

