const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const OpdVisit = require('../models/OpdVisit');
const Department = require('../models/Department');
const Patient = require('../models/Patient');
const User = require('../models/User');
const ClinicalHistory = require('../models/ClinicalHistory');
const Prescription = require('../models/Prescription');
const Consultation = require('../models/Consultation');
const { createOpConsultFhirBundle } = require('../services/fhirService');
const { authenticateUser, requireRole, createAuditLog } = require('../middleware/auth');

// Create New OPD Visit
router.post('/visits', authenticateUser, requireRole(['PATIENT']), async (req, res) => {
  try {
    const { departmentId, department: deptName, preferredLanguage, visitType, opdType, reasonForVisit } = req.body;
    
    let department = null;
    if (departmentId && mongoose.isValidObjectId(departmentId)) {
      department = await Department.findById(departmentId);
    }
    if (!department && (deptName || departmentId)) {
      const search = deptName || departmentId;
      department = await Department.findOne({ name: new RegExp('^' + search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
    }
    if (!department) {
      return res.status(400).json({ success: false, message: 'Department ID or valid department name is required' });
    }

    // 2. Verify Department is active
    if (!department.active) {
      return res.status(400).json({ success: false, message: `Department ${department.name} is currently inactive` });
    }

    // 3. Find or ensure Patient record
    let patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      const generatedAbha = `ABHA-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
      patient = await Patient.create({
        userId: req.user.id,
        name: `${req.user.firstName || 'OPD'} ${req.user.lastName || 'Patient'}`,
        abhaId: generatedAbha,
        uhid: `UHID-GH-${Date.now().toString().slice(-6)}`,
        currentStatus: 'Registered'
      });
    }

    // Generate unique OP and Token numbers
    const generatedOpNumber = `OPD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const generatedToken = `TKN-${Math.floor(100 + Math.random() * 900)}`;

    // 4. Create OPD Visit with AUTHORITATIVE clinicalMode from database
    const opdVisit = await OpdVisit.create({
      patientId: patient._id,
      userId: req.user.id,
      departmentId: department._id,
      departmentName: department.name,
      clinicalMode: department.clinicalMode, // BACKEND IS AUTHORITATIVE
      preferredLanguage: preferredLanguage || patient.preferredLanguage || 'English',
      tokenNumber: generatedToken,
      opNumber: generatedOpNumber,
      status: 'REGISTERED',
      visitType: visitType || 'New',
      opdType: opdType || (department.clinicalMode === 'AYUSH' ? 'AYUSH' : 'General OPD')
    });

    // Update patient record
    patient.department = department.name;
    patient.tokenNumber = generatedToken;
    patient.opNumber = generatedOpNumber;
    patient.currentStatus = 'Registered';
    if (reasonForVisit) {
      patient.basicHealth = patient.basicHealth || {};
      patient.basicHealth.reasonForVisit = reasonForVisit;
    }
    await patient.save();

    await createAuditLog(req.user.id, 'PATIENT', 'OPD_CREATED', 'OpdVisit', opdVisit._id);

    // Socket.io real-time broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('new-patient', {
        id: patient._id,
        visitId: opdVisit._id,
        patientId: patient._id,
        patientName: patient.name,
        abhaId: patient.abhaId,
        department: department.name,
        clinicalMode: department.clinicalMode,
        token: generatedToken,
        status: 'Registered',
        submittedAt: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'OPD visit registered successfully',
      data: opdVisit
    });
  } catch (error) {
    console.error('OPD Visit Creation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Active OPD Visit for current patient
router.get('/visits/active', authenticateUser, requireRole(['PATIENT']), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    const activeVisit = await OpdVisit.findOne({
      patientId: patient._id,
      status: { $ne: 'COMPLETED' }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: activeVisit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single visit by ID
router.get('/visits/:id', authenticateUser, async (req, res) => {
  try {
    const visit = await OpdVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'OPD Visit not found' });
    }

    // Patient can only view their own visit
    if (req.user.role === 'PATIENT' && visit.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied to other patient visit' });
    }

    res.json({ success: true, data: visit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get FHIR R4 Bundle for an OPD Visit
router.get('/visits/:id/fhir', authenticateUser, async (req, res) => {
  try {
    const visit = await OpdVisit.findById(req.params.id);
    if (!visit) return res.status(404).json({ success: false, message: 'OPD Visit not found' });

    const patient = await Patient.findById(visit.patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient record not found' });

    if (req.user.role === 'PATIENT' && visit.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied to other patient visit' });
    }

    const clinicalHistory = await ClinicalHistory.findOne({ patientId: patient._id }).sort({ createdAt: -1 });
    const consultation = await Consultation.findOne({ patientId: patient._id }).sort({ createdAt: -1 });
    const prescriptions = await Prescription.find({ patientId: patient._id }).sort({ date: -1 });

    let doctor = null;
    if (visit.doctorId) {
      doctor = await User.findById(visit.doctorId).select('name email');
    } else if (consultation?.doctorId) {
      doctor = await User.findById(consultation.doctorId).select('name email');
    }

    const bundle = createOpConsultFhirBundle({
      patient,
      opdVisit: visit,
      clinicalHistory,
      consultation,
      prescriptions,
      doctor
    });

    res.json({
      success: true,
      message: 'FHIR R4 OPConsultRecord Bundle generated successfully for OPD visit',
      data: bundle
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Validated Status Transition
router.patch('/visits/:id/status', authenticateUser, async (req, res) => {
  try {
    const { status: newStatus } = req.body;
    if (!newStatus) {
      return res.status(400).json({ success: false, message: 'New status is required' });
    }

    const visit = await OpdVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'OPD Visit not found' });
    }

    // 1. State machine check
    if (!visit.canTransitionTo(newStatus)) {
      const allowed = OpdVisit.ALLOWED_TRANSITIONS[visit.status] || [];
      return res.status(400).json({
        success: false,
        message: `Invalid state transition from "${visit.status}" to "${newStatus}". Allowed transitions: [${allowed.join(', ')}]`
      });
    }

    // 2. Role check for clinical transitions
    if (['IN_CONSULTATION', 'COMPLETED'].includes(newStatus) && req.user.role !== 'DOCTOR') {
      return res.status(403).json({ success: false, message: 'Forbidden: Clinical transitions require DOCTOR role' });
    }

    visit.status = newStatus;
    if (newStatus === 'HISTORY_IN_PROGRESS') visit.historyStartedAt = new Date();
    if (newStatus === 'HISTORY_COMPLETED') visit.historyCompletedAt = new Date();
    if (newStatus === 'IN_CONSULTATION') visit.consultationStartedAt = new Date();
    if (newStatus === 'COMPLETED') visit.completedAt = new Date();

    await visit.save();

    // Sync status to patient record
    const statusMap = {
      'REGISTERED': 'Registered',
      'WAITING': 'Waiting for Doctor',
      'HISTORY_IN_PROGRESS': 'History Collection',
      'HISTORY_COMPLETED': 'Waiting for Doctor',
      'READY_FOR_DOCTOR': 'Waiting for Doctor',
      'IN_CONSULTATION': 'In Consultation',
      'COMPLETED': 'Completed'
    };
    await Patient.findByIdAndUpdate(visit.patientId, { currentStatus: statusMap[newStatus] || newStatus });

    const io = req.app.get('io');
    if (io) {
      io.emit('patient-update', { id: visit.patientId, visitId: visit._id, status: visit.status });
    }

    res.json({
      success: true,
      message: `Status updated to ${newStatus}`,
      data: visit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
