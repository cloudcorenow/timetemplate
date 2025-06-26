const { dbAsync } = require('../config/database');
const bcrypt = require('bcryptjs');

const initDatabase = async () => {
  try {
    console.log('🚀 Initializing SQLite database...');

    // Create users table
    await dbAsync.run(`
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
      )
    `);

    // Create time_off_requests table
    await dbAsync.run(`
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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create notifications table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT CHECK(type IN ('info', 'success', 'warning', 'error')) NOT NULL DEFAULT 'info',
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_users_department ON users(department)');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_requests_employee_id ON time_off_requests(employee_id)');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_requests_status ON time_off_requests(status)');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)');

    console.log('✅ Database tables created successfully');

    // Check if users already exist
    const existingUsers = await dbAsync.get('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers.count === 0) {
      console.log('📝 Inserting sample data...');
      
      // Hash password for all users (password: "password")
      const hashedPassword = await bcrypt.hash('password', 10);

      // Insert sample users
      const users = [
        ['1', 'Juan Carranza', 'employee@example.com', hashedPassword, 'employee', 'Engineering', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
        ['2', 'Ana Ramirez', 'manager@example.com', hashedPassword, 'manager', 'Engineering', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
        ['3', 'Alissa Pryor', 'alice@example.com', hashedPassword, 'employee', 'Marketing', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
        ['4', 'Charly Osornio', 'bob@example.com', hashedPassword, 'employee', 'Sales', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
        ['5', 'Admin User', 'admin@example.com', hashedPassword, 'admin', 'IT', 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
        ['6', 'Sarah Johnson', 'sarah@example.com', hashedPassword, 'employee', 'Project Management', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
        ['7', 'Mike Rodriguez', 'mike@example.com', hashedPassword, 'employee', 'Shop', 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1']
      ];

      for (const user of users) {
        await dbAsync.run(
          'INSERT INTO users (id, name, email, password, role, department, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)',
          user
        );
      }

      // Insert sample time off requests
      const requests = [
        ['req1', '1', '2025-02-15', '2025-02-17', 'paid time off', 'Family vacation to the mountains', 'approved', '2'],
        ['req2', '3', '2025-02-20', '2025-02-21', 'sick leave', 'Flu symptoms, need to recover', 'pending', null],
        ['req3', '4', '2025-03-01', '2025-03-05', 'paid time off', 'Wedding anniversary celebration', 'pending', null],
        ['req4', '6', '2025-01-08', '2025-01-08', 'time edit', 'Forgot to clock out yesterday', 'approved', '2'],
        ['req5', '7', '2025-02-28', '2025-03-01', 'other', 'Personal appointment that cannot be rescheduled', 'rejected', '2']
      ];

      for (const request of requests) {
        await dbAsync.run(
          'INSERT INTO time_off_requests (id, employee_id, start_date, end_date, type, reason, status, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          request
        );
      }

      // Update time edit request with time details
      await dbAsync.run(
        'UPDATE time_off_requests SET original_clock_in = ?, original_clock_out = ?, requested_clock_in = ?, requested_clock_out = ? WHERE id = ?',
        ['08:00:00', '17:00:00', '08:00:00', '18:00:00', 'req4']
      );

      // Update rejected request with rejection reason
      await dbAsync.run(
        'UPDATE time_off_requests SET rejection_reason = ? WHERE id = ?',
        ['Insufficient notice period. Please submit requests at least 2 weeks in advance.', 'req5']
      );

      // Insert sample notifications
      const notifications = [
        ['notif1', '1', 'success', 'Your time off request for Feb 15-17 has been approved', 0],
        ['notif2', '3', 'info', 'Your sick leave request is pending manager approval', 0],
        ['notif3', '4', 'info', 'Your time off request for March 1-5 is pending approval', 0],
        ['notif4', '6', 'success', 'Your time edit request has been approved', 1],
        ['notif5', '7', 'error', 'Your time off request has been rejected', 0],
        ['notif6', '2', 'info', 'You have 2 pending requests to review', 0]
      ];

      for (const notification of notifications) {
        await dbAsync.run(
          'INSERT INTO notifications (id, user_id, type, message, is_read) VALUES (?, ?, ?, ?, ?)',
          notification
        );
      }

      console.log('✅ Sample data inserted successfully');
    } else {
      console.log('ℹ️  Database already contains data, skipping sample data insertion');
    }

    console.log('🎉 Database initialization completed!');
    console.log('');
    console.log('📋 Available test accounts:');
    console.log('   Employee: employee@example.com / password');
    console.log('   Manager:  manager@example.com / password');
    console.log('   Admin:    admin@example.com / password');
    console.log('');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Run initialization if this script is executed directly
if (require.main === module) {
  initDatabase().then(() => {
    process.exit(0);
  });
}

module.exports = { initDatabase };