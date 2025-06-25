-- TimeOff Manager Database Schema for Cloudflare D1

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK(role IN ('employee', 'manager', 'admin')) NOT NULL DEFAULT 'employee',
  department TEXT NOT NULL,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create time_off_requests table
CREATE TABLE IF NOT EXISTS time_off_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT CHECK(type IN ('paid time off', 'sick leave', 'time edit', 'other')) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  approved_by TEXT,
  rejection_reason TEXT,
  original_clock_in TIME,
  original_clock_out TIME,
  requested_clock_in TIME,
  requested_clock_out TIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT CHECK(type IN ('info', 'success', 'warning', 'error')) NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_requests_employee_id ON time_off_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Insert sample users (password hash for 'password')
INSERT OR IGNORE INTO users (id, name, email, password, role, department, avatar) VALUES
('1', 'Juan Carranza', 'employee@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'employee', 'Engineering', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
('2', 'Ana Ramirez', 'manager@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'manager', 'Engineering', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
('3', 'Alissa Pryor', 'alice@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'employee', 'Marketing', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
('4', 'Charly Osornio', 'bob@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'employee', 'Sales', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
('5', 'Admin User', 'admin@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'admin', 'IT', 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
('6', 'Sarah Johnson', 'sarah@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'employee', 'Project Management', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
('7', 'Mike Rodriguez', 'mike@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'employee', 'Shop', 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1');

-- Insert sample time off requests
INSERT OR IGNORE INTO time_off_requests (id, employee_id, start_date, end_date, type, reason, status, approved_by, created_at) VALUES
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
INSERT OR IGNORE INTO notifications (id, user_id, type, message, is_read, created_at) VALUES
('notif1', '1', 'success', 'Your time off request for Feb 15-17 has been approved', 0, '2025-01-10 10:00:00'),
('notif2', '3', 'info', 'Your sick leave request is pending manager approval', 0, '2025-01-12 14:35:00'),
('notif3', '4', 'info', 'Your time off request for March 1-5 is pending approval', 0, '2025-01-13 11:20:00'),
('notif4', '6', 'success', 'Your time edit request has been approved', 1, '2025-01-09 09:00:00'),
('notif5', '7', 'error', 'Your time off request has been rejected', 0, '2025-01-11 17:00:00'),
('notif6', '2', 'info', 'You have 2 pending requests to review', 0, '2025-01-13 12:00:00');