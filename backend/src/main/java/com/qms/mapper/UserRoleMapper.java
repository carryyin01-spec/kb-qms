package com.qms.mapper;

import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface UserRoleMapper {
  @Select("SELECT role_id FROM user_roles WHERE user_id = #{userId}")
  List<Long> selectRoleIdsByUserId(Long userId);

  @Delete("DELETE FROM user_roles WHERE user_id = #{userId}")
  void deleteByUserId(Long userId);

  @Insert("INSERT INTO user_roles(user_id, role_id) VALUES(#{userId}, #{roleId})")
  void insertUserRole(@Param("userId") Long userId, @Param("roleId") Long roleId);

  @Delete("DELETE FROM user_roles WHERE user_id = #{userId} AND role_id = #{roleId}")
  void deleteUserRole(@Param("userId") Long userId, @Param("roleId") Long roleId);
}

