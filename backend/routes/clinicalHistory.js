const express = require('express');
const router = express.Router();
const ClinicalHistory = require('../models/ClinicalHistory');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const OpdVisit = require('../models/OpdVisit');
const Consent = require('../models/Consent');
const ollamaService = require('../services/ollamaService');
const { authenticateUser, requireRole, createAuditLog } = require('../middleware/auth');

// Submit Clinical History (Patient or Kiosk)
router.post('/submit-history', authenticateUser, requireRole(['PATIENT']), async (req, res) => {
  try {
    const userId = req.user.id;
    let patient = await Patient.findOne({ userId });
    
    // Auto-create patient profile if submitted from kiosk without pre-existing profile
    if (!patient) {
      patient = await Patient.create({
        userId,
        name: req.body.name || 'Patient',
        abhaId: req.body.abhaId || `ABHA-${Date.now().toString().slice(-6)}`,
        currentStatus: 'History Collection'
      });
    }

    const {
      presentingComplaint,
      chiefComplaint,
      historyOfPresentIllness,
      onset,
      duration,
      location,
      character,
      severity,
      aggravatingFactors,
      relievingFactors,
      associatedSymptoms,
      pastMedicalHistory,
      pastSurgicalHistory,
      medications,
      allergies,
      familyHistory,
      personalHistory,
      socialHistory,
      reviewOfSystems,
      ayushMode,
      ayushData,
      consentGiven,
      consentVersion
    } = req.body;

    // RULE 1: STORE PATIENT DATA IN DATABASE BEFORE ANY AI PROCESSING
    const clinicalHistory = await ClinicalHistory.create({
      patientId: patient._id,
      userId,
      presentingComplaint: presentingComplaint || chiefComplaint || 'General OPD Evaluation',
      chiefComplaint: chiefComplaint || presentingComplaint,
      historyOfPresentIllness: historyOfPresentIllness || 'Reported at hospital kiosk.',
      onset,
      duration,
      location,
      character,
      severity,
      aggravatingFactors,
      relievingFactors,
      associatedSymptoms: Array.isArray(associatedSymptoms) ? associatedSymptoms : [],
      pastMedicalHistory: Array.isArray(pastMedicalHistory) ? pastMedicalHistory : (pastMedicalHistory ? [pastMedicalHistory] : []),
      pastSurgicalHistory: Array.isArray(pastSurgicalHistory) ? pastSurgicalHistory : (pastSurgicalHistory ? [pastSurgicalHistory] : []),
      medications: Array.isArray(medications) ? medications : [],
      allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
      familyHistory,
      personalHistory,
      socialHistory,
      reviewOfSystems: Array.isArray(reviewOfSystems) ? reviewOfSystems : [],
      ayushMode: Boolean(ayushMode),
      ayushData: ayushData || {},
      status: 'Submitted',
      consentGiven: consentGiven !== undefined ? consentGiven : true,
      consentTimestamp: new Date(),
      consentVersion: consentVersion || 'v1.0'
    });

    await createAuditLog(userId, 'PATIENT', 'HISTORY_SUBMITTED', 'ClinicalHistory', clinicalHistory._id);

    // Record formal Consent
    if (consentGiven !== false) {
      await Consent.create({
        patientId: patient._id,
        userId,
        purpose: 'Clinical intake, AI-assisted history summarization, and physician OPD consultation',
        consentGiven: true,
        version: consentVersion || 'v1.0-ABDM-Ready',
        language: req.body.language || 'English',
        timestamp: new Date()
      });
    }

    // Update active OPD visit status
    const activeVisit = await OpdVisit.findOne({
      patientId: patient._id,
      status: { $in: ['REGISTERED', 'WAITING', 'HISTORY_IN_PROGRESS'] }
    }).sort({ createdAt: -1 });

    if (activeVisit) {
      activeVisit.status = 'READY_FOR_DOCTOR';
      activeVisit.historyCompletedAt = new Date();
      await activeVisit.save();
    }

    // Update patient status to Waiting for Doctor
    patient.currentStatus = 'Waiting for Doctor';
    await patient.save();

    // RULE 2: AI PROCESSING AS SECONDARY / NON-BLOCKING ENRICHMENT
    let aiResponse = null;
    try {
      await createAuditLog(userId, 'SYSTEM', 'AI_PROCESSING_STARTED', 'ClinicalHistory', clinicalHistory._id);
      aiResponse = await ollamaService.generateClinicalSummary(req.body, []);
      
      clinicalHistory.aiSummary = aiResponse.summary.historyOfPresentIllness || aiResponse.summary.presentingComplaint;
      clinicalHistory.aiSummaryStructured = aiResponse.summary;
      clinicalHistory.redFlags = aiResponse.summary.redFlags || [];
      clinicalHistory.doctorAttentionItems = aiResponse.summary.doctorAttentionItems || [];
      clinicalHistory.aiStatus = aiResponse.aiStatus;
      await clinicalHistory.save();

      await createAuditLog(userId, 'SYSTEM', 'AI_PROCESSING_COMPLETED', 'ClinicalHistory', clinicalHistory._id);
    } catch (aiErr) {
      console.warn('AI processing error handled gracefully:', aiErr.message);
      clinicalHistory.aiStatus = 'Unavailable';
      clinicalHistory.aiError = 'AI processing is temporarily unavailable. Your information has been saved and can be reviewed manually.';
      await clinicalHistory.save();
      await createAuditLog(userId, 'SYSTEM', 'AI_PROCESSING_FAILED', 'ClinicalHistory', clinicalHistory._id, 'Failure', aiErr.message);
    }

    // Real-time notification & Socket.io broadcast
    const io = req.app.get('io');
    if (io) {
      const hasRedFlag = clinicalHistory.redFlags && clinicalHistory.redFlags.length > 0;

      io.emit('new-patient', {
        id: clinicalHistory._id,
        patientId: patient._id,
        patientName: patient.name,
        abhaId: patient.abhaId,
        complaint: clinicalHistory.presentingComplaint,
        hasRedFlags: hasRedFlag,
        redFlags: clinicalHistory.redFlags,
        status: 'Waiting for Doctor',
        submittedAt: clinicalHistory.createdAt
      });

      if (hasRedFlag) {
        io.emit('red-flag-alert', {
          patientName: patient.name,
          patientId: patient._id,
          redFlags: clinicalHistory.redFlags,
          message: 'Potential urgent symptom detected. Please notify authorized clinical staff.'
        });

        await Notification.create({
          recipientRole: 'DOCTOR',
          title: 'RED FLAG ALERT: Potential Clinical Attention Item',
          message: `Patient ${patient.name} (${patient.abhaId}) reported critical symptoms: ${clinicalHistory.redFlags.join(', ')}`,
          type: 'RedFlag',
          actionUrl: `/doctor?patientId=${patient._id}`
        });
      }
    }

    const message = clinicalHistory.aiStatus === 'Unavailable'
      ? 'AI processing is temporarily unavailable. Your information has been saved and can be reviewed manually.'
      : 'Clinical history structured and sent to physician queue.';

    res.status(201).json({
      success: true,
      message,
      data: clinicalHistory
    });
  } catch (error) {
    console.error('Submit history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Adaptive questioning API
router.post('/adaptive-question', async (req, res) => {
  try {
    const { currentHistory, language } = req.body;
    const questionData = await ollamaService.generateAdaptiveQuestions(currentHistory || {}, language || 'English');
    res.json({ success: true, data: questionData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get clinical history for a patient
router.get('/patient/:patientId', authenticateUser, async (req, res) => {
  try {
    const history = await ClinicalHistory.findOne({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    if (!history) return res.status(404).json({ success: false, message: 'No clinical history found' });

    // Ensure patients can only view their own history
    if (req.user.role === 'PATIENT' && history.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Doctor Review & Verification of AI summary (Accept, Edit, Reject)
router.patch('/:id/review', authenticateUser, requireRole(['DOCTOR']), async (req, res) => {
  try {
    const { doctorReviewStatus, doctorNotes, editedSummary } = req.body;
    const history = await ClinicalHistory.findById(req.params.id);
    if (!history) return res.status(404).json({ success: false, message: 'History record not found' });

    history.doctorReviewStatus = doctorReviewStatus || 'Accepted';
    if (doctorNotes) history.doctorNotes = doctorNotes;
    if (editedSummary) history.aiSummary = editedSummary;
    history.verifiedBy = req.user.id;
    history.status = 'Doctor Reviewed';
    await history.save();

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
