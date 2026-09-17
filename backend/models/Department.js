const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  headOfDepartment: { type: String },
  activeDoctors: { type: Number, default: 4 },
  waitingCount: { type: Number, default: 0 },
  totalPatientsToday: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
