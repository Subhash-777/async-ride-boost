const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/database');
const { validateSignup, validateLogin } = require('../middleware/validation');

// Sign up
router.post('/signup', validateSignup, async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    
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
    
    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.execute(
      `INSERT INTO users (id, email, password, name, phone, wallet_balance, created_at) 
       VALUES (?, ?, ?, ?, ?, 100.00, NOW())`,
      [userId, email, hashedPassword, name, phone]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { id: userId, email },
      process.env.JWT_SECRET || 'rideshare-secret-key',
      { expiresIn: '7d' }
    );
    
    // Get user data
    const [users] = await db.execute(
      'SELECT id, email, name, phone, wallet_balance, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: users[0]
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
    
    // Find user
    const [users] = await db.execute(
      'SELECT id, email, password, name, phone, wallet_balance, created_at FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    const user = users[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'rideshare-secret-key',
      { expiresIn: '7d' }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to login' });
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;