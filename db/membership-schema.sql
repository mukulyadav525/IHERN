-- ---------------------------------------------------------------------------
-- Membership tables (database `ihern2024`) for a NEW, empty installation.
-- The existing installation already has these; this is only for a fresh
-- database. Safe to re-run: every statement is IF NOT EXISTS.
--
--   mysql -u <user> -p ihern2024 < db/membership-schema.sql
--
-- Then create the first staff sign-in (see README, "A fresh database").
-- ---------------------------------------------------------------------------

-- Members who joined through the membership form.
CREATE TABLE IF NOT EXISTS `studentregistration` (
  `studentID`         INT AUTO_INCREMENT PRIMARY KEY,
  `studentName`       VARCHAR(100) NOT NULL,
  `studentEmail`      VARCHAR(100) NOT NULL,
  `studentMobile`     VARCHAR(50)  NOT NULL,
  `studentPassword`   VARCHAR(100) NOT NULL,   -- SHA-256 hex
  `regDate`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tokenCode`         VARCHAR(100) NOT NULL,
  `userStatus`        ENUM('Y','N') DEFAULT 'Y',
  `yourTitle`         VARCHAR(150) DEFAULT NULL,
  `institutionName`   VARCHAR(200) DEFAULT NULL,
  `areasofinterest`   TEXT,
  `areasofinteresthe` TEXT,
  `photo`             VARCHAR(255) DEFAULT NULL,
  `url`               VARCHAR(255) DEFAULT NULL,
  -- IHERN/<year>-<month><nth member that year>, e.g. IHERN/2026-1007. Empty
  -- for members who joined before 5 October 2026: theirs is IHERN/2025-<id>.
  `membershipNo`      VARCHAR(40) DEFAULT NULL,
  KEY `idx_student_email` (`studentEmail`),
  UNIQUE KEY `uniq_membership_no` (`membershipNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Member sign-ins.
CREATE TABLE IF NOT EXISTS `authsession` (
  `authsessionID` INT AUTO_INCREMENT PRIMARY KEY,
  `studentID`     INT NOT NULL,
  `authtokenid`   VARCHAR(500) NOT NULL,
  `loginFlg`      VARCHAR(100) NOT NULL,
  KEY `idx_auth_student` (`studentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Staff who may use the membership admin.
CREATE TABLE IF NOT EXISTS `adminlogin` (
  `adID`       INT AUTO_INCREMENT PRIMARY KEY,
  `adName`     VARCHAR(100) NOT NULL,
  `adEmail`    VARCHAR(100) NOT NULL,
  `adMobile`   VARCHAR(50)  NOT NULL,
  `adPassword` VARCHAR(100) NOT NULL,          -- SHA-256 hex
  `adDate`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tokenCode`  VARCHAR(100) NOT NULL,
  `userStatus` ENUM('Y','N') DEFAULT 'N',
  UNIQUE KEY `uniq_admin_email` (`adEmail`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- "Please update your IHERN details" requests from the membership admin. The
-- emailed link opens the member's details for editing without a password;
-- it works until it expires or is used.
CREATE TABLE IF NOT EXISTS `member_update_requests` (
  `studentID`    INT NOT NULL PRIMARY KEY,
  `token_hash`   CHAR(64) NOT NULL,
  `requested_by` VARCHAR(190) NOT NULL DEFAULT '',
  `requested_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at`   DATETIME NOT NULL,
  `completed_at` DATETIME NULL,
  UNIQUE KEY `uniq_update_token` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
