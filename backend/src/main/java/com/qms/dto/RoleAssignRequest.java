package com.qms.dto;

import java.util.List;

public class RoleAssignRequest {
  private List<Long> roleIds;

  public List<Long> getRoleIds() {
    return roleIds;
  }

  public void setRoleIds(List<Long> roleIds) {
    this.roleIds = roleIds;
  }
}

