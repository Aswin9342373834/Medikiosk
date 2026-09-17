const mongoose = require('mongoose');

const clinicalHistorySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Core clinical symptoms
  presentingComplaint: { type: String, required: true },
  chiefComplaint: { type: String },
  historyOfPresentIllness: { type: String },
  onset: { type: String },
  duration: { type: String },
  location: { type: String },
  character: { type: String },
  severity: { type: String }, // e.g. 1-10 or Mild/Moderate/Severe
  aggravatingFactors: { type: String },
  relievingFactors: { type: String },
  associatedSymptoms: [String],
  
  // Historical context
  pastMedicalHistory: [String],
  pastSurgicalHistory: [String],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    route: String,
    instructions: String
  }],
  allergies: [String],
  familyHistory: { type: String },
  personalHistory: { type: String },
  socialHistory: { type: String },
  reviewOfSystems: [String],
  
  // AYUSH / Ayurveda History Mode
  ayushMode: { type: Boolean, default: false },
  ayushData: {
    // Ayurvedic clinical diagnostic parameters
    prakriti: String,
    vikriti: String,
    agni: String,
    koshtha: String,
    sara: String,
    samhanana: String,
    pramana: String,
    satmya: String,
    sattva: String,
    aharaShakti: String,
    vyayamaShakti: String,
    vaya: String,
    // Ayurvedic etiology & lifestyle
    ahara: String,
    vihara: String,
    nidana: String,
    samprapti: String
  },
  
  // AI-Assisted Clinical Summary (Draft - Requires Doctor Review)
  aiSummary: { type: String },
  aiSummaryStructured: { type: mongoose.Schema.Types.Mixed },
  redFlags: [String],
  doctorAttentionItems: [String],
  aiStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Unavailable'],
    default: 'Pending'
  },
  aiError: { type: String },
  
  // Doctor Verification
  doctorReviewStatus: {
    type: String,
    enum: ['Pending', 'Accepted', 'Edited', 'Rejected'],
    default: 'Pending'
  },
  doctorNotes: { type: String },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Workflow Status
  status: { 
    type: String, 
    enum: ['Not Started', 'In Progress', 'Submitted', 'Doctor Reviewed', 'Confirmed'],
    default: 'Submitted'
  },
  
  // Consent
  consentGiven: { type: Boolean, required: true, default: true },
  consentTimestamp: { type: Date, default: Date.now },
  consentVersion: { type: String, default: 'v1.0-ABDM-Ready' }
}, { timestamps: true });

module.exports = mongoose.model('ClinicalHistory', clinicalHistorySchema);
