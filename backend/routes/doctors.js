const express = require('express');
const router = express.Router();
const ClinicalHistory = require('../models/ClinicalHistory');
const Patient = require('../models/Patient');
const MedicalDocument = require('../models/MedicalDocument');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const Investigation = require('../models/Investigation');
const OpdVisit = require('../models/OpdVisit');
const Consent = require('../models/Consent');
const Doctor = require('../models/Doctor');
const { authenticateUser, requireRole, createAuditLog } = require('../middleware/auth');

// Doctor Patient Queue
router.get('/queue', authenticateUser, requireRole(['DOCTOR', 'ADMIN']), async (req, res) => {
  try {
    const histories = await ClinicalHistory.find({
      status: { $in: ['Submitted', 'In Progress', 'Doctor Reviewed'] }
    })
      .populate('patientId')
      .sort({ createdAt: -1 });

    // Prioritize red flags at the top of the queue
    const queue = histories.map(h => {
      const p = h.patientId || {};
      const redFlagCount = (h.redFlags && h.redFlags.length) || 0;
      return {
        id: h._id,
        historyId: h._id,
        patientId: p._id,
        name: p.name || 'Unknown Patient',
        age: p.age || 45,
        gender: p.gender || 'Not specified',
        abhaId: p.abhaId || 'N/A',
        preferredLanguage: p.preferredLanguage || 'English',
        department: h.ayushMode ? 'AYUSH / Ayurveda' : (p.department || 'General Medicine'),
        complaint: h.presentingComplaint,
        aiSummary: h.aiSummary,
        aiStatus: h.aiStatus,
        status: p.currentStatus || 'Waiting for Doctor',
        priority: redFlagCount > 0 ? 'URGENT' : 'NORMAL',
        redFlags: h.redFlags || [],
        doctorAttentionItems: h.doctorAttentionItems || [],
        submittedAt: h.createdAt
      };
    }).sort((a, b) => {
      if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
      if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    });

    res.json({ success: true, data: queue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Full Patient Clinical Dossier
router.get('/patient-details/:patientId', authenticateUser, requireRole(['DOCTOR', 'ADMIN']), async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const history = await ClinicalHistory.findOne({ patientId }).sort({ createdAt: -1 });
    const documents = await MedicalDocument.find({ patientId }).sort({ uploadedAt: -1 });
    const investigations = await Investigation.find({ patientId }).sort({ orderedDate: -1 });
    const prescriptions = await Prescription.find({ patientId }).sort({ date: -1 });
    const consultations = await Consultation.find({ patientId }).sort({ consultationDate: -1 });
    const opdVisit = await OpdVisit.findOne({ patientId }).sort({ createdAt: -1 });
    const consent = await Consent.findOne({ patientId }).sort({ createdAt: -1 });

    // Build unified chronological medical timeline
    const timeline = [
      ...(history ? [{
        date: history.createdAt,
        type: 'Clinical Intake',
        title: 'Patient Intake & Clinical History Recorded',
        department: history.ayushMode ? 'AYUSH' : 'General OPD',
        status: history.status,
        details: history.presentingComplaint
      }] : []),
      ...documents.map(d => ({
        date: d.uploadedAt,
        type: 'Medical Document',
        title: `Uploaded ${d.documentType}: ${d.filename}`,
        department: 'Diagnostics',
        status: d.visibility,
        documentId: d._id
      })),
      ...prescriptions.map(p => ({
        date: p.date,
        type: 'Prescription',
        title: `Prescription Issued (${p.items.length} medicines)`,
        department: 'Outpatient Pharmacy',
        status: 'Active'
      })),
      ...consultations.map(c => ({
        date: c.consultationDate,
        type: 'Consultation',
        title: `Physician Consultation: ${c.diagnosis || 'Clinical Review'}`,
        department: c.department || 'General Medicine',
        status: c.status
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: {
        patient,
        history,
        documents,
        investigations,
        prescriptions,
        consultations,
        timeline,
        opdVisit,
        consent
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Doctor Profile
router.get('/me', authenticateUser, requireRole(['DOCTOR']), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
