package com.qms.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface RolePermissionMapper {
  @Select("SELECT permission_id FROM role_permissions WHERE role_id = #{roleId}")
  List<Long> selectPermissionIdsByRoleId(Long roleId);

  @Delete("DELETE FROM role_permissions WHERE role_id = #{roleId}")
  void deleteByRoleId(Long roleId);

  @Insert("INSERT INTO role_permissions(role_id, permission_id) VALUES(#{roleId}, #{permissionId})")
  void insertRolePermission(Long roleId, Long permissionId);

  @Delete("DELETE FROM role_permissions WHERE role_id = #{roleId} AND permission_id = #{permissionId}")
  void deleteRolePermission(Long roleId, Long permissionId);
}

