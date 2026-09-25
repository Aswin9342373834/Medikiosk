const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const digitalSignatureService = require('../services/digitalSignatureService');
const { authenticateUser, requireRole, createAuditLog } = require('../middleware/auth');

// Create Prescription (Doctor Only)
router.post('/', authenticateUser, requireRole(['DOCTOR']), async (req, res) => {
  try {
    const { patientId, consultationId, diagnosis, items, followUp, generalAdvice } = req.body;
    if (!patientId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient ID and prescribed items are required' });
    }

    const docHash = digitalSignatureService.computeDigest({
      patientId,
      doctorId: req.user.id,
      diagnosis,
      items,
      followUp,
      generalAdvice,
      date: new Date().toISOString()
    });

    const prescription = await Prescription.create({
      patientId,
      doctorId: req.user.id,
      consultationId,
      diagnosis,
      items,
      followUp,
      generalAdvice,
      date: new Date(),
      status: 'Active',
      digitalSignature: {
        status: 'Doctor Confirmed (PKI DSC Integration-Ready)',
        documentHash: docHash,
        signedAt: new Date()
      }
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

    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'firstName lastName email role')
      .sort({ date: -1 });
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single prescription by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctorId', 'firstName lastName email role')
      .populate('patientId', 'name age gender uhid abhaId userId');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    // RBAC: Patient can only view their own prescription
    if (req.user.role === 'PATIENT') {
      const patient = await Patient.findOne({ userId: req.user.id });
      const rxPatientId = prescription.patientId?._id?.toString() || prescription.patientId?.toString();
      if (!patient || patient._id.toString() !== rxPatientId) {
        return res.status(403).json({ success: false, message: 'Access forbidden: You cannot view another patient\'s prescription' });
      }
    } else if (req.user.role !== 'DOCTOR' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
