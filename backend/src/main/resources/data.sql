DELETE FROM role_permissions;
DELETE FROM permissions;
DELETE FROM user_roles;
DELETE FROM users;
DELETE FROM roles;

INSERT INTO roles (id, name, code) VALUES (1, '管理员', 'ROLE_ADMIN');
INSERT INTO roles (id, name, code) VALUES (2, '用户', 'ROLE_USER');
INSERT INTO roles (id, name, code) VALUES (3, '审核人', 'ROLE_REVIEWER');
INSERT INTO roles (id, name, code) VALUES (4, '批准人', 'ROLE_APPROVER');
INSERT INTO roles (id, name, code) VALUES (5, '只读用户', 'ROLE_VIEWER');
INSERT INTO roles (id, name, code) VALUES (6, '文件管理员', 'ROLE_DOC_ADMIN');
INSERT INTO roles (id, name, code) VALUES (7, 'QA检验员', 'ROLE_QA_INSPECTOR');

INSERT INTO permissions (id, name, code) VALUES (1, '文档创建', 'DOC_CREATE');
INSERT INTO permissions (id, name, code) VALUES (2, '文档修改', 'DOC_UPDATE');
INSERT INTO permissions (id, name, code) VALUES (3, '文档删除', 'DOC_DELETE');
INSERT INTO permissions (id, name, code) VALUES (4, '文档导出', 'DOC_EXPORT');
INSERT INTO permissions (id, name, code) VALUES (5, '文档工作流', 'DOC_WORKFLOW');
INSERT INTO permissions (id, name, code) VALUES (6, '客诉创建', 'COMPLAINT_CREATE');
INSERT INTO permissions (id, name, code) VALUES (7, '客诉修改', 'COMPLAINT_UPDATE');
INSERT INTO permissions (id, name, code) VALUES (8, '客诉删除', 'COMPLAINT_DELETE');
INSERT INTO permissions (id, name, code) VALUES (9, '客诉导出', 'COMPLAINT_EXPORT');
INSERT INTO permissions (id, name, code) VALUES (10, '客诉工作流', 'COMPLAINT_WORKFLOW');
INSERT INTO permissions (id, name, code) VALUES (11, '系统管理菜单', 'MENU_ADMIN');
INSERT INTO permissions (id, name, code) VALUES (12, '符合性检验菜单', 'MENU_CONFORMANCE');

INSERT INTO role_permissions (role_id, permission_id) VALUES (1, 1);
INSERT INTO role_permissions (role_id, permission_id) VALUES (1, 2);
INSERT INTO role_permissions (role_id, permission_id) VALUES (1, 3);
INSERT INTO role_permissions (role_id, permission_id) VALUES (1, 4);
INSERT INTO role_permissions (role_id, permission_id) VALUES (1, 5);
INSERT INTO role_permissions (role_id, permission_id) VALUES (1, 6);
INSERT INTO role_permissions (role_id, permission_id) VALUES (1, 7);
INSERT INTO role_permissions (role_id, permission_id) VALUES (1, 8);
INSERT INTO role_permissions (role_id, permission_id) VALUES (1, 9);
INSERT INTO role_permissions (role_id, permission_id) VALUES (1, 10);
INSERT INTO role_permissions (role_id, permission_id) VALUES (1, 11);
INSERT INTO role_permissions (role_id, permission_id) VALUES (1, 12);

INSERT INTO role_permissions (role_id, permission_id) VALUES (3, 2);
INSERT INTO role_permissions (role_id, permission_id) VALUES (3, 4);
INSERT INTO role_permissions (role_id, permission_id) VALUES (3, 5);
INSERT INTO role_permissions (role_id, permission_id) VALUES (3, 7);
INSERT INTO role_permissions (role_id, permission_id) VALUES (3, 9);
INSERT INTO role_permissions (role_id, permission_id) VALUES (3, 10);

INSERT INTO role_permissions (role_id, permission_id) VALUES (4, 2);
INSERT INTO role_permissions (role_id, permission_id) VALUES (4, 3);
INSERT INTO role_permissions (role_id, permission_id) VALUES (4, 4);
INSERT INTO role_permissions (role_id, permission_id) VALUES (4, 5);
INSERT INTO role_permissions (role_id, permission_id) VALUES (4, 7);
INSERT INTO role_permissions (role_id, permission_id) VALUES (4, 8);
INSERT INTO role_permissions (role_id, permission_id) VALUES (4, 9);
INSERT INTO role_permissions (role_id, permission_id) VALUES (4, 10);
INSERT INTO role_permissions (role_id, permission_id) VALUES (4, 11);

INSERT INTO role_permissions (role_id, permission_id) VALUES (5, 4);
INSERT INTO role_permissions (role_id, permission_id) VALUES (5, 9);

INSERT INTO role_permissions (role_id, permission_id) VALUES (6, 1);
INSERT INTO role_permissions (role_id, permission_id) VALUES (6, 2);
INSERT INTO role_permissions (role_id, permission_id) VALUES (6, 3);
INSERT INTO role_permissions (role_id, permission_id) VALUES (6, 4);
INSERT INTO role_permissions (role_id, permission_id) VALUES (6, 5);

INSERT INTO role_permissions (role_id, permission_id) VALUES (7, 12);

INSERT INTO users (id, username, name, password, email, status)
VALUES (1, 'admin', '管理员', 'Admin@123', 'admin@qms.local', 1);
INSERT INTO users (id, username, name, password, email, status)
VALUES (2, 'user', '普通用户', 'User@123', 'user@qms.local', 1);
INSERT INTO users (id, username, name, password, email, status)
VALUES (3, 'test', '测试用户', 'Test@123', 'test@qms.local', 1);
INSERT INTO users (id, username, name, password, email, status)
VALUES (4, 'qa', 'QA检验员', 'Qa@123', 'qa@qms.local', 1);

INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);
INSERT INTO user_roles (user_id, role_id) VALUES (2, 2);
INSERT INTO user_roles (user_id, role_id) VALUES (3, 2);
INSERT INTO user_roles (user_id, role_id) VALUES (2, 3);
INSERT INTO user_roles (user_id, role_id) VALUES (3, 4);
INSERT INTO user_roles (user_id, role_id) VALUES (4, 7);
 
DELETE FROM documents;
DELETE FROM customer_complaints;
 
INSERT INTO documents (id, title, content, status, owner_id) VALUES
(1, '质量手册', '质量管理制度与流程', 'APPROVED', 1),
(2, '作业指导书A', '操作步骤说明', 'DRAFT', 2);
 
INSERT INTO customer_complaints (id, customer_code, product_model, problem_nature, status) VALUES
(1, '客户A', '产品X 型号1', '外观不良', 'open'),
(2, '客户B', '产品Y 型号2', '功能失效', 'on-going');
 
DELETE FROM document_versions;
INSERT INTO document_versions (id, document_id, version_no, content) VALUES
(1, 1, 1, '质量手册 初版'),
(2, 1, 2, '质量手册 修订版'),
(3, 2, 1, '作业指导书A 初版');
