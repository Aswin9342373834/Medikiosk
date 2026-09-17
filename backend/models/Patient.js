const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  abhaId: { type: String, required: true, unique: true },
  uhid: { type: String },
  name: { type: String, required: true },
  age: { type: Number },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
  bloodGroup: { type: String },
  contactNumber: { type: String },
  address: { type: String },
  preferredLanguage: { type: String, default: 'English', enum: ['English', 'Tamil', 'Hindi', 'Telugu'] },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  insuranceDetails: {
    provider: String,
    policyNumber: String,
    coverageStatus: { type: String, default: 'Active' }
  },
  governmentScheme: {
    schemeName: { type: String, default: 'Ayushman Bharat (PM-JAY)' },
    applicationStatus: { type: String, default: 'Enrolled' }
  },
  currentStatus: { 
    type: String, 
    enum: ['Registered', 'History Collection', 'Waiting for Doctor', 'In Consultation', 'Completed'],
    default: 'Registered'
  },
  tokenNumber: { type: String },
  opNumber: { type: String },
  department: { type: String, default: 'General Medicine' },
  opdType: { type: String, enum: ['General OPD', 'Specialty OPD'], default: 'General OPD' },
  visitType: { type: String, enum: ['New', 'Follow-up'], default: 'New' },
  hospital: { type: String, default: 'Government Medical College & Hospital' },
  addressDetails: {
    address: String,
    villageArea: String,
    district: String,
    state: String,
    pincode: String
  },
  basicHealth: {
    reasonForVisit: String,
    existingConditions: [String],
    currentMedications: String,
    allergies: [String]
  },
  vitals: {
    bp: { type: String, default: '120/80 mmHg' },
    pulse: { type: String, default: '72 bpm' },
    temp: { type: String, default: '98.4 F' },
    spo2: { type: String, default: '99%' },
    weight: { type: String, default: '65 kg' },
    height: { type: String, default: '168 cm' }
  },
  admissions: [{
    admissionDate: { type: Date, default: Date.now },
    dischargeDate: Date,
    ward: String,
    bed: String,
    reason: String,
    status: { type: String, enum: ['Admitted', 'Discharged', 'Transferred'], default: 'Discharged' }
  }],
  medicationReminders: [{
    medicine: String,
    time: String,
    dosage: String,
    active: { type: Boolean, default: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
