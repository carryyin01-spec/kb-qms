package com.qms.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import jakarta.annotation.PostConstruct;

@Configuration
public class DatabaseMigrationConfig {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void migrate() {
        // 1. 检查并添加 defect_images
        if (!columnExists("conformance_lines", "defect_images")) {
            try {
                jdbcTemplate.execute("ALTER TABLE conformance_lines ADD COLUMN defect_images TEXT COMMENT '初检不良图片'");
                System.out.println("Successfully added column defect_images to conformance_lines");
            } catch (Exception e) {
                System.err.println("Error adding defect_images: " + e.getMessage());
            }
        }

        // 2. 检查并添加 second_check_images
        if (!columnExists("conformance_lines", "second_check_images")) {
            try {
                jdbcTemplate.execute("ALTER TABLE conformance_lines ADD COLUMN second_check_images TEXT COMMENT '二次扫描图片'");
                System.out.println("Successfully added column second_check_images to conformance_lines");
            } catch (Exception e) {
                System.err.println("Error adding second_check_images: " + e.getMessage());
            }
        }

        // 3. 检查并删除旧的 images 列
        if (columnExists("conformance_lines", "images")) {
            try {
                jdbcTemplate.execute("ALTER TABLE conformance_lines DROP COLUMN images");
                System.out.println("Successfully dropped column images from conformance_lines");
            } catch (Exception e) {
                System.err.println("Error dropping images: " + e.getMessage());
            }
        }
    }

    private boolean columnExists(String tableName, String columnName) {
        try {
            String sql = "SELECT count(*) FROM information_schema.columns " +
                         "WHERE table_name = ? AND column_name = ?";
            // 兼容 H2 和 MySQL 的大小写处理
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, tableName.toUpperCase(), columnName.toUpperCase());
            if (count != null && count > 0) return true;
            
            count = jdbcTemplate.queryForObject(sql, Integer.class, tableName.toLowerCase(), columnName.toLowerCase());
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }
}
