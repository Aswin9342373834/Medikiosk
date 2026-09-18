const express = require('express');
const router = express.Router();
const Consent = require('../models/Consent');
const Patient = require('../models/Patient');
const { authenticateUser, requireRole, createAuditLog } = require('../middleware/auth');

// Record Patient Consent
router.post('/', authenticateUser, requireRole(['PATIENT']), async (req, res) => {
  try {
    const { opdVisitId, purpose, consentGiven, version, language } = req.body;
    
    let patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    const consent = await Consent.create({
      patientId: patient._id,
      userId: req.user.id,
      opdVisitId: opdVisitId || undefined,
      purpose: purpose || 'Clinical intake, AI-assisted history summarization, and physician OPD consultation',
      consentGiven: consentGiven !== undefined ? consentGiven : true,
      version: version || 'v1.0-ABDM-Ready',
      language: language || 'English',
      timestamp: new Date()
    });

    await createAuditLog(req.user.id, 'PATIENT', 'CONSENT_RECORDED', 'Consent', consent._id);

    res.status(201).json({
      success: true,
      message: 'Consent recorded successfully',
      data: consent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Consent History for Patient with strict ownership check
router.get('/patient/:patientId', authenticateUser, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Strict Ownership Enforcement: Patient A cannot query Patient B's consent
    if (req.user.role === 'PATIENT' && patient.userId.toString() !== req.user.id) {
      await createAuditLog(req.user.id, 'PATIENT', 'ACCESS_DENIED', 'Consent', null, 'Failure', 'Attempted to access other patient consent');
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot access consent records for another patient'
      });
    }

    const consents = await Consent.find({ patientId }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: consents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
