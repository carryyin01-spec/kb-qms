package com.qms.dto;

import java.util.List;
import lombok.Data;

@Data
public class PermissionAssignRequest {
    private List<Long> permissionIds;
}
