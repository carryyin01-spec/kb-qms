package com.qms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qms.entity.Role;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface RoleMapper extends BaseMapper<Role> {
  @Select("SELECT r.code FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = #{userId}")
  List<String> listRoleCodesByUserId(Long userId);
}

