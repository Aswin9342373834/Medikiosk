const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'All India Institute of Medical Sciences (AIIMS)' },
  code: { type: String, required: true, unique: true, default: 'AIIMS-ND-01' },
  type: { type: String, default: 'Apex Government Medical College & Hospital' },
  state: { type: String, default: 'Delhi' },
  city: { type: String, default: 'New Delhi' },
  totalBeds: { type: Number, default: 2478 },
  activeKiosks: { type: Number, default: 12 },
  departments: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Hospital', hospitalSchema);
