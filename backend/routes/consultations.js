const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const { authenticateUser, requireRole, createAuditLog } = require('../middleware/auth');

// Start or Update Consultation
router.post('/start', authenticateUser, requireRole(['DOCTOR']), async (req, res) => {
  try {
    const { patientId, department } = req.body;
    let consultation = await Consultation.findOne({
      patientId,
      status: { $in: ['WAITING', 'IN_PROGRESS'] }
    });

    if (!consultation) {
      consultation = await Consultation.create({
        patientId,
        doctorId: req.user.id,
        department: department || 'General Medicine',
        status: 'IN_PROGRESS'
      });
    } else {
      consultation.status = 'IN_PROGRESS';
      await consultation.save();
    }

    // Update patient status
    await Patient.findByIdAndUpdate(patientId, { currentStatus: 'In Consultation' });
    await createAuditLog(req.user.id, 'DOCTOR', 'CONSULTATION_STARTED', 'Consultation', consultation._id);

    const io = req.app.get('io');
    if (io) {
      io.emit('patient-update', { id: patientId, status: 'In Consultation' });
    }

    res.json({ success: true, data: consultation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Complete Consultation
router.post('/complete', authenticateUser, requireRole(['DOCTOR']), async (req, res) => {
  try {
    const { patientId, clinicalAssessment, clinicalImpression, diagnosis, doctorNotes, treatmentPlan, followUpInstructions } = req.body;

    let consultation = await Consultation.findOne({
      patientId,
      status: { $in: ['WAITING', 'IN_PROGRESS'] }
    });

    if (!consultation) {
      consultation = new Consultation({
        patientId,
        doctorId: req.user.id
      });
    }

    consultation.clinicalAssessment = clinicalAssessment;
    consultation.clinicalImpression = clinicalImpression;
    consultation.diagnosis = diagnosis;
    consultation.doctorNotes = doctorNotes;
    consultation.treatmentPlan = treatmentPlan;
    consultation.followUpInstructions = followUpInstructions;
    consultation.status = 'COMPLETED';
    consultation.completedAt = new Date();
    await consultation.save();

    // Update patient status to Completed
    const patient = await Patient.findByIdAndUpdate(patientId, { currentStatus: 'Completed' }, { new: true });
    await createAuditLog(req.user.id, 'DOCTOR', 'CONSULTATION_COMPLETED', 'Consultation', consultation._id);

    // Notify patient
    if (patient) {
      await Notification.create({
        userId: patient.userId,
        recipientRole: 'PATIENT',
        title: 'Consultation Completed',
        message: `Your consultation with the doctor is completed. Assessment: ${diagnosis || 'Review complete'}.`,
        type: 'Info',
        actionUrl: '/patient/records'
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('consultation-completed', { patientId, consultationId: consultation._id });
      io.emit('patient-update', { id: patientId, status: 'Completed' });
    }

    res.json({ success: true, data: consultation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get consultations for a patient
router.get('/patient/:patientId', authenticateUser, async (req, res) => {
  try {
    const consultations = await Consultation.find({ patientId: req.params.patientId }).sort({ consultationDate: -1 });
    res.json({ success: true, data: consultations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
