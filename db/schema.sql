-- ---------------------------------------------------------------------------
-- IHERN Blog - database tables
--
-- Run against the `cdnm` database (the one that already holds the IHERN
-- accounts, blog_subscribers and blog_subscriptions). Safe to re-run: every
-- statement is IF NOT EXISTS. The WordPress tables (ihernblog_*) are not
-- touched; scripts/migrate-wordpress.mjs copies their content into these.
--
--   npm run db:schema        (or: mysql cdnm < db/schema.sql)
-- ---------------------------------------------------------------------------

-- The IHERN account and subscription tables, in case this database has not
-- had them yet (the same definitions the PHP site uses).
CREATE TABLE IF NOT EXISTS `blog_subscribers` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `name`          VARCHAR(150) NOT NULL,
  `email`         VARCHAR(190) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `blog_subscriptions` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `subscriber_id` INT NOT NULL,
  `status`        ENUM('active','unsubscribed') NOT NULL DEFAULT 'active',
  `source`        VARCHAR(40) NOT NULL DEFAULT 'blog',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_subscriber` (`subscriber_id`),
  CONSTRAINT `fk_blog_subscriptions_subscriber`
    FOREIGN KEY (`subscriber_id`) REFERENCES `blog_subscribers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sso_auth_codes` (
  `code_hash`     CHAR(64) NOT NULL PRIMARY KEY,
  `client_id`     VARCHAR(64) NOT NULL,
  `subscriber_id` INT NOT NULL,
  `redirect_uri`  VARCHAR(255) NOT NULL,
  `nonce`         VARCHAR(64) NULL,
  `expires_at`    DATETIME NOT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_expires` (`expires_at`),
  CONSTRAINT `fk_sso_codes_subscriber`
    FOREIGN KEY (`subscriber_id`) REFERENCES `blog_subscribers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Blog content
-- ---------------------------------------------------------------------------

-- People posts are written by (shown on the post, with a short bio). Not
-- accounts: an author does not need to sign in to anything.
CREATE TABLE IF NOT EXISTS `blog_authors` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `slug`       VARCHAR(190) NOT NULL,
  `name`       VARCHAR(190) NOT NULL,
  `bio`        TEXT NULL,
  -- their picture: an image in blog_media (no foreign key: blog_media is
  -- created below; a deleted image simply reads as "no picture")
  `photo_media_id` INT NULL,
  `wp_id`      INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_author_slug` (`slug`),
  UNIQUE KEY `uniq_author_wp` (`wp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Uploaded images. `path` is relative to the upload directory
-- (BLOG_UPLOAD_DIR), e.g. "2026/06/ihern.png"; the blog serves it at
-- /wp-content/uploads/<path>, the address WordPress used.
CREATE TABLE IF NOT EXISTS `blog_media` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `path`        VARCHAR(500) NOT NULL,
  `mime`        VARCHAR(100) NOT NULL,
  `width`       INT NULL,
  `height`      INT NULL,
  `size`        INT NOT NULL DEFAULT 0,
  `alt`         VARCHAR(500) NOT NULL DEFAULT '',
  `title`       VARCHAR(500) NOT NULL DEFAULT '',
  `uploaded_by` VARCHAR(190) NULL,
  `wp_id`       INT NULL,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_media_path` (`path`(255)),
  UNIQUE KEY `uniq_media_wp` (`wp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Posts and pages (About us, ...). Content is sanitised HTML.
CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id`                INT AUTO_INCREMENT PRIMARY KEY,
  `type`              ENUM('post','page') NOT NULL DEFAULT 'post',
  `slug`              VARCHAR(200) NOT NULL,
  `title`             VARCHAR(500) NOT NULL,
  `excerpt`           TEXT NULL,
  `content`           MEDIUMTEXT NOT NULL,
  `status`            ENUM('draft','published','trash') NOT NULL DEFAULT 'draft',
  `author_id`         INT NULL,
  `featured_media_id` INT NULL,
  `comments_open`     TINYINT(1) NOT NULL DEFAULT 1,
  `published_at`      DATETIME NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- set once subscribers have been emailed about the post (first publish only)
  `notified_at`       DATETIME NULL,
  `wp_id`             INT NULL,
  UNIQUE KEY `uniq_post_slug` (`type`, `slug`),
  UNIQUE KEY `uniq_post_wp` (`wp_id`),
  KEY `idx_post_listing` (`type`, `status`, `published_at`),
  CONSTRAINT `fk_post_author` FOREIGN KEY (`author_id`) REFERENCES `blog_authors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_post_media` FOREIGN KEY (`featured_media_id`) REFERENCES `blog_media` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Categories and tags.
CREATE TABLE IF NOT EXISTS `blog_terms` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `taxonomy`    ENUM('category','tag') NOT NULL,
  `slug`        VARCHAR(190) NOT NULL,
  `name`        VARCHAR(190) NOT NULL,
  `description` TEXT NULL,
  `wp_id`       INT NULL,
  UNIQUE KEY `uniq_term_slug` (`taxonomy`, `slug`),
  UNIQUE KEY `uniq_term_wp` (`taxonomy`, `wp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `blog_post_terms` (
  `post_id` INT NOT NULL,
  `term_id` INT NOT NULL,
  PRIMARY KEY (`post_id`, `term_id`),
  KEY `idx_term` (`term_id`),
  CONSTRAINT `fk_pt_post` FOREIGN KEY (`post_id`) REFERENCES `blog_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pt_term` FOREIGN KEY (`term_id`) REFERENCES `blog_terms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Comments, written by signed-in IHERN readers. A reader's first comment
-- waits for approval; after one is approved, theirs appear straight away
-- (WordPress's "previously approved" rule, which the blog used).
CREATE TABLE IF NOT EXISTS `blog_comments` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `post_id`       INT NOT NULL,
  `subscriber_id` INT NULL,
  `author_name`   VARCHAR(190) NOT NULL,
  `author_email`  VARCHAR(190) NOT NULL,
  `content`       TEXT NOT NULL,
  `status`        ENUM('pending','approved','spam','trash') NOT NULL DEFAULT 'pending',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `wp_id`         INT NULL,
  KEY `idx_comment_post` (`post_id`, `status`),
  UNIQUE KEY `uniq_comment_wp` (`wp_id`),
  CONSTRAINT `fk_comment_post` FOREIGN KEY (`post_id`) REFERENCES `blog_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_subscriber` FOREIGN KEY (`subscriber_id`) REFERENCES `blog_subscribers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Blog administration and sign-in
-- ---------------------------------------------------------------------------

-- Who may use the blog's admin area. They sign in with their IHERN account;
-- this list says which accounts may write. `admin` can also manage this list.
-- Only IHERN members are added (the admin area checks the membership).
--   npm run blog:add-editor -- someone@iiitd.ac.in admin
CREATE TABLE IF NOT EXISTS `blog_editors` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `email`      VARCHAR(190) NOT NULL,
  `role`       ENUM('admin','editor') NOT NULL DEFAULT 'editor',
  -- 0: deactivated (kept on the list, no access)
  `active`     TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_editor_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- The blog's reader sessions (it signs readers in through the main site).
-- Kept server-side so signing out on the main site can end them here too.
CREATE TABLE IF NOT EXISTS `blog_sessions` (
  `id`            CHAR(64) NOT NULL PRIMARY KEY,   -- SHA-256 of the cookie value
  `subscriber_id` INT NOT NULL,
  `name`          VARCHAR(190) NOT NULL,
  `email`         VARCHAR(190) NOT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at`    DATETIME NOT NULL,
  KEY `idx_session_subscriber` (`subscriber_id`),
  KEY `idx_session_expires` (`expires_at`),
  CONSTRAINT `fk_session_subscriber` FOREIGN KEY (`subscriber_id`) REFERENCES `blog_subscribers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- IHERN accounts that open the membership admin (ihern2024.adminlogin)
-- without its separate sign-in. A row is added only with proof the account
-- holder owns the admin account (see apps/main/lib/admin.ts); the admin must
-- still be active under the same email.
CREATE TABLE IF NOT EXISTS `membership_admin_accounts` (
  `subscriber_id` INT NOT NULL PRIMARY KEY,
  `admin_id`      INT NOT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_admin_account_subscriber` FOREIGN KEY (`subscriber_id`) REFERENCES `blog_subscribers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Invitations to the membership admin (ihern2024.adminlogin), sent by email.
-- Opening the link while signed in to the IHERN account with the invited
-- address (or creating that account from the link) links the two, as
-- membership_admin_accounts above. The link proves the mailbox is theirs.
CREATE TABLE IF NOT EXISTS `membership_admin_invites` (
  `admin_id`   INT NOT NULL PRIMARY KEY,
  `token_hash` CHAR(64) NOT NULL,
  `invited_by` VARCHAR(190) NOT NULL DEFAULT '',
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_invite_token` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- "Please subscribe" emails a blog admin sent to people who are not
-- subscribed, so nobody is asked twice in a short time.
CREATE TABLE IF NOT EXISTS `blog_nudges` (
  `email`   VARCHAR(190) NOT NULL PRIMARY KEY,
  `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_by` VARCHAR(190) NOT NULL DEFAULT '',
  `count`   INT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Events (the main site's Events section, managed in the events admin)
-- ---------------------------------------------------------------------------

-- An event: webinar, workshop, conference session... Times are IST.
-- `links` is a JSON list of {"label", "url"}: a Google Form, a poster PDF...
CREATE TABLE IF NOT EXISTS `ihern_events` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `tag`          VARCHAR(100) NOT NULL DEFAULT '',
  `title`        VARCHAR(300) NOT NULL,
  `description`  TEXT NOT NULL,
  `speakers`     TEXT NULL,
  `starts_at`    DATETIME NULL,
  `ends_at`      DATETIME NULL,
  `venue`        VARCHAR(300) NOT NULL DEFAULT '',
  `mode`         ENUM('online','in-person','hybrid') NOT NULL DEFAULT 'online',
  `join_url`     VARCHAR(1000) NOT NULL DEFAULT '',
  `join_label`   VARCHAR(100) NOT NULL DEFAULT '',
  `links`        TEXT NULL,
  `status`       ENUM('draft','published','trash') NOT NULL DEFAULT 'draft',
  `published_at` DATETIME NULL,
  `created_by`   VARCHAR(190) NOT NULL DEFAULT '',
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- the email to all members: claimed once, then counted as it goes out
  `notified_at`  DATETIME NULL,
  `notify_total` INT NULL,
  `notify_sent`  INT NOT NULL DEFAULT 0,
  `seed_key`     VARCHAR(60) NULL,
  KEY `idx_event_listing` (`status`, `starts_at`),
  UNIQUE KEY `uniq_event_seed` (`seed_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Who may use the events admin besides the membership admins (who always
-- can). They sign in with their IHERN account. `admin` can manage this list.
CREATE TABLE IF NOT EXISTS `event_editors` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `email`      VARCHAR(190) NOT NULL,
  `role`       ENUM('admin','editor') NOT NULL DEFAULT 'editor',
  -- 0: deactivated (kept on the list, no access)
  `active`     TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_event_editor_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- IHERC registrations and payments (the IHERC admin, /iherc2026/admin).
--
-- The fee is paid on the finance department's form (form.qfixonline.com),
-- which this site cannot change or read. So: the registration page confirms a
-- member before they pay (and tells them exactly what to enter), and the
-- payments list finance hands over is imported here and checked against the
-- member list.
-- ---------------------------------------------------------------------------

-- Who may use the IHERC admin (membership admins always may).
CREATE TABLE IF NOT EXISTS `iherc_editors` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `email`      VARCHAR(190) NOT NULL,
  `role`       ENUM('admin','editor') NOT NULL DEFAULT 'editor',
  -- 0: deactivated (kept on the list, no access)
  `active`     TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_iherc_editor_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Members confirmed on the registration page before paying: who, how
-- (signed in / membership number / email and phone) and the amount shown.
CREATE TABLE IF NOT EXISTS `iherc_checks` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `member_id`     INT NOT NULL,
  `membership_no` VARCHAR(40) NOT NULL,
  `name`          VARCHAR(190) NOT NULL DEFAULT '',
  `email`         VARCHAR(190) NOT NULL DEFAULT '',
  `method`        ENUM('account','number','email-phone') NOT NULL,
  `amount`        INT NOT NULL,
  `checks`        INT NOT NULL DEFAULT 1,
  `first_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_iherc_check_member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One import of finance's payments list (to see it, or undo it).
CREATE TABLE IF NOT EXISTS `iherc_imports` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `file_name`   VARCHAR(190) NOT NULL DEFAULT '',
  `rows_added`  INT NOT NULL DEFAULT 0,
  `rows_known`  INT NOT NULL DEFAULT 0,
  `imported_by` VARCHAR(190) NOT NULL DEFAULT '',
  `imported_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- The payments, as finance's list has them. The check (member? right
-- amount?) is worked out when the list is shown, against the member list as
-- it is then; only what an admin decides is stored (resolved, a note, when
-- the balance was asked for).
CREATE TABLE IF NOT EXISTS `iherc_payments` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `import_id`       INT NOT NULL,
  -- the payment's own reference (transaction / order number), when the list has one
  `ref`             VARCHAR(120) NULL DEFAULT NULL,
  -- the same payment imported twice is recognised by this (ref, or the row's contents)
  `fingerprint`     CHAR(64) NOT NULL,
  `paid_at`         DATETIME NULL DEFAULT NULL,
  `name`            VARCHAR(190) NOT NULL DEFAULT '',
  `email`           VARCHAR(190) NOT NULL DEFAULT '',
  `phone`           VARCHAR(60) NOT NULL DEFAULT '',
  `category`        VARCHAR(120) NOT NULL DEFAULT '',
  `says_member`     VARCHAR(40) NOT NULL DEFAULT '',
  `membership_no`   VARCHAR(80) NOT NULL DEFAULT '',
  `designation`     VARCHAR(190) NOT NULL DEFAULT '',
  `affiliation`     VARCHAR(255) NOT NULL DEFAULT '',
  `gst_no`          VARCHAR(60) NOT NULL DEFAULT '',
  `paper_no`        VARCHAR(120) NOT NULL DEFAULT '',
  `dinner`          VARCHAR(40) NOT NULL DEFAULT '',
  `amount`          DECIMAL(10,2) NULL DEFAULT NULL,
  `pay_status`      VARCHAR(60) NOT NULL DEFAULT '',
  -- the whole row as imported, heading -> value
  `raw`             TEXT,
  `resolved`        TINYINT(1) NOT NULL DEFAULT 0,
  `note`            VARCHAR(500) NOT NULL DEFAULT '',
  `balance_asked_at` DATETIME NULL DEFAULT NULL,
  `updated_by`      VARCHAR(190) NOT NULL DEFAULT '',
  UNIQUE KEY `uniq_iherc_payment` (`fingerprint`),
  KEY `idx_iherc_payment_import` (`import_id`),
  KEY `idx_iherc_payment_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
