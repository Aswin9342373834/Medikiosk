const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  department: { type: String, required: true, default: 'General Medicine' },
  specialization: { type: String, default: 'General Physician' },
  roomNumber: { type: String, default: 'Room 101' },
  isAvailable: { type: Boolean, default: true },
  activeConsultationsCount: { type: Number, default: 0 },
  completedConsultationsToday: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
