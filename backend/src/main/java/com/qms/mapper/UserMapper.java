package com.qms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qms.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserMapper extends BaseMapper<User> {
  @Select("SELECT u.* FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON r.id = ur.role_id WHERE r.code = #{roleCode} AND u.deleted = 0")
  java.util.List<User> selectByRoleCode(String roleCode);
}

