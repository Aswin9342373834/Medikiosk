const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, required: true },
  action: { 
    type: String, 
    required: true,
    enum: [
      'PATIENT_CREATED',
      'HISTORY_SUBMITTED',
      'DOCUMENT_UPLOADED',
      'AI_PROCESSING_STARTED',
      'AI_PROCESSING_COMPLETED',
      'AI_PROCESSING_FAILED',
      'DOCTOR_VIEWED_DOCUMENT',
      'DOCUMENT_RELEASED',
      'DOCUMENT_MARKED_PRIVATE',
      'PRESCRIPTION_CREATED',
      'CONSULTATION_STARTED',
      'CONSULTATION_COMPLETED',
      'USER_LOGIN',
      'ACCESS_DENIED'
    ]
  },
  resource: { type: String, required: true }, // 'ClinicalHistory', 'MedicalDocument', 'Prescription', etc.
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  result: { type: String, enum: ['Success', 'Failure'], default: 'Success' },
  details: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
