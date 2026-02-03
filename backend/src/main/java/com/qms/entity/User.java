package com.qms.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("users")
public class User {
  @TableId
  private Long id;
  private String username;
  private String name;
  private String password;
  private String email;
  private Integer status;
  private java.time.LocalDateTime createdAt;
  private Integer deleted;
}

