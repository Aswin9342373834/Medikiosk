const express = require('express');
const router = express.Router();
const { authenticateUser, requireRole } = require('../middleware/auth');
const Patient = require('../models/Patient');
const MedicalDocument = require('../models/MedicalDocument');
const ClinicalHistory = require('../models/ClinicalHistory');
const Prescription = require('../models/Prescription');

router.get('/my-records', authenticateUser, requireRole(['PATIENT']), async (req, res) => {
  try {
    const user = req.user;
    const patient = await Patient.findOne({ userId: user.id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });

    // Fetch ONLY released documents
    const documents = await MedicalDocument.find({ 
      patientId: patient._id, 
      visibility: 'Released' 
    }).sort({ uploadedAt: -1 });

    const history = await ClinicalHistory.findOne({ patientId: patient._id }).sort({ createdAt: -1 });
    const prescriptions = await Prescription.find({ patientId: patient._id }).sort({ date: -1 });

    res.json({ 
      success: true, 
      data: {
        patient: patient,
        history: history,
        documents: documents,
        prescriptions: prescriptions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
