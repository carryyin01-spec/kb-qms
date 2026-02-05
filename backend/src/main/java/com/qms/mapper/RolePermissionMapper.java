package com.qms.mapper;

import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface RolePermissionMapper {
  @Select("SELECT permission_id FROM role_permissions WHERE role_id = #{roleId}")
  List<Long> selectPermissionIdsByRoleId(Long roleId);

  @Delete("DELETE FROM role_permissions WHERE role_id = #{roleId}")
  void deleteByRoleId(Long roleId);

  @Insert("INSERT INTO role_permissions(role_id, permission_id) VALUES(#{roleId}, #{permissionId})")
  void insertRolePermission(@Param("roleId") Long roleId, @Param("permissionId") Long permissionId);

  @Delete("DELETE FROM role_permissions WHERE role_id = #{roleId} AND permission_id = #{permissionId}")
  void deleteRolePermission(@Param("roleId") Long roleId, @Param("permissionId") Long permissionId);
}

