const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  opdVisitId: { type: mongoose.Schema.Types.ObjectId, ref: 'OpdVisit' },
  
  purpose: { 
    type: String, 
    default: 'Clinical intake, AI-assisted history summarization, and physician OPD consultation' 
  },
  consentGiven: { type: Boolean, required: true, default: true },
  version: { type: String, default: 'v1.0-ABDM-Ready' },
  language: { type: String, default: 'English' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Consent', consentSchema);
