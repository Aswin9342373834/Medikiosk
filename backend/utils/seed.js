const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const Department = require('../models/Department');
const Kiosk = require('../models/Kiosk');
const ClinicalHistory = require('../models/ClinicalHistory');
const MedicalDocument = require('../models/MedicalDocument');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medikiosk';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Hospital Seed
    let hospital = await Hospital.findOne({ code: 'AIIMS-ND-01' });
    if (!hospital) {
      hospital = await Hospital.create({
        name: 'All India Institute of Medical Sciences (AIIMS)',
        code: 'AIIMS-ND-01',
        type: 'Apex Government Medical College & Hospital',
        city: 'New Delhi',
        state: 'Delhi',
        totalBeds: 2478,
        activeKiosks: 6,
        departments: ['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'AYUSH / Ayurveda']
      });
      console.log('Hospital created:', hospital.name);
    }

    // 2. Departments Seed
    const deptData = [
      { name: 'General Medicine', code: 'GEN-MED', activeDoctors: 6, waitingCount: 14, totalPatientsToday: 148 },
      { name: 'Cardiology', code: 'CARDIO', activeDoctors: 3, waitingCount: 6, totalPatientsToday: 76 },
      { name: 'Pediatrics', code: 'PEDIA', activeDoctors: 4, waitingCount: 9, totalPatientsToday: 95 },
      { name: 'Orthopedics', code: 'ORTHO', activeDoctors: 3, waitingCount: 5, totalPatientsToday: 62 },
      { name: 'AYUSH / Ayurveda', code: 'AYUSH', activeDoctors: 2, waitingCount: 4, totalPatientsToday: 42 }
    ];

    for (const d of deptData) {
      await Department.findOneAndUpdate({ name: d.name }, d, { upsert: true });
    }
    console.log('Departments seeded.');

    // 3. Kiosks Seed
    const kioskData = [
      { kioskId: 'KIOSK-OPD-01', location: 'Main Entrance - Ground Floor', department: 'General Medicine OPD', status: 'Online' },
      { kioskId: 'KIOSK-OPD-02', location: 'OPD Block B - 1st Floor', department: 'Cardiology OPD', status: 'Online' },
      { kioskId: 'KIOSK-AYUSH-01', location: 'AYUSH Wing - Room 12', department: 'AYUSH / Ayurveda', status: 'Online' },
      { kioskId: 'KIOSK-PEDIA-01', location: 'Maternal & Child Block', department: 'Pediatrics OPD', status: 'Online' }
    ];

    for (const k of kioskData) {
      await Kiosk.findOneAndUpdate({ kioskId: k.kioskId }, k, { upsert: true });
    }
    console.log('Kiosks seeded.');

    // 4. Default Demo Accounts
    const defaultPassword = await bcrypt.hash('Password123!', 10);

    // Admin
    const adminUser = await User.findOneAndUpdate(
      { email: 'admin@hospital.gov.in' },
      {
        email: 'admin@hospital.gov.in',
        password: defaultPassword,
        role: 'ADMIN',
        firstName: 'Rajesh',
        lastName: 'Verma',
        phone: '+919876543210'
      },
      { upsert: true, new: true }
    );
    console.log('Admin account ready: admin@hospital.gov.in');

    // Doctor
    const doctorUser = await User.findOneAndUpdate(
      { email: 'doctor@hospital.gov.in' },
      {
        email: 'doctor@hospital.gov.in',
        password: defaultPassword,
        role: 'DOCTOR',
        firstName: 'Ananya',
        lastName: 'Sharma',
        phone: '+919876543211'
      },
      { upsert: true, new: true }
    );

    await Doctor.findOneAndUpdate(
      { userId: doctorUser._id },
      {
        userId: doctorUser._id,
        name: 'Dr. Ananya Sharma',
        licenseNumber: 'MCI-882910',
        department: 'General Medicine',
        specialization: 'Senior Consultant Physician',
        roomNumber: 'OPD Room 104',
        isAvailable: true
      },
      { upsert: true }
    );
    console.log('Doctor account ready: doctor@hospital.gov.in');

    // Patient
    const patientUser = await User.findOneAndUpdate(
      { email: 'patient@hospital.gov.in' },
      {
        email: 'patient@hospital.gov.in',
        password: defaultPassword,
        role: 'PATIENT',
        firstName: 'Ramesh',
        lastName: 'Kumar',
        phone: '+919876543212'
      },
      { upsert: true, new: true }
    );

    const patient = await Patient.findOneAndUpdate(
      { userId: patientUser._id },
      {
        userId: patientUser._id,
        name: 'Ramesh Kumar',
        age: 52,
        gender: 'Male',
        bloodGroup: 'B+',
        abhaId: 'ABHA-9928-1102',
        uhid: 'UHID-AIIMS-481920',
        contactNumber: '+919876543212',
        address: 'Sector 4, Rohini, New Delhi',
        preferredLanguage: 'English',
        currentStatus: 'Waiting for Doctor',
        governmentScheme: {
          schemeName: 'Ayushman Bharat (PM-JAY)',
          applicationStatus: 'Verified & Active'
        }
      },
      { upsert: true, new: true }
    );
    console.log('Patient account ready: patient@hospital.gov.in');

    // Demo Clinical History for Ramesh
    const demoHistory = await ClinicalHistory.findOneAndUpdate(
      { patientId: patient._id },
      {
        patientId: patient._id,
        userId: patientUser._id,
        presentingComplaint: 'Substernal chest pressure and mild breathlessness for 2 days',
        chiefComplaint: 'Chest pain on exertion',
        historyOfPresentIllness: '52-year-old male with 2-day history of retrosternal heaviness radiating to left shoulder, aggravated by brisk walking, relieved by resting.',
        onset: '2 days ago',
        duration: '15-20 minutes episodes',
        location: 'Retrosternal / Precordial',
        character: 'Constricting / Heaviness',
        severity: 'Moderate (6/10)',
        aggravatingFactors: 'Walking uphill, climbing stairs',
        relievingFactors: 'Rest',
        associatedSymptoms: ['Mild diaphoresis', 'Exertional dyspnea'],
        pastMedicalHistory: ['Hypertension (5 years)', 'Type 2 Diabetes Mellitus (3 years)'],
        pastSurgicalHistory: ['Appendectomy (2014)'],
        medications: [
          { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily (morning)', duration: 'Ongoing', route: 'Oral', instructions: 'After food' },
          { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: 'Ongoing', route: 'Oral', instructions: 'After meals' }
        ],
        allergies: ['Penicillin (mild cutaneous rash)'],
        familyHistory: 'Father had ischemic heart disease at age 58',
        socialHistory: 'Non-smoker, occasional tea, walks 30 mins daily',
        reviewOfSystems: ['Cardiovascular: positive for chest pressure', 'Respiratory: positive for exertional dyspnea'],
        aiSummary: '52yo male with HTN and T2DM presenting with exertional retrosternal heaviness radiating to left shoulder for 2 days. Symptoms suggest possible angina pectoris. Requires urgent ECG, cardiac enzymes, and physician review.',
        redFlags: ['Potential severe acute chest pain', 'Potential severe breathing difficulty'],
        doctorAttentionItems: ['Immediate 12-lead ECG indicated', 'Assess vitals (BP, SpO2, HR)', 'Serum Troponin I/T evaluation'],
        aiStatus: 'Completed',
        doctorReviewStatus: 'Pending',
        status: 'Submitted',
        consentGiven: true,
        consentTimestamp: new Date(),
        consentVersion: 'v1.0-ABDM'
      },
      { upsert: true, new: true }
    );
    console.log('Sample clinical history seeded.');

    // Demo Released Document
    await MedicalDocument.findOneAndUpdate(
      { filename: 'Lipid_Profile_Report_AIIMS.pdf', patientId: patient._id },
      {
        patientId: patient._id,
        userId: patientUser._id,
        filename: 'Lipid_Profile_Report_AIIMS.pdf',
        fileType: 'application/pdf',
        fileSize: 245000,
        storagePath: 'uploads/demo-lipid-report.pdf',
        documentType: 'Lab Report',
        ocrStatus: 'Completed',
        ocrProvider: 'PDF Parser Active',
        ocrText: 'AIIMS BIOCHEMISTRY: Total Cholesterol: 215 mg/dL, HDL: 42 mg/dL, LDL: 142 mg/dL, Triglycerides: 185 mg/dL. Impression: Mild Dyslipidemia.',
        aiStatus: 'Completed',
        extractedData: {
          diagnoses: ['Dyslipidemia'],
          investigations: [
            { test: 'Total Cholesterol', result: '215', value: '215', unit: 'mg/dL', referenceRange: '< 200 mg/dL' },
            { test: 'LDL Cholesterol', result: '142', value: '142', unit: 'mg/dL', referenceRange: '< 100 mg/dL' }
          ],
          hospital: 'AIIMS New Delhi'
        },
        visibility: 'Released',
        reviewStatus: 'Reviewed',
        reviewedBy: doctorUser._id,
        reviewedAt: new Date()
      },
      { upsert: true }
    );

    // Demo Private Document (To test privacy workflow)
    await MedicalDocument.findOneAndUpdate(
      { filename: 'Preliminary_ECG_Trace.pdf', patientId: patient._id },
      {
        patientId: patient._id,
        userId: patientUser._id,
        filename: 'Preliminary_ECG_Trace.pdf',
        fileType: 'application/pdf',
        fileSize: 512000,
        storagePath: 'uploads/demo-ecg-trace.pdf',
        documentType: 'Imaging Report',
        ocrStatus: 'Completed',
        ocrProvider: 'PDF Parser Active',
        ocrText: '12-LEAD ECG: Sinus rhythm 74 bpm. ST depression 1mm in leads V4-V6. T-wave inversion in lead aVL. Urgent physician interpretation required.',
        aiStatus: 'Completed',
        extractedData: {
          diagnoses: ['ST depression V4-V6', 'Ischemic changes'],
          investigations: [{ test: '12-Lead ECG', result: 'ST depression V4-V6', value: 'Abnormal' }],
          hospital: 'AIIMS Emergency OPD'
        },
        visibility: 'Private', // CRITICAL: Kept private pending doctor decision!
        reviewStatus: 'Pending'
      },
      { upsert: true }
    );

    console.log('Database seeding successfully completed!');
    process.exit(0);
  } catch (err) {
    console.error('Database seeding failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
