const mongoose = require('mongoose');

const opdVisitSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  departmentName: { type: String, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Authoritative clinical mode derived from Department
  clinicalMode: { 
    type: String, 
    enum: ['MEDICAL', 'AYUSH'], 
    required: true, 
    default: 'MEDICAL' 
  },
  
  preferredLanguage: { 
    type: String, 
    enum: ['English', 'Tamil', 'Hindi', 'Telugu'], 
    default: 'English' 
  },
  
  tokenNumber: { type: String, required: true },
  opNumber: { type: String, required: true },
  
  // OPD Visit Lifecycle States
  status: {
    type: String,
    enum: [
      'NEW',
      'REGISTERED',
      'WAITING',
      'HISTORY_IN_PROGRESS',
      'HISTORY_COMPLETED',
      'DOCUMENT_REVIEW',
      'READY_FOR_DOCTOR',
      'IN_CONSULTATION',
      'COMPLETED'
    ],
    default: 'REGISTERED'
  },
  
  visitType: { type: String, enum: ['New', 'Follow-up'], default: 'New' },
  opdType: { type: String, enum: ['General OPD', 'Specialty Clinic', 'AYUSH'], default: 'General OPD' },
  hospital: { type: String, default: 'All India Institute of Medical Sciences (AIIMS)' },
  
  // Timestamps for operational KPIs
  registeredAt: { type: Date, default: Date.now },
  historyStartedAt: { type: Date },
  historyCompletedAt: { type: Date },
  consultationStartedAt: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true });

// Transition Map for state transitions
opdVisitSchema.statics.ALLOWED_TRANSITIONS = {
  'NEW': ['REGISTERED'],
  'REGISTERED': ['WAITING'],
  'WAITING': ['HISTORY_IN_PROGRESS', 'READY_FOR_DOCTOR'],
  'HISTORY_IN_PROGRESS': ['HISTORY_COMPLETED', 'WAITING'],
  'HISTORY_COMPLETED': ['READY_FOR_DOCTOR', 'DOCUMENT_REVIEW'],
  'DOCUMENT_REVIEW': ['READY_FOR_DOCTOR'],
  'READY_FOR_DOCTOR': ['IN_CONSULTATION'],
  'IN_CONSULTATION': ['COMPLETED', 'READY_FOR_DOCTOR'],
  'COMPLETED': []
};

opdVisitSchema.methods.canTransitionTo = function(newStatus) {
  const allowed = opdVisitSchema.statics.ALLOWED_TRANSITIONS[this.status] || [];
  return allowed.includes(newStatus);
};

module.exports = mongoose.model('OpdVisit', opdVisitSchema);
