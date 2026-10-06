-- =============================================================
-- CMS Database Initialization — MySQL (MariaDB 10.4+ compatible)
-- Responsibility: Users, Roles, AuditLogs (relational / structured)
-- Articles live in MongoDB (see models/Article.js)
-- =============================================================

CREATE DATABASE IF NOT EXISTS cms_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cms_db;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------
-- Roles
-- -------------------------------------------------------------
DROP TABLE IF EXISTS AuditLogs;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Roles;

CREATE TABLE Roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_roles_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO Roles (name, description) VALUES
  ('Admin',  'Full system access — can manage users and all content'),
  ('Author', 'Can create and manage own content');

-- -------------------------------------------------------------
-- Users
-- -------------------------------------------------------------
CREATE TABLE Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES Roles(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_email_format CHECK (email REGEXP '^[^@]+@[^@]+\\.[^@]+$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Required: Index on Users.email for fast lookups (UNIQUE already creates one,
-- but we add an explicit named index to satisfy the requirement verbatim)
CREATE INDEX idx_users_email ON Users (email);

-- Additional helpful indexes
CREATE INDEX idx_users_role_id ON Users (role_id);
CREATE INDEX idx_users_is_active ON Users (is_active);

-- -------------------------------------------------------------
-- AuditLogs
-- -------------------------------------------------------------
CREATE TABLE AuditLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES Users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_audit_user_id ON AuditLogs (user_id);
CREATE INDEX idx_audit_action ON AuditLogs (action);
CREATE INDEX idx_audit_created_at ON AuditLogs (created_at);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- Views
-- =============================================================
DROP VIEW IF EXISTS ActiveAuthorsView;

CREATE VIEW ActiveAuthorsView AS
SELECT
  u.id,
  u.name,
  u.email,
  u.is_active,
  u.created_at,
  u.updated_at,
  r.name AS role_name
FROM Users u
JOIN Roles r ON r.id = u.role_id
WHERE r.name = 'Author'
  AND u.is_active = 1;

-- =============================================================
-- Triggers
-- =============================================================
DROP TRIGGER IF EXISTS trg_after_user_insert;

DELIMITER //

CREATE TRIGGER trg_after_user_insert
AFTER INSERT ON Users
FOR EACH ROW
BEGIN
  INSERT INTO AuditLogs (user_id, action, details)
  VALUES (
    NEW.id,
    'USER_CREATED',
    CONCAT('User ', NEW.email, ' created with role_id ', NEW.role_id)
  );
END //

DELIMITER ;

-- =============================================================
-- Stored Procedures
-- =============================================================
DROP PROCEDURE IF EXISTS CreateUserWithRole;

DELIMITER //

CREATE PROCEDURE CreateUserWithRole(
  IN p_name VARCHAR(80),
  IN p_email VARCHAR(191),
  IN p_password_hash VARCHAR(255),
  IN p_role_name VARCHAR(50)
)
BEGIN
  DECLARE v_role_id INT;
  DECLARE v_existing INT DEFAULT 0;

  -- Validate inputs
  IF p_name IS NULL OR CHAR_LENGTH(TRIM(p_name)) < 2 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Name must be at least 2 characters';
  END IF;

  IF p_email IS NULL OR p_email NOT REGEXP '^[^@]+@[^@]+\\.[^@]+$' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid email format';
  END IF;

  IF p_password_hash IS NULL OR CHAR_LENGTH(p_password_hash) < 10 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid password hash';
  END IF;

  IF p_role_name IS NULL OR p_role_name NOT IN ('Admin', 'Author') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role must be Admin or Author';
  END IF;

  -- Resolve role
  SELECT id INTO v_role_id FROM Roles WHERE name = p_role_name LIMIT 1;

  IF v_role_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role not found';
  END IF;

  -- Check duplicate email
  SELECT COUNT(*) INTO v_existing FROM Users WHERE email = p_email;
  IF v_existing > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email already exists';
  END IF;

  -- Insert user (trigger will write to AuditLogs)
  INSERT INTO Users (name, email, password_hash, role_id)
  VALUES (TRIM(p_name), TRIM(LOWER(p_email)), p_password_hash, v_role_id);

  -- Return the newly created user (without password_hash)
  SELECT u.id, u.name, u.email, r.name AS role, u.is_active, u.created_at
  FROM Users u
  JOIN Roles r ON r.id = u.role_id
  WHERE u.id = LAST_INSERT_ID();
END //

DELIMITER ;

-- =============================================================
-- Helpful seed check (optional): create a default admin if none exists
-- Password for seed is 'admin123' hashed with bcrypt (cost 10) — replace immediately
-- This is commented out to avoid shipping a known credential into production.
-- Uncomment only for local dev if you need a bootstrap account:
-- CALL CreateUserWithRole('System Admin', 'admin@cms.local', '$2a$10$...replace...', 'Admin');
-- =============================================================
