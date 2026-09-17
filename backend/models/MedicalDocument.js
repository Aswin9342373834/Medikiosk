const mongoose = require('mongoose');

const medicalDocumentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  filename: { type: String, required: true },
  fileType: { type: String },
  fileSize: { type: Number },
  storagePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  
  documentType: { 
    type: String, 
    enum: ['Prescription', 'Lab Report', 'Discharge Summary', 'Imaging Report', 'Other'],
    default: 'Other'
  },
  
  // OCR processing state
  ocrStatus: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Provider Not Configured', 'OCR provider not configured'],
    default: 'Pending'
  },
  ocrProvider: { type: String, default: 'Development OCR mode' },
  ocrText: { type: String, default: '' },
  
  // AI extraction state
  aiStatus: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Skipped'],
    default: 'Pending'
  },
  extractedData: {
    diagnoses: [String],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String
    }],
    investigations: [{
      test: String,
      result: String,
      value: String,
      unit: String,
      referenceRange: String,
      date: Date
    }],
    procedures: [String],
    hospital: String,
    doctor: String,
    date: Date
  },
  
  // Doctor review and report visibility (MANDATORY ACCESS CONTROL)
  reviewStatus: { 
    type: String, 
    enum: ['Pending', 'Reviewed', 'Rejected'],
    default: 'Pending'
  },
  visibility: { 
    type: String, 
    enum: ['Private', 'Released'],
    default: 'Private' // Secure by default: patient cannot view until doctor releases
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('MedicalDocument', medicalDocumentSchema);
