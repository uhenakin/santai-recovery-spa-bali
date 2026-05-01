CREATE DATABASE IF NOT EXISTS santai_tracker;
USE santai_tracker;

DROP TABLE IF EXISTS click_logs;
DROP TABLE IF EXISTS ip_cooldown;
DROP TABLE IF EXISTS blocked_ips;

-- Tabel ini WAJIB ada kolom Visit agar tidak error
CREATE TABLE click_logs (
    No INT AUTO_INCREMENT PRIMARY KEY,
    IP_Address VARCHAR(45) NOT NULL,
    Visit VARCHAR(100) NOT NULL,
    Click VARCHAR(100) NOT NULL,
    City VARCHAR(100),
    Country VARCHAR(100),
    Timestamp DATETIME NOT NULL
);

CREATE TABLE ip_cooldown (
    ip_address VARCHAR(45) NOT NULL,
    click_type VARCHAR(50) NOT NULL,
    last_clicked DATETIME NOT NULL,
    PRIMARY KEY (ip_address, click_type)
);

CREATE TABLE blocked_ips (
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    reason VARCHAR(255),
    blocked_at DATETIME NOT NULL,
    PRIMARY KEY (ip_address)
);
