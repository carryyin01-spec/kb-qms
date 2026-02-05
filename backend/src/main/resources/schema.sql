SET FOREIGN_KEY_CHECKS=0;
SET FOREIGN_KEY_CHECKS=0;
SET NAMES utf8mb4;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL UNIQUE COMMENT '用户登录名',
  name VARCHAR(128) COMMENT '用户姓名',
  password VARCHAR(128) NOT NULL COMMENT '密码(明文或BCrypt)',
  email VARCHAR(128) COMMENT '邮箱',
  status INT DEFAULT 1 COMMENT '状态(1启用,0停用)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted TINYINT DEFAULT 0 COMMENT '逻辑删除(0正常,1删除)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户表';

CREATE TABLE roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL COMMENT '角色名称',
  code VARCHAR(64) NOT NULL UNIQUE COMMENT '角色编码(ROLE_*)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='角色表';

CREATE TABLE user_roles (
  user_id BIGINT NOT NULL COMMENT '用户ID',
  role_id BIGINT NOT NULL COMMENT '角色ID',
  PRIMARY KEY (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户与角色关联';
 
DROP TABLE IF EXISTS documents;
CREATE TABLE documents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(256) COMMENT '标题',
  content TEXT COMMENT '内容',
  status VARCHAR(32) COMMENT '状态',
  owner_id BIGINT COMMENT '所有者ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='文档表';
 
DROP TABLE IF EXISTS customer_complaints;
CREATE TABLE customer_complaints (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  month VARCHAR(16) COMMENT '月份',
  cycle VARCHAR(32) COMMENT '周期',
  customer_grade VARCHAR(32) COMMENT '客户等级',
  complaint_time DATETIME COMMENT '投诉时间',
  customer_code VARCHAR(192) COMMENT '客户代码',
  product_model VARCHAR(256) COMMENT '产品型号',
  problem_source VARCHAR(128) COMMENT '问题来源',
  production_dept VARCHAR(128) COMMENT '生产部门',
  order_qty INT COMMENT '订单数量',
  complaint_qty INT COMMENT '投诉数量',
  problem_nature VARCHAR(128) COMMENT '问题性质',
  inspector VARCHAR(64) COMMENT '检验员',
  defect_sn VARCHAR(256) COMMENT '不良SN',
  complaint_description TEXT COMMENT '投诉问题描述',
  defect_pictures TEXT COMMENT '不良图片',
  is_included_in_indicators VARCHAR(16) COMMENT '是否计入指标',
  severity_level VARCHAR(32) COMMENT '严重等级',
  problem_subtype VARCHAR(128) COMMENT '问题小类',
  root_cause TEXT COMMENT '原因(简述)',
  improvement_measures TEXT COMMENT '改善措施',
  owner VARCHAR(64) COMMENT '责任人',
  line_leader VARCHAR(64) COMMENT '责任线长',
  supervisor VARCHAR(64) COMMENT '责任主管',
  responsible_dept VARCHAR(128) COMMENT '责任部门',
  remark TEXT COMMENT '备注',
  status VARCHAR(32) COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='客诉问题';

DROP TABLE IF EXISTS complaint_attachments;
CREATE TABLE complaint_attachments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  complaint_id BIGINT NOT NULL COMMENT '投诉ID',
  filename VARCHAR(256) COMMENT '原文件名',
  url VARCHAR(512) COMMENT '文件访问URL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='投诉附件';
 
DROP TABLE IF EXISTS audit_plans;
CREATE TABLE audit_plans (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(256) COMMENT '审核标题',
  audit_date DATE COMMENT '审核日期',
  status VARCHAR(32) COMMENT '状态',
  approver VARCHAR(64) COMMENT '批准人',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='审核计划';
 
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(256) COMMENT '标题',
  content TEXT COMMENT '内容',
  recipient VARCHAR(128) COMMENT '接收人',
  status VARCHAR(32) COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='通知';
 
DROP TABLE IF EXISTS system_logs;
CREATE TABLE system_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) COMMENT '用户名',
  path VARCHAR(256) COMMENT '请求路径',
  method VARCHAR(16) COMMENT '方法',
  action VARCHAR(64) COMMENT '动作',
  ip VARCHAR(64) COMMENT 'IP',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='系统操作日志';
 
DROP TABLE IF EXISTS document_versions;
CREATE TABLE document_versions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  document_id BIGINT NOT NULL COMMENT '文档ID',
  version_no INT NOT NULL COMMENT '版本号',
  content TEXT COMMENT '内容',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='文档版本';

DROP TABLE IF EXISTS complaint_followups;
CREATE TABLE complaint_followups (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  complaint_id BIGINT NOT NULL COMMENT '投诉ID',
  note TEXT COMMENT '备注',
  created_by VARCHAR(64) COMMENT '创建人',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='投诉跟进记录';
 
DROP TABLE IF EXISTS permissions;
CREATE TABLE permissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL COMMENT '权限名称',
  code VARCHAR(128) NOT NULL UNIQUE COMMENT '权限编码',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='权限点';
 
DROP TABLE IF EXISTS role_permissions;
CREATE TABLE role_permissions (
  role_id BIGINT NOT NULL COMMENT '角色ID',
  permission_id BIGINT NOT NULL COMMENT '权限ID',
  PRIMARY KEY (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='角色-权限关联';

DROP TABLE IF EXISTS workflow_templates;
CREATE TABLE workflow_templates (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_code VARCHAR(50) NOT NULL UNIQUE COMMENT '模板编码',
  template_name VARCHAR(200) NOT NULL COMMENT '模板名称',
  entity_type VARCHAR(50) NOT NULL COMMENT '实体类型',
  description TEXT COMMENT '描述',
  config TEXT COMMENT '配置JSON',
  is_active TINYINT DEFAULT 1 COMMENT '是否启用',
  created_by BIGINT COMMENT '创建人',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='工作流模板';

DROP TABLE IF EXISTS workflow_instances;
CREATE TABLE workflow_instances (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_id BIGINT NOT NULL COMMENT '模板ID',
  entity_id BIGINT NOT NULL COMMENT '实体ID',
  entity_type VARCHAR(50) NOT NULL COMMENT '实体类型',
  current_node VARCHAR(50) NOT NULL COMMENT '当前节点',
  status VARCHAR(20) DEFAULT 'running' COMMENT '状态',
  variables TEXT COMMENT '变量JSON',
  starter_id BIGINT NOT NULL COMMENT '发起人ID',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
  completed_at TIMESTAMP NULL COMMENT '完成时间',
  FOREIGN KEY (template_id) REFERENCES workflow_templates(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='工作流实例';

DROP TABLE IF EXISTS workflow_history;
CREATE TABLE workflow_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  instance_id BIGINT NOT NULL COMMENT '实例ID',
  from_node VARCHAR(50) COMMENT '来源节点',
  to_node VARCHAR(50) NOT NULL COMMENT '目标节点',
  action VARCHAR(100) COMMENT '操作',
  comment TEXT COMMENT '备注',
  operator_id BIGINT NOT NULL COMMENT '操作人ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (instance_id) REFERENCES workflow_instances(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='工作流流转记录';

DROP TABLE IF EXISTS integration_configs;
CREATE TABLE integration_configs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  system_code VARCHAR(50) NOT NULL UNIQUE COMMENT '系统编码',
  system_name VARCHAR(200) NOT NULL COMMENT '系统名称',
  base_url VARCHAR(500) COMMENT '基础URL',
  auth_type VARCHAR(20) NOT NULL COMMENT '认证类型',
  auth_config TEXT COMMENT '认证配置JSON',
  api_version VARCHAR(20) COMMENT 'API版本',
  is_active TINYINT DEFAULT 1 COMMENT '是否启用',
  timeout INT DEFAULT 30 COMMENT '超时(秒)',
  retry_times INT DEFAULT 3 COMMENT '重试次数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='集成系统配置';

DROP TABLE IF EXISTS integration_mappings;
CREATE TABLE integration_mappings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  config_id BIGINT NOT NULL COMMENT '配置ID',
  local_entity VARCHAR(100) NOT NULL COMMENT '本地实体',
  remote_entity VARCHAR(100) NOT NULL COMMENT '远端实体',
  direction VARCHAR(10) NOT NULL COMMENT '方向(IN/OUT)',
  field_mapping TEXT COMMENT '字段映射JSON',
  transform_rules TEXT COMMENT '转换规则JSON',
  auto_sync TINYINT DEFAULT 0 COMMENT '是否自动同步',
  sync_schedule VARCHAR(100) COMMENT '同步计划CRON',
  FOREIGN KEY (config_id) REFERENCES integration_configs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='集成映射';

DROP TABLE IF EXISTS integration_logs;
CREATE TABLE integration_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  config_id BIGINT NOT NULL COMMENT '配置ID',
  direction VARCHAR(20) NOT NULL COMMENT '方向',
  operation VARCHAR(50) NOT NULL COMMENT '操作',
  entity_type VARCHAR(100) COMMENT '实体类型',
  entity_id BIGINT COMMENT '实体ID',
  request_data TEXT COMMENT '请求数据',
  response_data TEXT COMMENT '响应数据',
  status VARCHAR(20) NOT NULL COMMENT '状态',
  error_message TEXT COMMENT '错误信息',
  execution_time INT COMMENT '耗时ms',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (config_id) REFERENCES integration_configs(id),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='集成执行日志';

DROP TABLE IF EXISTS conformance_headers;
CREATE TABLE conformance_headers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
  inspection_date DATE COMMENT '检验日期',
  line_name VARCHAR(64) COMMENT '送检区域',
  production_line VARCHAR(64) COMMENT '生产线体',
  work_shift VARCHAR(64) COMMENT '班次',
  product_no VARCHAR(64) COMMENT '产品编码',
  customer_code VARCHAR(64) COMMENT '客户编码',
  send_qty INT DEFAULT 0 COMMENT '送检数量',
  sample_qty INT DEFAULT 0 COMMENT '抽样数量',
  qa_inspector VARCHAR(64) COMMENT 'QA检验员',
  checker VARCHAR(64) COMMENT '生产总检',
  order_no VARCHAR(64) COMMENT '订单编号',
  firmware_version VARCHAR(64) COMMENT '固件版本',
  coating_thickness VARCHAR(64) COMMENT '三防漆厚度',
  attach_info VARCHAR(64) COMMENT '有无附件',
  attachment_code VARCHAR(64) COMMENT '附件编码',
  ecn VARCHAR(128) COMMENT 'ECN/子件ECN',
  change_desc VARCHAR(256) COMMENT '变更内容',
  sample_plan VARCHAR(256) COMMENT '抽样计划',
  spec_desc VARCHAR(256) COMMENT '检验标准',
  tool_desc VARCHAR(256) COMMENT '检验工具/仪器',
  product_special_req VARCHAR(256) COMMENT '产品特殊要求',
  aql_standard TEXT COMMENT '允收水准/AQL(格式: CR:0(Acc Q''ty: 0 Rej Q''ty: 0)|Maj:0.25(Acc Q''ty: 0 Rej Q''ty: 1)|Min:0.65(Acc Q''ty: 0 Rej Q''ty: 1))',
  report_no VARCHAR(64) COMMENT '报告编号',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='符合性检验单-头表';

DROP TABLE IF EXISTS conformance_lines;
CREATE TABLE conformance_lines (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
  header_id BIGINT NOT NULL COMMENT '头表ID',
  seq_no INT COMMENT '序号',
  product_sn VARCHAR(128) COMMENT '产品SN',
  inspected_at DATETIME COMMENT '检验日期',
  line_name VARCHAR(64) COMMENT '送检区域',
  production_line VARCHAR(64) COMMENT '生产线体',
  work_shift VARCHAR(64) COMMENT '班次',
  product_no VARCHAR(64) COMMENT '产品编码',
  customer_code VARCHAR(64) COMMENT '客户编码',
  send_qty INT COMMENT '送检数量',
  sample_qty INT COMMENT '抽样数量',
  qa_inspector VARCHAR(64) COMMENT 'QA检验员',
  checker VARCHAR(64) COMMENT '生产总检',
  order_no VARCHAR(64) COMMENT '订单编号',
  firmware_version VARCHAR(64) COMMENT '固件版本',
  coating_thickness VARCHAR(64) COMMENT '三防漆厚度',
  attach_info VARCHAR(64) COMMENT '有无附件',
  attachment_code VARCHAR(64) COMMENT '附件编码',
  ecn VARCHAR(128) COMMENT 'ECN/子件ECN',
  change_desc VARCHAR(256) COMMENT '变更内容',
  sample_plan VARCHAR(256) COMMENT '抽样计划',
  spec_desc VARCHAR(256) COMMENT '检验标准',
  tool_desc VARCHAR(256) COMMENT '检验工具/仪器',
  product_special_req VARCHAR(256) COMMENT '产品特殊要求',
  defect_desc VARCHAR(512) COMMENT '检验不良描述',
  issue_type VARCHAR(64) COMMENT '问题类型',
  issue_subtype VARCHAR(64) COMMENT '问题小类',
  owner VARCHAR(64) COMMENT '责任人',
  owner_manager VARCHAR(64) COMMENT '责任人主管',
  owner_dept VARCHAR(64) COMMENT '责任部门',
  root_cause VARCHAR(512) COMMENT '原因分析',
  action VARCHAR(512) COMMENT '改善对策',
  remark VARCHAR(512) COMMENT '备注',
  result VARCHAR(16) COMMENT '结果(OK/NG)',
  second_check_result VARCHAR(16) COMMENT '二次检查结果(OK/NG)',
  second_scan_time DATETIME COMMENT '二次扫描时间',
  defect_images TEXT COMMENT '初检不良图片',
  second_check_images TEXT COMMENT '二次扫描图片',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='符合性检验单-明细';

SET FOREIGN_KEY_CHECKS=1;
SET FOREIGN_KEY_CHECKS=1;
