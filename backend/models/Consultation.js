const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, default: 'General Medicine' },
  
  clinicalAssessment: { type: String },
  clinicalImpression: { type: String },
  diagnosis: { type: String },
  doctorNotes: { type: String },
  
  treatmentPlan: { type: String },
  followUpInstructions: { type: String },
  
  status: { 
    type: String, 
    enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED'],
    default: 'WAITING'
  },
  consultationDate: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Consultation', consultationSchema);
