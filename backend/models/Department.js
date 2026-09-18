const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  clinicalMode: {
    type: String,
    enum: ['MEDICAL', 'AYUSH'],
    default: 'MEDICAL',
    required: true
  },
  active: { type: Boolean, default: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  description: { type: String },
  headOfDepartment: { type: String },
  activeDoctors: { type: Number, default: 4 },
  waitingCount: { type: Number, default: 0 },
  totalPatientsToday: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
