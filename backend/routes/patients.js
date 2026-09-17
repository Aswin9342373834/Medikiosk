const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const User = require('../models/User');
const { authenticateUser, requireRole } = require('../middleware/auth');

// Get profile of logged in patient
router.get('/profile', authenticateUser, requireRole(['PATIENT']), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update patient profile
router.put('/profile', authenticateUser, requireRole(['PATIENT']), async (req, res) => {
  try {
    const updates = req.body;
    // Don't allow changing userId or abhaId directly
    delete updates.userId;
    delete updates.abhaId;

    const patient = await Patient.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updates },
      { new: true }
    );
    if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// List all patients (Doctor and Admin)
router.get('/', authenticateUser, requireRole(['DOCTOR', 'ADMIN']), async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get specific patient by ID (Doctors/Admins or the patient themselves)
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    if (req.user.role === 'PATIENT' && patient.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You cannot access another patient profile' });
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Government Hospital OP Registration Endpoint
router.post('/op-register', async (req, res) => {
  try {
    const {
      fullName,
      name,
      dateOfBirth,
      age,
      gender,
      contactNumber,
      phone,
      uhid,
      abhaId,
      address,
      villageArea,
      district,
      state,
      pincode,
      emergencyName,
      emergencyPhone,
      emergencyRelationship,
      hospital,
      department,
      opdType,
      visitType,
      preferredLanguage,
      reasonForVisit,
      existingConditions,
      currentMedications,
      allergies
    } = req.body;

    const patientName = fullName || name || 'OPD Patient';
    const patientPhone = contactNumber || phone || '+91 00000 00000';
    const patientAbha = abhaId || `ABHA-${Date.now().toString().slice(-8)}`;
    const patientDept = department || 'General Medicine';

    // Generate unique OP Registration Number and Token Number
    const generatedOpNumber = `OPD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const generatedToken = `TKN-${Math.floor(100 + Math.random() * 900)}`;

    let targetUserId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'medikiosk_super_secret_jwt_key_2026');
        targetUserId = decoded.id;
      } catch (e) {
        // Continue to walk-in user creation
      }
    }

    // If walk-in user without existing login, create user account
    if (!targetUserId) {
      const bcrypt = require('bcryptjs');
      const randomMail = `opd.${Date.now()}@hospital.gov.in`;
      const hashedPassword = await bcrypt.hash('OpdGuest@123', 10);
      const guestUser = await User.create({
        email: randomMail,
        password: hashedPassword,
        firstName: patientName.split(' ')[0] || 'OPD',
        lastName: patientName.split(' ').slice(1).join(' ') || 'Patient',
        role: 'PATIENT',
        phone: patientPhone
      });
      targetUserId = guestUser._id;
    }

    // Check if patient profile already exists for this user
    let patient = await Patient.findOne({ userId: targetUserId });
    const updateData = {
      name: patientName,
      age: age ? Number(age) : 35,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender: gender || 'Male',
      contactNumber: patientPhone,
      abhaId: patientAbha,
      uhid: uhid || `UHID-${Date.now().toString().slice(-6)}`,
      opNumber: generatedOpNumber,
      tokenNumber: generatedToken,
      department: patientDept,
      opdType: opdType || 'General OPD',
      visitType: visitType || 'New',
      hospital: hospital || 'Government Medical College & Hospital',
      preferredLanguage: preferredLanguage || 'English',
      addressDetails: {
        address: address || 'Main Road',
        villageArea: villageArea || 'Ward 4',
        district: district || 'Central',
        state: state || 'New Delhi',
        pincode: pincode || '110029'
      },
      emergencyContact: {
        name: emergencyName || 'Relative',
        phone: emergencyPhone || patientPhone,
        relationship: emergencyRelationship || 'Next of Kin'
      },
      basicHealth: {
        reasonForVisit: reasonForVisit || 'General Clinical Consultation',
        existingConditions: Array.isArray(existingConditions) ? existingConditions : (existingConditions ? [existingConditions] : []),
        currentMedications: currentMedications || 'None',
        allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : [])
      },
      currentStatus: 'Waiting for Doctor'
    };

    if (patient) {
      Object.assign(patient, updateData);
      await patient.save();
    } else {
      patient = await Patient.create({
        userId: targetUserId,
        ...updateData
      });
    }

    // Socket notification
    const io = req.app.get('io');
    if (io) {
      io.emit('new-patient', {
        id: patient._id,
        patientId: patient._id,
        patientName: patient.name,
        abhaId: patient.abhaId,
        complaint: patient.basicHealth.reasonForVisit,
        department: patient.department,
        token: patient.tokenNumber,
        status: patient.currentStatus,
        priority: 'NORMAL',
        submittedAt: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Government Hospital OP Registration Completed Successfully',
      data: {
        patientId: patient._id,
        opNumber: patient.opNumber,
        tokenNumber: patient.tokenNumber,
        department: patient.department,
        registrationStatus: patient.currentStatus,
        name: patient.name,
        abhaId: patient.abhaId,
        uhid: patient.uhid,
        hospital: patient.hospital,
        registeredAt: new Date()
      }
    });
  } catch (error) {
    console.error('OP Registration Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
