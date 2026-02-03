INSERT INTO roles (name, code) VALUES ('管理员', 'ROLE_ADMIN');
INSERT INTO roles (name, code) VALUES ('用户', 'ROLE_USER');
INSERT INTO users (username, password, email, status) VALUES ('admin', 'Admin@123', 'admin@qms.local', 1);
INSERT INTO users (username, password, email, status) VALUES ('user', 'User@123', 'user@qms.local', 1);
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);
INSERT INTO user_roles (user_id, role_id) VALUES (2, 2);

