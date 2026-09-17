const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  items: [{
    medicine: { type: String, required: true },
    dosage: { type: String, required: true }, // e.g. 500mg
    frequency: { type: String, required: true }, // e.g. 1-0-1 or Twice daily
    duration: { type: String, required: true }, // e.g. 5 days
    route: { type: String, default: 'Oral' }, // Oral, Topical, IV, etc.
    instructions: { type: String, default: 'After food' } // Before food, After food
  }],
  
  followUp: { type: String }, // e.g. 'After 1 week'
  generalAdvice: { type: String },
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
