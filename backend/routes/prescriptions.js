const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const { authenticateUser, requireRole, createAuditLog } = require('../middleware/auth');

// Create Prescription (Doctor Only)
router.post('/', authenticateUser, requireRole(['DOCTOR']), async (req, res) => {
  try {
    const { patientId, consultationId, items, followUp, generalAdvice } = req.body;
    if (!patientId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient ID and prescribed items are required' });
    }

    const prescription = await Prescription.create({
      patientId,
      doctorId: req.user.id,
      consultationId,
      items,
      followUp,
      generalAdvice,
      date: new Date(),
      status: 'Active'
    });

    await createAuditLog(req.user.id, 'DOCTOR', 'PRESCRIPTION_CREATED', 'Prescription', prescription._id);

    const patient = await Patient.findById(patientId);
    if (patient) {
      await Notification.create({
        userId: patient.userId,
        recipientRole: 'PATIENT',
        title: 'New Prescription Issued',
        message: `Dr. has prescribed ${items.length} item(s). View full prescription in your health records.`,
        type: 'Info',
        actionUrl: '/patient/records'
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('notification', { patientId, type: 'Prescription', prescriptionId: prescription._id });
    }

    res.status(201).json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get prescriptions for a patient
router.get('/patient/:patientId', authenticateUser, async (req, res) => {
  try {
    const { patientId } = req.params;

    if (req.user.role === 'PATIENT') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient || patient._id.toString() !== patientId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    const prescriptions = await Prescription.find({ patientId }).sort({ date: -1 });
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
