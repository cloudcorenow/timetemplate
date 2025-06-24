const express = require('express');
const { dbAsync } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const rows = await dbAsync.all(
      'SELECT id, name, email, role, department, avatar, created_at FROM users ORDER BY name'
    );

    res.json(rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get team members (manager/admin)
router.get('/team', authenticateToken, requireRole(['manager', 'admin']), async (req, res) => {
  try {
    let query = 'SELECT id, name, email, role, department, avatar FROM users';
    let params = [];

    if (req.user.role === 'manager') {
      query += ' WHERE department = ? AND role != "admin"';
      params.push(req.user.department);
    } else {
      query += ' WHERE role != "admin"';
    }

    query += ' ORDER BY name';

    const rows = await dbAsync.all(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Failed to fetch team members' });
  }
});

module.exports = router;