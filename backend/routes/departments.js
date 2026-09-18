const express = require('express');
const router = express.Router();
const Department = require('../models/Department');

// Get active hospital departments with authoritative clinicalMode
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find({ active: true }).sort({ name: 1 });
    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get department by ID
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
