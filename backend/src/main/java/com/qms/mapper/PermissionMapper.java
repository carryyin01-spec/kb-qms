package com.qms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qms.entity.Permission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface PermissionMapper extends BaseMapper<Permission> {
  @Select("""
      SELECT p.code FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = #{userId} AND p.deleted = 0
      """)
  java.util.List<String> listPermissionCodesByUserId(Long userId);
}
