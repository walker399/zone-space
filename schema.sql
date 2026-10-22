
.-- SQL Schema for Zone Space Subscription Management System
-- Compatible with MySQL and SQLite

-- 1. Users Table
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK(role IN ('SuperAdmin', 'Admin', 'User')) NOT NULL DEFAULT 'User',
    status VARCHAR(20) CHECK(status IN ('Active', 'Suspended')) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Subscribers Table
CREATE TABLE IF NOT EXISTS Subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Receipts Table
CREATE TABLE IF NOT EXISTS Receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_no VARCHAR(20) UNIQUE NOT NULL,
    subscriber_id INTEGER,
    sub_type VARCHAR(20) CHECK(sub_type IN ('Daily', 'Weekly', 'Monthly', 'Booking')) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    start_date DATE,
    end_date DATE,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscriber_id) REFERENCES Subscribers(id),
    FOREIGN KEY (created_by) REFERENCES Users(id)
);

-- 4. Payments Table
CREATE TABLE IF NOT EXISTS Payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receipt_id) REFERENCES Receipts(id) ON DELETE CASCADE
);

-- 5. Settings Table
CREATE TABLE IF NOT EXISTS Settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_name VARCHAR(50) UNIQUE NOT NULL,
    value_text TEXT NOT NULL
);

-- 6. ActivityLogs Table
CREATE TABLE IF NOT EXISTS ActivityLogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
