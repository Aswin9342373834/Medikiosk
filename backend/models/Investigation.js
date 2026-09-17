const mongoose = require('mongoose');

const investigationSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  testName: { type: String, required: true },
  category: { type: String, enum: ['Lab', 'Imaging', 'Pathology', 'Cardiology', 'Other'], default: 'Lab' },
  status: { type: String, enum: ['Ordered', 'In Progress', 'Completed', 'Cancelled'], default: 'Ordered' },
  result: String,
  unit: String,
  referenceRange: String,
  notes: String,
  orderedDate: { type: Date, default: Date.now },
  completedDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Investigation', investigationSchema);
