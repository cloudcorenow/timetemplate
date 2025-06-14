-- TimeOff Manager Database Setup Script
-- This script creates the complete database schema for the TimeOff Manager application

-- Create database
CREATE DATABASE IF NOT EXISTS timeoff_manager;
USE timeoff_manager;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS time_off_requests;
DROP TABLE IF EXISTS users;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('employee', 'manager', 'admin') NOT NULL DEFAULT 'employee',
    department VARCHAR(100) NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_department (department)
);

-- =====================================================
-- TIME OFF REQUESTS TABLE
-- =====================================================
CREATE TABLE time_off_requests (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type ENUM('paid time off', 'sick leave', 'time edit', 'other') NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by VARCHAR(36),
    rejection_reason TEXT,
    
    -- Time edit specific fields
    original_clock_in TIME,
    original_clock_out TIME,
    requested_clock_in TIME,
    requested_clock_out TIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes for better performance
    INDEX idx_employee_id (employee_id),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample users (passwords are hashed for 'password')
INSERT INTO users (id, name, email, password, role, department, avatar) VALUES
('1', 'Juan Carranza', 'employee@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', 'Engineering', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
('2', 'Ana Ramirez', 'manager@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 'Engineering', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
('3', 'Alissa Pryor', 'alice@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', 'Marketing', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
('4', 'Charly Osornio', 'bob@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', 'Sales', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
('5', 'Admin User', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'IT', 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
('6', 'Sarah Johnson', 'sarah@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', 'Project Management', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
('7', 'Mike Rodriguez', 'mike@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', 'Shop', 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1');

-- Insert sample time off requests
INSERT INTO time_off_requests (id, employee_id, start_date, end_date, type, reason, status, approved_by, created_at) VALUES
('req1', '1', '2025-02-15', '2025-02-17', 'paid time off', 'Family vacation to the mountains', 'approved', '2', '2025-01-10 09:00:00'),
('req2', '3', '2025-02-20', '2025-02-21', 'sick leave', 'Flu symptoms, need to recover', 'pending', NULL, '2025-01-12 14:30:00'),
('req3', '4', '2025-03-01', '2025-03-05', 'paid time off', 'Wedding anniversary celebration', 'pending', NULL, '2025-01-13 11:15:00'),
('req4', '6', '2025-01-08', '2025-01-08', 'time edit', 'Forgot to clock out yesterday', 'approved', '2', '2025-01-09 08:45:00'),
('req5', '7', '2025-02-28', '2025-03-01', 'other', 'Personal appointment that cannot be rescheduled', 'rejected', '2', '2025-01-11 16:20:00');

-- Update time edit request with time details
UPDATE time_off_requests 
SET original_clock_in = '08:00:00', 
    original_clock_out = '17:00:00', 
    requested_clock_in = '08:00:00', 
    requested_clock_out = '18:00:00'
WHERE id = 'req4';

-- Update rejected request with rejection reason
UPDATE time_off_requests 
SET rejection_reason = 'Insufficient notice period. Please submit requests at least 2 weeks in advance.'
WHERE id = 'req5';

-- Insert sample notifications
INSERT INTO notifications (id, user_id, type, message, is_read, created_at) VALUES
('notif1', '1', 'success', 'Your time off request for Feb 15-17 has been approved', FALSE, '2025-01-10 10:00:00'),
('notif2', '3', 'info', 'Your sick leave request is pending manager approval', FALSE, '2025-01-12 14:35:00'),
('notif3', '4', 'info', 'Your time off request for March 1-5 is pending approval', FALSE, '2025-01-13 11:20:00'),
('notif4', '6', 'success', 'Your time edit request has been approved', TRUE, '2025-01-09 09:00:00'),
('notif5', '7', 'error', 'Your time off request has been rejected', FALSE, '2025-01-11 17:00:00'),
('notif6', '2', 'info', 'You have 2 pending requests to review', FALSE, '2025-01-13 12:00:00');

-- =====================================================
-- USEFUL VIEWS FOR REPORTING
-- =====================================================

-- View for request details with employee and approver information
CREATE VIEW request_details AS
SELECT 
    r.id,
    r.start_date,
    r.end_date,
    r.type,
    r.reason,
    r.status,
    r.created_at,
    r.updated_at,
    e.name as employee_name,
    e.email as employee_email,
    e.department as employee_department,
    e.avatar as employee_avatar,
    a.name as approved_by_name,
    r.rejection_reason,
    r.original_clock_in,
    r.original_clock_out,
    r.requested_clock_in,
    r.requested_clock_out
FROM time_off_requests r
JOIN users e ON r.employee_id = e.id
LEFT JOIN users a ON r.approved_by = a.id;

-- View for department statistics
CREATE VIEW department_stats AS
SELECT 
    u.department,
    COUNT(DISTINCT u.id) as total_employees,
    COUNT(r.id) as total_requests,
    COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN r.status = 'approved' THEN 1 END) as approved_requests,
    COUNT(CASE WHEN r.status = 'rejected' THEN 1 END) as rejected_requests
FROM users u
LEFT JOIN time_off_requests r ON u.id = r.employee_id
WHERE u.role != 'admin'
GROUP BY u.department;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

DELIMITER //

-- Procedure to approve a request
CREATE PROCEDURE ApproveRequest(
    IN request_id VARCHAR(36),
    IN manager_id VARCHAR(36)
)
BEGIN
    UPDATE time_off_requests 
    SET status = 'approved', 
        approved_by = manager_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = request_id;
    
    -- Add notification for employee
    INSERT INTO notifications (id, user_id, type, message, created_at)
    SELECT 
        CONCAT('notif_', UUID()),
        employee_id,
        'success',
        CONCAT('Your ', type, ' request has been approved'),
        CURRENT_TIMESTAMP
    FROM time_off_requests 
    WHERE id = request_id;
END //

-- Procedure to reject a request
CREATE PROCEDURE RejectRequest(
    IN request_id VARCHAR(36),
    IN manager_id VARCHAR(36),
    IN reason TEXT
)
BEGIN
    UPDATE time_off_requests 
    SET status = 'rejected', 
        approved_by = manager_id,
        rejection_reason = reason,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = request_id;
    
    -- Add notification for employee
    INSERT INTO notifications (id, user_id, type, message, created_at)
    SELECT 
        CONCAT('notif_', UUID()),
        employee_id,
        'error',
        CONCAT('Your ', type, ' request has been rejected'),
        CURRENT_TIMESTAMP
    FROM time_off_requests 
    WHERE id = request_id;
END //

DELIMITER ;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_requests_employee_status ON time_off_requests(employee_id, status);
CREATE INDEX idx_requests_department_status ON time_off_requests(employee_id, status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- =====================================================
-- SAMPLE QUERIES FOR TESTING
-- =====================================================

-- Get all pending requests for a manager's department
-- SELECT * FROM request_details WHERE employee_department = 'Engineering' AND status = 'pending';

-- Get all requests for a specific employee
-- SELECT * FROM request_details WHERE employee_email = 'employee@example.com';

-- Get department statistics
-- SELECT * FROM department_stats;

-- Get unread notifications for a user
-- SELECT * FROM notifications WHERE user_id = '1' AND is_read = FALSE ORDER BY created_at DESC;

-- Get upcoming approved time off
-- SELECT * FROM request_details WHERE status = 'approved' AND start_date > CURDATE() ORDER BY start_date;

COMMIT;

-- Display success message
SELECT 'Database setup completed successfully!' as message;