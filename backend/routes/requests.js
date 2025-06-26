const express = require('express');
const { dbAsync } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all requests (filtered by user role)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT 
        r.*,
        e.name as employee_name,
        e.email as employee_email,
        e.department as employee_department,
        e.avatar as employee_avatar,
        e.role as employee_role,
        a.name as approved_by_name
      FROM time_off_requests r
      JOIN users e ON r.employee_id = e.id
      LEFT JOIN users a ON r.approved_by = a.id
    `;
    
    let params = [];

    // Filter based on user role
    if (req.user.role === 'employee') {
      query += ' WHERE r.employee_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'manager') {
      query += ' WHERE e.department = ?';
      params.push(req.user.department);
    }
    // Admin sees all requests (no additional filter)

    query += ' ORDER BY r.created_at DESC';

    const rows = await dbAsync.all(query, params);

    // Transform the data to match frontend expectations
    const requests = rows.map(row => ({
      id: row.id,
      employee: {
        id: row.employee_id,
        name: row.employee_name,
        email: row.employee_email,
        department: row.employee_department,
        avatar: row.employee_avatar,
        role: row.employee_role
      },
      startDate: row.start_date,
      endDate: row.end_date,
      type: row.type,
      reason: row.reason,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      approvedBy: row.approved_by_name ? {
        name: row.approved_by_name
      } : null,
      rejectionReason: row.rejection_reason,
      originalClockIn: row.original_clock_in,
      originalClockOut: row.original_clock_out,
      requestedClockIn: row.requested_clock_in,
      requestedClockOut: row.requested_clock_out
    }));

    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// Create new request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      type,
      reason,
      originalClockIn,
      originalClockOut,
      requestedClockIn,
      requestedClockOut
    } = req.body;

    if (!startDate || !endDate || !type || !reason) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const requestId = generateId();

    await dbAsync.run(`
      INSERT INTO time_off_requests (
        id, employee_id, start_date, end_date, type, reason,
        original_clock_in, original_clock_out, 
        requested_clock_in, requested_clock_out
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      requestId,
      req.user.id,
      startDate,
      endDate,
      type,
      reason,
      originalClockIn || null,
      originalClockOut || null,
      requestedClockIn || null,
      requestedClockOut || null
    ]);

    // Add notification for managers
    if (req.user.role === 'employee') {
      const managers = await dbAsync.all(
        'SELECT id FROM users WHERE role IN ("manager", "admin") AND department = ?',
        [req.user.department]
      );

      for (const manager of managers) {
        await dbAsync.run(`
          INSERT INTO notifications (id, user_id, type, message)
          VALUES (?, ?, 'info', ?)
        `, [
          generateId(),
          manager.id,
          `New ${type} request from ${req.user.name}`
        ]);
      }
    }

    res.status(201).json({ message: 'Request created successfully', id: requestId });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Failed to create request' });
  }
});

// Update request status
router.patch('/:id/status', authenticateToken, requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Get the request to find the employee
    const request = await dbAsync.get(
      'SELECT employee_id, type FROM time_off_requests WHERE id = ?',
      [id]
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Update request status
    await dbAsync.run(`
      UPDATE time_off_requests 
      SET status = ?, approved_by = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, req.user.id, rejectionReason || null, id]);

    // Add notification for employee
    const notificationMessage = status === 'approved' 
      ? `Your ${request.type} request has been approved`
      : `Your ${request.type} request has been rejected`;

    await dbAsync.run(`
      INSERT INTO notifications (id, user_id, type, message)
      VALUES (?, ?, ?, ?)
    `, [
      generateId(),
      request.employee_id,
      status === 'approved' ? 'success' : 'error',
      notificationMessage
    ]);

    res.json({ message: 'Request updated successfully' });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ message: 'Failed to update request' });
  }
});

// Helper function to generate IDs
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

module.exports = router;