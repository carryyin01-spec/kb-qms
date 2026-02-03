# QMS质量管理系统

## 快速运行
- 后端开发模式（H2内存库）
  - 进入 `backend`
  - 安装 JDK 17 与 Maven
  - 运行 `mvn spring-boot:run`
  - 接口地址 `http://localhost:8080/api`
- 前端开发模式
  - 进入 `frontend`
  - 运行 `npm install`
  - 运行 `npm start`
  - 页面地址 `http://localhost:3000`
- Docker一键运行（生产配置，MySQL）
  - 安装 Docker 与 Docker Compose
  - 在项目根目录执行 `docker compose -f docker/docker-compose.yml up -d`
  - 后端 `http://localhost:8080/api`，MySQL `localhost:3306`

## 默认账户
- 管理员：`admin` / `Admin@123`
- 普通用户：`user` / `User@123`

## 模块
- 用户与权限、JWT认证、仪表盘示例
- MyBatis-Plus分页与统一响应

## 环境
- Spring Boot 3.2、Spring Security 6、MyBatis-Plus、H2/MySQL
- React 18、Axios、Tailwind、Recharts

