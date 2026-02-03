# QMS后端

## 运行
- 开发：`mvn spring-boot:run` 使用H2内存数据库
- 生产：设置 `SPRING_PROFILES_ACTIVE=prod` 使用MySQL

## 配置
- `application.yml` 全局配置
- `application-dev.yml` H2与初始化脚本
- `application-prod.yml` MySQL连接

## 接口
- `POST /api/auth/login` 登录获取JWT
- `GET /api/dashboard/stats` 仪表盘统计
- `GET /api/users` 用户分页查询

