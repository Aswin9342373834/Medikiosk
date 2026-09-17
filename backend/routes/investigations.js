const express = require('express');
const router = express.Router();
const Investigation = require('../models/Investigation');
const { authenticateUser, requireRole } = require('../middleware/auth');

// Order an investigation (Doctor)
router.post('/', authenticateUser, requireRole(['DOCTOR']), async (req, res) => {
  try {
    const { patientId, testName, category, notes } = req.body;
    const inv = await Investigation.create({
      patientId,
      doctorId: req.user.id,
      testName,
      category: category || 'Lab',
      notes,
      status: 'Ordered'
    });
    res.status(201).json({ success: true, data: inv });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get investigations for a patient
router.get('/patient/:patientId', authenticateUser, async (req, res) => {
  try {
    const invs = await Investigation.find({ patientId: req.params.patientId }).sort({ orderedDate: -1 });
    res.json({ success: true, data: invs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update investigation results
router.patch('/:id', authenticateUser, requireRole(['DOCTOR', 'ADMIN']), async (req, res) => {
  try {
    const { result, referenceRange, unit, status } = req.body;
    const inv = await Investigation.findByIdAndUpdate(
      req.params.id,
      { $set: { result, referenceRange, unit, status: status || 'Completed', completedDate: new Date() } },
      { new: true }
    );
    res.json({ success: true, data: inv });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
