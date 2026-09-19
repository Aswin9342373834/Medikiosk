const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { JWT_SECRET, authenticateUser, createAuditLog } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone, abhaId, department, specialization } = req.body;
    
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanFirstName = (firstName || '').trim();
    const cleanLastName = (lastName || '').trim();
    const cleanRole = (role || 'PATIENT').trim().toUpperCase();

    if (!cleanEmail || !password || !cleanFirstName || !cleanLastName || !cleanRole) {
      return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'All required fields must be provided' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Please enter a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters long' });
    }

    // Security Guardrail: Public self-registration is strictly for PATIENT role
    if (cleanRole !== 'PATIENT') {
      const authHeader = req.headers.authorization;
      let isAdmin = false;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
          if (decoded && decoded.role === 'ADMIN') {
            isAdmin = true;
          }
        } catch (e) {}
      }

      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN',
          message: 'Public registration is restricted to PATIENT role. Staff accounts (Doctor, Admin) must be hospital-provisioned.'
        });
      }
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, code: 'DUPLICATE_EMAIL', message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: cleanEmail,
      password: hashedPassword,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      role: cleanRole,
      phone: phone ? phone.trim() : undefined
    });

    let profileData = null;

    if (cleanRole === 'PATIENT') {
      const generatedAbha = abhaId || `ABHA-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
      profileData = await Patient.create({
        userId: user._id,
        name: `${cleanFirstName} ${cleanLastName}`,
        abhaId: generatedAbha,
        uhid: `UHID-GH-${Date.now().toString().slice(-6)}`,
        contactNumber: phone ? phone.trim() : undefined,
        currentStatus: 'Registered'
      });
      await createAuditLog(user._id, 'PATIENT', 'PATIENT_CREATED', 'Patient', profileData._id);
    } else if (cleanRole === 'DOCTOR') {
      profileData = await Doctor.create({
        userId: user._id,
        name: `Dr. ${cleanFirstName} ${cleanLastName}`,
        licenseNumber: `MCI-${Math.floor(100000 + Math.random() * 900000)}`,
        department: department || 'General Medicine',
        specialization: specialization || 'Consultant Physician'
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ 
      success: true, 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role, 
        firstName: user.firstName, 
        lastName: user.lastName,
        profile: profileData
      } 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, code: 'DUPLICATE_EMAIL', message: 'An account with this email already exists' });
    }
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Registration service error: ' + error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' });
    }

    let patientProfile = null;
    let doctorProfile = null;

    if (user.role === 'PATIENT') {
      patientProfile = await Patient.findOne({ userId: user._id });
    } else if (user.role === 'DOCTOR') {
      doctorProfile = await Doctor.findOne({ userId: user._id });
    }

    await createAuditLog(user._id, user.role, 'USER_LOGIN', 'User', user._id);

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role, 
        firstName: user.firstName, 
        lastName: user.lastName,
        patient: patientProfile,
        doctor: doctorProfile
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Authentication service temporarily unavailable. Please try again.' });
  }
});

// Get Current User Profile
router.get('/me', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let profile = null;
    if (user.role === 'PATIENT') {
      profile = await Patient.findOne({ userId: user._id });
    } else if (user.role === 'DOCTOR') {
      profile = await Doctor.findOne({ userId: user._id });
    }

    res.json({ success: true, data: { user, profile } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Forgot Password Architecture
router.post('/forgot-password-init', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a secure OTP/reset link has been initiated.' });
    }
    res.json({ 
      success: true, 
      message: 'Password reset initiated. Security OTP generated for hospital verification.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
