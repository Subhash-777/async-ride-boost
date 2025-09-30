const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/database');
const { validateSignup, validateLogin } = require('../middleware/validation');

// Enhanced validation middleware
const validateSignupWithRole = (req, res, next) => {
  const { email, password, name, phone, role } = req.body;
  
  if (!email || !password || !name || !phone || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  if (!['rider', 'driver'].includes(role)) {
    return res.status(400).json({ message: 'Role must be either rider or driver' });
  }
  
  // Additional validation for drivers
  if (role === 'driver') {
    const { license_number, vehicle_type, license_plate } = req.body;
    if (!license_number || !vehicle_type || !license_plate) {
      return res.status(400).json({ 
        message: 'License number, vehicle type, and license plate are required for drivers' 
      });
    }
  }
  
  next();
};

// Sign up
router.post('/signup', validateSignupWithRole, async (req, res) => {
  try {
    const { email, password, name, phone, role, license_number, vehicle_type, license_plate } = req.body;
    
    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const userId = `${role}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (role === 'rider') {
      // Create rider in users table
      await db.execute(
        `INSERT INTO users (id, email, password, name, phone, wallet_balance, created_at) 
         VALUES (?, ?, ?, ?, ?, 100.00, NOW())`,
        [userId, email, hashedPassword, name, phone]
      );
    } else {
      // Create driver in drivers table
      await db.execute(
        `INSERT INTO drivers (id, email, password, name, phone, license_number, vehicle_type, license_plate, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [userId, email, hashedPassword, name, phone, license_number, vehicle_type, license_plate]
      );
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: userId, email, role },
      process.env.JWT_SECRET || 'rideshare-secret-key',
      { expiresIn: '7d' }
    );
    
    // Get user data
    const tableName = role === 'rider' ? 'users' : 'drivers';
    const selectFields = role === 'rider' 
      ? 'id, email, name, phone, wallet_balance, created_at' 
      : 'id, email, name, phone, license_number, vehicle_type, license_plate, rating, status, created_at';
    
    const [users] = await db.execute(
      `SELECT ${selectFields} FROM ${tableName} WHERE id = ?`,
      [userId]
    );
    
    const user = users[0];
    const formattedUser = {
      ...user,
      role,
      wallet_balance: role === 'rider' ? parseFloat(user.wallet_balance) || 0.0 : undefined
    };
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: formattedUser
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Sign in
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check both users and drivers tables
    let user = null;
    let role = null;
    
    // First check users table (riders)
    const [riders] = await db.execute(
      'SELECT id, email, password, name, phone, wallet_balance, created_at FROM users WHERE email = ?',
      [email]
    );
    
    if (riders.length > 0) {
      user = riders[0];
      role = 'rider';
    } else {
      // Check drivers table
      const [drivers] = await db.execute(
        'SELECT id, email, password, name, phone, license_number, vehicle_type, license_plate, rating, status, created_at FROM drivers WHERE email = ?',
        [email]
      );
      
      if (drivers.length > 0) {
        user = drivers[0];
        role = 'driver';
      }
    }
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      process.env.JWT_SECRET || 'rideshare-secret-key',
      { expiresIn: '7d' }
    );
    
    // Remove password from response and format data
    const { password: _, ...userWithoutPassword } = user;
    const formattedUser = {
      ...userWithoutPassword,
      role,
      wallet_balance: role === 'rider' ? parseFloat(userWithoutPassword.wallet_balance) || 0.0 : undefined
    };
    
    res.json({
      message: 'Login successful',
      token,
      user: formattedUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to login' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
