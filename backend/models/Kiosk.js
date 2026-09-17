const mongoose = require('mongoose');

const kioskSchema = new mongoose.Schema({
  kioskId: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  department: { type: String, default: 'General Medicine OPD' },
  status: { type: String, enum: ['Online', 'Offline', 'Maintenance'], default: 'Online' },
  ipAddress: { type: String, default: '192.168.1.101' },
  lastPing: { type: Date, default: Date.now },
  currentSession: {
    patientName: String,
    step: Number,
    startedAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Kiosk', kioskSchema);
