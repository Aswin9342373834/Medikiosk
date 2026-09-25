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
const OpdVisit = require('../models/OpdVisit');
const Consent = require('../models/Consent');
const Pharmacy = require('../models/Pharmacy');
const Prescription = require('../models/Prescription');
const digitalSignatureService = require('../services/digitalSignatureService');

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
        departments: [
          'General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics',
          'Ayurveda', 'Siddha', 'Unani'
        ]
      });
      console.log('Hospital created:', hospital.name);
    }

    // 2. Departments Seed with Authoritative clinicalMode
    const deptData = [
      {
        name: 'General Medicine',
        code: 'GEN-MED',
        clinicalMode: 'MEDICAL',
        active: true,
        hospitalId: hospital._id,
        description: 'Adult outpatient care, acute fevers, respiratory issues, and non-communicable diseases',
        activeDoctors: 6,
        waitingCount: 14,
        totalPatientsToday: 148
      },
      {
        name: 'Cardiology',
        code: 'CARDIO',
        clinicalMode: 'MEDICAL',
        active: true,
        hospitalId: hospital._id,
        description: 'Cardiovascular assessment, ischemic heart disease, hypertension, and ECG evaluation',
        activeDoctors: 3,
        waitingCount: 6,
        totalPatientsToday: 76
      },
      {
        name: 'Pediatrics',
        code: 'PEDIA',
        clinicalMode: 'MEDICAL',
        active: true,
        hospitalId: hospital._id,
        description: 'Maternal and child health, infant nutrition, developmental assessment, and immunizations',
        activeDoctors: 4,
        waitingCount: 9,
        totalPatientsToday: 95
      },
      {
        name: 'Orthopedics',
        code: 'ORTHO',
        clinicalMode: 'MEDICAL',
        active: true,
        hospitalId: hospital._id,
        description: 'Fracture management, joint disorders, trauma recovery, and bone density',
        activeDoctors: 3,
        waitingCount: 5,
        totalPatientsToday: 62
      },
      {
        name: 'Ayurveda',
        code: 'AYUR',
        clinicalMode: 'AYUSH',
        active: true,
        hospitalId: hospital._id,
        description: 'Traditional Ayurvedic clinical management, Prakriti/Agni assessment, and herbal therapy',
        activeDoctors: 2,
        waitingCount: 4,
        totalPatientsToday: 42
      },
      {
        name: 'Siddha',
        code: 'SIDDHA',
        clinicalMode: 'AYUSH',
        active: true,
        hospitalId: hospital._id,
        description: 'Traditional Siddha clinical medicine, Vatham-Pitham-Kabam diagnosis, and herbal formulations',
        activeDoctors: 2,
        waitingCount: 3,
        totalPatientsToday: 28
      },
      {
        name: 'Unani',
        code: 'UNANI',
        clinicalMode: 'AYUSH',
        active: true,
        hospitalId: hospital._id,
        description: 'Traditional Unani Tibb clinical therapy, Mizaj constitution, and holistic intake',
        activeDoctors: 2,
        waitingCount: 2,
        totalPatientsToday: 21
      }
    ];

    for (const d of deptData) {
      await Department.findOneAndUpdate({ name: d.name }, d, { upsert: true, new: true });
    }
    console.log('Departments seeded with authoritative clinicalMode.');

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
        name: 'Demo Patient (DEMO ONLY)',
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

    // 5. Seed Authoritative OpdVisit for Demo Patient
    const genMedDept = await Department.findOne({ code: 'GEN-MED' });
    const demoVisit = await OpdVisit.findOneAndUpdate(
      { patientId: patient._id },
      {
        patientId: patient._id,
        userId: patientUser._id,
        departmentId: genMedDept._id,
        departmentName: genMedDept.name,
        clinicalMode: genMedDept.clinicalMode,
        preferredLanguage: 'English',
        tokenNumber: 'TKN-104',
        opNumber: 'OPD-2026-918231',
        status: 'WAITING',
        visitType: 'New',
        opdType: 'General OPD',
        hospital: 'All India Institute of Medical Sciences (AIIMS)'
      },
      { upsert: true, new: true }
    );
    console.log('Sample OPD visit seeded (TKN-104 - WAITING).');

    // 6. Seed Consent Record
    await Consent.findOneAndUpdate(
      { patientId: patient._id },
      {
        patientId: patient._id,
        userId: patientUser._id,
        opdVisitId: demoVisit._id,
        purpose: 'Clinical intake, AI-assisted history summarization, and physician OPD consultation',
        consentGiven: true,
        version: 'v1.0-ABDM-Ready',
        language: 'English',
        timestamp: new Date()
      },
      { upsert: true, new: true }
    );
    console.log('Sample consent record seeded.');

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

    // 7. Seed Demo Pharmacies (Synthetic Demo Names & Simulated Inventory)
    const demoPharmacies = [
      {
        code: 'PHARM-DEMO-01',
        name: 'MediKiosk Demo Pharmacy 01 - Ansari Nagar (AIIMS Vicinity)',
        address: 'Gate 2, Sri Aurobindo Marg, Ansari Nagar, New Delhi',
        city: 'New Delhi',
        pincode: '110029',
        phone: '+91-11-2659-DEMO-01',
        operatingHours: '24/7 (Emergency & Outpatient)',
        rating: 4.8,
        location: {
          type: 'Point',
          coordinates: [77.2100, 28.5672] // ~0.1 km from AIIMS
        },
        isSimulated: true,
        inventory: [
          { medicineName: 'Paracetamol', brandName: 'Calpol', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 150, price: 15.0 },
          { medicineName: 'Amoxicillin', brandName: 'Mox', dosageForm: 'Capsule', strength: '500mg', inStock: true, quantity: 80, price: 65.0 },
          { medicineName: 'Amlodipine', brandName: 'Amlong', dosageForm: 'Tablet', strength: '5mg', inStock: true, quantity: 120, price: 28.0 },
          { medicineName: 'Metformin', brandName: 'Glycomet', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 200, price: 32.0 },
          { medicineName: 'Atorvastatin', brandName: 'Atorva', dosageForm: 'Tablet', strength: '20mg', inStock: true, quantity: 90, price: 85.0 },
          { medicineName: 'Pantoprazole', brandName: 'Pan-40', dosageForm: 'Tablet', strength: '40mg', inStock: true, quantity: 140, price: 45.0 },
          { medicineName: 'Cetirizine', brandName: 'Cetzine', dosageForm: 'Tablet', strength: '10mg', inStock: true, quantity: 100, price: 18.0 },
          { medicineName: 'Azithromycin', brandName: 'Azee', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 60, price: 110.0 },
          { medicineName: 'ORS Oral Rehydration Salts', brandName: 'Electral', dosageForm: 'Sachet', strength: '21.8g', inStock: true, quantity: 300, price: 22.0 }
        ]
      },
      {
        code: 'PHARM-DEMO-02',
        name: 'MediKiosk Demo Pharmacy 02 - Yusuf Sarai Market',
        address: 'Shop 14, Main Market, Yusuf Sarai, New Delhi',
        city: 'New Delhi',
        pincode: '110016',
        phone: '+91-11-2656-DEMO-02',
        operatingHours: '08:00 AM - 11:00 PM',
        rating: 4.6,
        location: {
          type: 'Point',
          coordinates: [77.2065, 28.5635] // ~0.7 km
        },
        isSimulated: true,
        inventory: [
          { medicineName: 'Paracetamol', brandName: 'Dolo', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 100, price: 16.0 },
          { medicineName: 'Amlodipine', brandName: 'Amlodac', dosageForm: 'Tablet', strength: '5mg', inStock: true, quantity: 75, price: 30.0 },
          { medicineName: 'Metformin', brandName: 'Glycomet', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 110, price: 34.0 },
          { medicineName: 'Pantoprazole', brandName: 'Pantocid', dosageForm: 'Tablet', strength: '40mg', inStock: true, quantity: 95, price: 48.0 },
          { medicineName: 'Cetirizine', brandName: 'Alerid', dosageForm: 'Tablet', strength: '10mg', inStock: true, quantity: 80, price: 20.0 }
          // Note: Amoxicillin and Atorvastatin missing here for test differentiation
        ]
      },
      {
        code: 'PHARM-DEMO-03',
        name: 'MediKiosk Demo Pharmacy 03 - Green Park Main Market',
        address: 'Plot 22, Commercial Complex, Green Park Main, New Delhi',
        city: 'New Delhi',
        pincode: '110016',
        phone: '+91-11-2651-DEMO-03',
        operatingHours: '08:30 AM - 10:30 PM',
        rating: 4.7,
        location: {
          type: 'Point',
          coordinates: [77.2050, 28.5580] // ~1.2 km
        },
        isSimulated: true,
        inventory: [
          { medicineName: 'Paracetamol', brandName: 'Crocin', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 120, price: 18.0 },
          { medicineName: 'Amoxicillin', brandName: 'Novamox', dosageForm: 'Capsule', strength: '500mg', inStock: true, quantity: 60, price: 70.0 },
          { medicineName: 'Amlodipine', brandName: 'Amlopres', dosageForm: 'Tablet', strength: '5mg', inStock: true, quantity: 85, price: 29.0 },
          { medicineName: 'Metformin', brandName: 'Obimet', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 140, price: 30.0 },
          { medicineName: 'Atorvastatin', brandName: 'Lipivas', dosageForm: 'Tablet', strength: '20mg', inStock: true, quantity: 70, price: 92.0 },
          { medicineName: 'Pantoprazole', brandName: 'Pan', dosageForm: 'Tablet', strength: '40mg', inStock: true, quantity: 110, price: 46.0 }
        ]
      },
      {
        code: 'PHARM-DEMO-04',
        name: 'MediKiosk Demo Pharmacy 04 - Safdarjung Enclave Community Centre',
        address: 'B-2/10, Community Centre, Safdarjung Enclave, New Delhi',
        city: 'New Delhi',
        pincode: '110029',
        phone: '+91-11-2610-DEMO-04',
        operatingHours: '09:00 AM - 10:00 PM',
        rating: 4.5,
        location: {
          type: 'Point',
          coordinates: [77.1985, 28.5610] // ~1.3 km
        },
        isSimulated: true,
        inventory: [
          { medicineName: 'Paracetamol', brandName: 'Calpol', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 90, price: 15.0 },
          { medicineName: 'Amlodipine', brandName: 'Amlong', dosageForm: 'Tablet', strength: '5mg', inStock: true, quantity: 60, price: 28.0 },
          { medicineName: 'Cetirizine', brandName: 'Cetzine', dosageForm: 'Tablet', strength: '10mg', inStock: true, quantity: 70, price: 19.0 },
          { medicineName: 'Pantoprazole', brandName: 'Pan-40', dosageForm: 'Tablet', strength: '40mg', inStock: true, quantity: 80, price: 45.0 }
        ]
      },
      {
        code: 'PHARM-DEMO-05',
        name: 'MediKiosk Demo Pharmacy 05 - South Extension Part 2',
        address: 'Block E-18, South Extension Part 2, Ring Road, New Delhi',
        city: 'New Delhi',
        pincode: '110049',
        phone: '+91-11-2625-DEMO-05',
        operatingHours: '24/7',
        rating: 4.9,
        location: {
          type: 'Point',
          coordinates: [77.2215, 28.5725] // ~1.5 km
        },
        isSimulated: true,
        inventory: [
          { medicineName: 'Amlodipine', brandName: 'Amlodac', dosageForm: 'Tablet', strength: '5mg', inStock: true, quantity: 130, price: 31.0 },
          { medicineName: 'Metformin', brandName: 'Glycomet', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 180, price: 33.0 },
          { medicineName: 'Atorvastatin', brandName: 'Atorlip', dosageForm: 'Tablet', strength: '20mg', inStock: true, quantity: 100, price: 88.0 },
          { medicineName: 'Pantoprazole', brandName: 'Pan-40', dosageForm: 'Tablet', strength: '40mg', inStock: true, quantity: 150, price: 45.0 },
          { medicineName: 'Azithromycin', brandName: 'Azithral', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 75, price: 115.0 }
        ]
      },
      {
        code: 'PHARM-DEMO-06',
        name: 'MediKiosk Demo Pharmacy 06 - Hauz Khas Metro',
        address: 'Near Metro Gate 3, Sri Aurobindo Marg, Hauz Khas, New Delhi',
        city: 'New Delhi',
        pincode: '110016',
        phone: '+91-11-2652-DEMO-06',
        operatingHours: '08:00 AM - 10:00 PM',
        rating: 4.4,
        location: {
          type: 'Point',
          coordinates: [77.2060, 28.5490] // ~2.1 km
        },
        isSimulated: true,
        inventory: [
          { medicineName: 'Paracetamol', brandName: 'Dolo', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 80, price: 16.0 },
          { medicineName: 'Cetirizine', brandName: 'Okacet', dosageForm: 'Tablet', strength: '10mg', inStock: true, quantity: 60, price: 18.0 },
          { medicineName: 'Amoxicillin', brandName: 'Mox', dosageForm: 'Capsule', strength: '500mg', inStock: true, quantity: 45, price: 68.0 }
        ]
      },
      {
        code: 'PHARM-DEMO-07',
        name: 'MediKiosk Demo Pharmacy 07 - Lajpat Nagar Ring Road',
        address: 'Ring Road, Near Metro Pillar 42, Lajpat Nagar IV, New Delhi',
        city: 'New Delhi',
        pincode: '110024',
        phone: '+91-11-2983-DEMO-07',
        operatingHours: '09:00 AM - 11:00 PM',
        rating: 4.6,
        location: {
          type: 'Point',
          coordinates: [77.2430, 28.5675] // ~3.4 km
        },
        isSimulated: true,
        inventory: [
          { medicineName: 'Paracetamol', brandName: 'Calpol', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 150, price: 15.0 },
          { medicineName: 'Metformin', brandName: 'Glycomet', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 160, price: 32.0 },
          { medicineName: 'Atorvastatin', brandName: 'Atorva', dosageForm: 'Tablet', strength: '20mg', inStock: true, quantity: 80, price: 86.0 }
        ]
      }
    ];

    for (const p of demoPharmacies) {
      await Pharmacy.findOneAndUpdate({ code: p.code }, p, { upsert: true, new: true });
    }
    console.log('Demo Pharmacies seeded with simulated inventory.');

    // 8. Seed Authoritative Digital Prescription for Demo Patient Ramesh Kumar
    const rxItems = [
      {
        medicine: 'Amlodipine',
        dosage: '5mg',
        frequency: 'Once daily (morning)',
        duration: '30 days',
        route: 'Oral',
        instructions: 'After breakfast'
      },
      {
        medicine: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '30 days',
        route: 'Oral',
        instructions: 'After meals'
      },
      {
        medicine: 'Atorvastatin',
        dosage: '20mg',
        frequency: 'Once daily (bedtime)',
        duration: '30 days',
        route: 'Oral',
        instructions: 'Before sleep'
      },
      {
        medicine: 'Pantoprazole',
        dosage: '40mg',
        frequency: 'Once daily (morning)',
        duration: '14 days',
        route: 'Oral',
        instructions: '30 mins before breakfast'
      }
    ];

    const rxPayload = {
      patientId: patient._id.toString(),
      doctorId: doctorUser._id.toString(),
      items: rxItems,
      diagnosis: 'Essential Hypertension & Type 2 Diabetes Mellitus with Exertional Angina',
      followUp: 'Review in Cardiology OPD after 2 weeks with repeat ECG and lipid profile',
      generalAdvice: 'Low sodium diabetic diet, daily 30 min brisk walk, avoid smoking and heavy exertion',
      status: 'Active'
    };

    const rxHash = digitalSignatureService.computeDigest(rxPayload);

    await Prescription.findOneAndUpdate(
      { patientId: patient._id, status: 'Active' },
      {
        consultationId: demoVisit._id,
        patientId: patient._id,
        doctorId: doctorUser._id,
        items: rxItems,
        followUp: rxPayload.followUp,
        generalAdvice: rxPayload.generalAdvice,
        diagnosis: rxPayload.diagnosis,
        status: 'Active',
        date: new Date(),
        digitalSignature: {
          status: 'Doctor Confirmed (PKI DSC Integration-Ready)',
          documentHash: rxHash,
          signedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );
    console.log('Sample digital prescription seeded for demo patient.');

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
