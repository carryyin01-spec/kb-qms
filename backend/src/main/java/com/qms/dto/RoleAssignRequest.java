package com.qms.dto;

import java.util.List;
import lombok.Data;

@Data
public class RoleAssignRequest {
  private List<Long> roleIds;
}

