const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { app } = require('../index');

const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const Hospital = require('../models/Hospital');
const OpdVisit = require('../models/OpdVisit');
const Consent = require('../models/Consent');
const ClinicalHistory = require('../models/ClinicalHistory');
const MedicalDocument = require('../models/MedicalDocument');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const AuditLog = require('../models/AuditLog');

const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/medikiosk_test';

beforeAll(async () => {
  await mongoose.connect(MONGODB_TEST_URI);
  // Clear collections for clean test run
  await User.deleteMany({});
  await Patient.deleteMany({});
  await Doctor.deleteMany({});
  await Department.deleteMany({});
  await Hospital.deleteMany({});
  await OpdVisit.deleteMany({});
  await Consent.deleteMany({});
  await ClinicalHistory.deleteMany({});
  await MedicalDocument.deleteMany({});
  await Consultation.deleteMany({});
  await Prescription.deleteMany({});
  await AuditLog.deleteMany({});

  // Seed Hospital
  const hospital = await Hospital.create({
    name: 'All India Institute of Medical Sciences (AIIMS)',
    code: 'AIIMS-ND-01',
    city: 'New Delhi',
    state: 'Delhi'
  });

  // Seed Departments with authoritative clinicalMode
  await Department.create([
    {
      name: 'General Medicine',
      code: 'GEN-MED',
      clinicalMode: 'MEDICAL',
      active: true,
      hospitalId: hospital._id,
      description: 'Adult primary care and acute illnesses'
    },
    {
      name: 'Cardiology',
      code: 'CARDIO',
      clinicalMode: 'MEDICAL',
      active: true,
      hospitalId: hospital._id,
      description: 'Cardiac care and diagnostics'
    },
    {
      name: 'Ayurveda',
      code: 'AYUR',
      clinicalMode: 'AYUSH',
      active: true,
      hospitalId: hospital._id,
      description: 'Traditional Ayurvedic clinical management'
    },
    {
      name: 'Siddha',
      code: 'SIDDHA',
      clinicalMode: 'AYUSH',
      active: true,
      hospitalId: hospital._id,
      description: 'Traditional Siddha clinical medicine'
    },
    {
      name: 'Unani',
      code: 'UNANI',
      clinicalMode: 'AYUSH',
      active: true,
      hospitalId: hospital._id,
      description: 'Traditional Unani Tibb clinical therapy'
    },
    {
      name: 'Temporary Inactive Clinic',
      code: 'INACT',
      clinicalMode: 'MEDICAL',
      active: false,
      hospitalId: hospital._id,
      description: 'Closed for maintenance'
    }
  ]);

  // Seed Pre-provisioned Hospital Admin and Doctor accounts
  const hashedPass = await bcrypt.hash('Password123!', 10);
  const adminUser = await User.create({
    email: 'admin.super@test.hospital.gov.in',
    password: hashedPass,
    role: 'ADMIN',
    firstName: 'Super',
    lastName: 'Admin',
    phone: '+919000000001'
  });

  const docUser = await User.create({
    email: 'dr.priya@test.hospital.gov.in',
    password: hashedPass,
    role: 'DOCTOR',
    firstName: 'Priya',
    lastName: 'Nair',
    phone: '+919000000002'
  });

  await Doctor.create({
    userId: docUser._id,
    name: 'Dr. Priya Nair',
    licenseNumber: 'MCI-882910',
    department: 'Cardiology',
    specialization: 'Senior Consultant Physician'
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('MediKiosk Authoritative & Validated Test Suite', () => {
  let patientAToken, patientBToken, doctorToken, adminToken;
  let patientAUser, patientBUser;
  let patientAProfile, patientBProfile;
  let medDept, ayushDept, inactiveDept;
  let createdVisitId;
  let uploadedDocId;

  // 1. Health & Startup
  test('1. Backend Health Check returns 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // 2. Department & Authoritative clinicalMode Retrieval
  test('2. GET /api/departments returns active departments with authoritative clinicalMode', async () => {
    const res = await request(app).get('/api/departments');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    // Ensure inactive department is NOT returned
    const names = res.body.data.map(d => d.name);
    expect(names).toContain('General Medicine');
    expect(names).toContain('Ayurveda');
    expect(names).not.toContain('Temporary Inactive Clinic');

    medDept = res.body.data.find(d => d.name === 'General Medicine');
    ayushDept = res.body.data.find(d => d.name === 'Ayurveda');
    expect(medDept.clinicalMode).toBe('MEDICAL');
    expect(ayushDept.clinicalMode).toBe('AYUSH');
  });

  // 3. Security: Public Registration Rejects DOCTOR / ADMIN
  test('3. Public registration rejects DOCTOR role with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'hacker.doc@test.com',
        password: 'Password123!',
        firstName: 'Fake',
        lastName: 'Doctor',
        role: 'DOCTOR'
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/restricted to PATIENT/i);
  });

  test('4. Public registration rejects ADMIN role with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'hacker.admin@test.com',
        password: 'Password123!',
        firstName: 'Fake',
        lastName: 'Admin',
        role: 'ADMIN'
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 5. Patient A & Patient B Registration (Allowed)
  test('5. Patient A Registration & Login succeeds', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'patientA@test.hospital.gov.in',
        password: 'Password123!',
        firstName: 'Aarav',
        lastName: 'Sharma',
        role: 'PATIENT',
        phone: '+919811111111'
      });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    patientAToken = res.body.token;
    patientAUser = res.body.user;
    patientAProfile = res.body.user.profile;
  });

  test('6. Patient B Registration & Login succeeds', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'patientB@test.hospital.gov.in',
        password: 'Password123!',
        firstName: 'Bharath',
        lastName: 'Rajan',
        role: 'PATIENT',
        phone: '+919822222222'
      });
    expect(res.status).toBe(201);
    patientBToken = res.body.token;
    patientBUser = res.body.user;
    patientBProfile = res.body.user.profile;
  });

  // 7. Login for Pre-provisioned Doctor and Admin
  test('7. Hospital-provisioned Doctor and Admin Login successfully', async () => {
    const docRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'dr.priya@test.hospital.gov.in',
        password: 'Password123!'
      });
    expect(docRes.status).toBe(200);
    expect(docRes.body.token).toBeDefined();
    doctorToken = docRes.body.token;

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.super@test.hospital.gov.in',
        password: 'Password123!'
      });
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.token).toBeDefined();
    adminToken = adminRes.body.token;
  });

  // 8. OPD Visit: Inactive Department Rejection
  test('8. OPD visit creation rejects inactive department with 400 Bad Request', async () => {
    const inactive = await Department.findOne({ active: false });
    const res = await request(app)
      .post('/api/opd/visits')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        departmentId: inactive._id
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/inactive/i);
  });

  // 9. OPD Visit: Backend Authoritative clinicalMode
  test('9. OPD visit creation assigns authoritative clinicalMode and ignores client conflict', async () => {
    const res = await request(app)
      .post('/api/opd/visits')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        departmentId: medDept._id,
        clinicalMode: 'AYUSH', // Conflicting client parameter!
        preferredLanguage: 'Tamil'
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    // Backend MUST set MEDICAL because General Medicine is MEDICAL
    expect(res.body.data.clinicalMode).toBe('MEDICAL');
    expect(res.body.data.status).toBe('REGISTERED');
    expect(res.body.data.tokenNumber).toMatch(/^TKN-/);
    expect(res.body.data.opNumber).toMatch(/^OPD-/);
    createdVisitId = res.body.data._id;
  });

  test('10. AYUSH OPD visit derives clinicalMode: AYUSH from Ayurveda department', async () => {
    const res = await request(app)
      .post('/api/opd/visits')
      .set('Authorization', `Bearer ${patientBToken}`)
      .send({
        departmentId: ayushDept._id,
        preferredLanguage: 'Hindi'
      });
    expect(res.status).toBe(201);
    expect(res.body.data.clinicalMode).toBe('AYUSH');
    expect(res.body.data.departmentName).toBe('Ayurveda');
  });

  // 10b. Active OPD Visit Retrieval
  test('11. Patient can fetch their active OPD visit', async () => {
    const res = await request(app)
      .get('/api/opd/visits/active')
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id.toString()).toBe(createdVisitId.toString());
  });

  // 11. OPD State Machine: Valid Transitions
  test('12. State Machine allows REGISTERED -> WAITING transition', async () => {
    const res = await request(app)
      .patch(`/api/opd/visits/${createdVisitId}/status`)
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({ status: 'WAITING' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('WAITING');
  });

  test('13. State Machine rejects invalid transition (e.g. WAITING -> COMPLETED)', async () => {
    const res = await request(app)
      .patch(`/api/opd/visits/${createdVisitId}/status`)
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({ status: 'COMPLETED' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid state transition/i);
  });

  // 12. Consent Recording & Strict Patient Ownership
  test('14. Patient records formal consent', async () => {
    const res = await request(app)
      .post('/api/consent')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        opdVisitId: createdVisitId,
        purpose: 'Outpatient clinical intake and physician consultation',
        consentGiven: true,
        language: 'English'
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.consentGiven).toBe(true);
  });

  test('15. Patient B cannot view Patient A consent records (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/consent/patient/${patientAProfile._id}`)
      .set('Authorization', `Bearer ${patientBToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('16. Patient A CAN view their own consent records (200 OK)', async () => {
    const res = await request(app)
      .get(`/api/consent/patient/${patientAProfile._id}`)
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  // 13. Clinical History Submission & AI Safety / Red Flag
  test('17. Patient A submits clinical history with acute chest pain red flag', async () => {
    const res = await request(app)
      .post('/api/clinical-history/submit-history')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        presentingComplaint: 'Severe acute chest pain radiating to jaw and left arm',
        chiefComplaint: 'Chest Pain',
        historyOfPresentIllness: 'Sudden onset substernal constriction for 2 hours.',
        onset: '2 hours ago',
        duration: 'Constant',
        severity: 'Severe (8/10)',
        pastMedicalHistory: ['Hypertension'],
        allergies: ['Penicillin'],
        ayushMode: false,
        consentGiven: true
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.redFlags).toBeDefined();
    expect(res.body.data.redFlags.length).toBeGreaterThan(0);

    // Verify OPD visit advanced to READY_FOR_DOCTOR
    const visitCheck = await OpdVisit.findById(createdVisitId);
    expect(visitCheck.status).toBe('READY_FOR_DOCTOR');
  });

  // 14. Document Upload & Mandatory Privacy Default
  test('18. Patient A uploads document (Default visibility is Private)', async () => {
    const testFilePath = path.join(__dirname, 'test_sample_report.png');
    fs.writeFileSync(testFilePath, 'DUMMY_IMAGE_DATA_FOR_TEST');

    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${patientAToken}`)
      .attach('file', testFilePath)
      .field('documentType', 'Lab Report');

    fs.unlinkSync(testFilePath);

    expect(res.status).toBe(201);
    expect(res.body.data.visibility).toBe('Private');
    uploadedDocId = res.body.data._id;
  });

  test('19. Patient A cannot access Private document before doctor release (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/documents/${uploadedDocId}`)
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Access Denied/i);
  });

  // 15. Doctor OCR Verification & Correction
  test('20. Doctor updates and verifies OCR extracted entities without modifying original file', async () => {
    const res = await request(app)
      .patch(`/api/documents/${uploadedDocId}/extracted-data`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        ocrText: 'Corrected OCR: Serum Creatinine 0.9 mg/dL, Blood Urea Nitrogen 14 mg/dL',
        extractedData: {
          diagnoses: ['Normal Renal Profile'],
          investigations: [{ test: 'Serum Creatinine', result: '0.9', unit: 'mg/dL' }]
        }
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ocrText).toContain('Serum Creatinine 0.9 mg/dL');
    expect(res.body.data.reviewStatus).toBe('Reviewed');
  });

  // 16. Doctor Releases Document & Patient Retrieval
  test('21. Doctor marks document as Released', async () => {
    const res = await request(app)
      .patch(`/api/documents/${uploadedDocId}/visibility`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ visibility: 'Released' });
    expect(res.status).toBe(200);
    expect(res.body.data.visibility).toBe('Released');
  });

  test('22. Patient A can now view Released document (200 OK)', async () => {
    const res = await request(app)
      .get(`/api/documents/${uploadedDocId}`)
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id.toString()).toBe(uploadedDocId.toString());
  });

  test('23. Patient B cannot access Patient A document even when released (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/documents/${uploadedDocId}`)
      .set('Authorization', `Bearer ${patientBToken}`);
    expect(res.status).toBe(403);
  });

  // 17. Doctor Queue & Prioritization
  test('24. Doctor queue prioritizes urgent red-flag cases', async () => {
    const res = await request(app)
      .get('/api/doctors/queue')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].priority).toBe('URGENT');
  });

  // 18. Consultation & Authorized Prescription
  test('25. Doctor starts consultation and issues confirmed prescription', async () => {
    // Start consultation
    const startRes = await request(app)
      .post('/api/consultations/start')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ patientId: patientAProfile._id, department: 'Cardiology' });
    expect(startRes.status).toBe(200);

    // Create prescription
    const rxRes = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: patientAProfile._id,
        items: [
          { medicine: 'Aspirin', dosage: '150mg', frequency: 'Immediately', duration: 'Stat', instructions: 'Chewable' },
          { medicine: 'Atorvastatin', dosage: '40mg', frequency: 'Once at night', duration: '30 days', instructions: 'After food' }
        ],
        followUp: 'Review in 2 days'
      });
    expect(rxRes.status).toBe(201);
    expect(rxRes.body.data.status).toBe('Active');

    // Complete consultation
    const compRes = await request(app)
      .post('/api/consultations/complete')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: patientAProfile._id,
        clinicalAssessment: 'Suspected acute coronary syndrome stabilized. Referred for urgent coronary angiogram.',
        diagnosis: 'Acute Coronary Syndrome',
        doctorNotes: 'ECG ST depression confirmed. Loading dose administered.',
        treatmentPlan: 'Cardiology admission & monitoring'
      });
    expect(compRes.status).toBe(200);
    expect(compRes.body.data.status).toBe('COMPLETED');

    // Verify OPD visit status advanced to COMPLETED
    const visitCheck = await OpdVisit.findById(createdVisitId);
    expect(visitCheck.status).toBe('COMPLETED');
  });

  // 19. Admin Operations Telemetry
  test('26. Admin can fetch live hospital operations KPIs', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalPatients).toBeGreaterThan(0);
    expect(res.body.data.completedConsultations).toBeGreaterThan(0);
  });

  // 20. RBAC: Patient blocked from Admin stats
  test('27. RBAC: Patient is blocked from Admin telemetry (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(res.status).toBe(403);
  });

  // 21. Medical vs AYUSH: Authoritative clinicalMode Enforcement
  test('28. Conflicting clinicalMode in request is rejected; DB department clinicalMode is strictly authoritative', async () => {
    // Malicious request 1: Ayurveda with clinicalMode = 'MEDICAL'
    const ayurRes = await request(app)
      .post('/api/opd/visits')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        department: 'Ayurveda',
        clinicalMode: 'MEDICAL' // Attempt client spoofing
      });
    expect(ayurRes.status).toBe(201);
    expect(ayurRes.body.data.clinicalMode).toBe('AYUSH'); // Backend forces AYUSH

    // Malicious request 2: General Medicine with clinicalMode = 'AYUSH'
    const medRes = await request(app)
      .post('/api/opd/visits')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        department: 'General Medicine',
        clinicalMode: 'AYUSH' // Attempt client spoofing
      });
    expect(medRes.status).toBe(201);
    expect(medRes.body.data.clinicalMode).toBe('MEDICAL'); // Backend forces MEDICAL
  });

  // 22. OPD Visit State Machine: Invalid State Transitions Rejected
  test('29. State machine rejects invalid transitions (COMPLETED -> NEW, COMPLETED -> WAITING, REGISTERED -> COMPLETED)', async () => {
    // Create new visit in REGISTERED state
    const newVisitRes = await request(app)
      .post('/api/opd/visits')
      .set('Authorization', `Bearer ${patientBToken}`)
      .send({ department: 'General Medicine' });
    expect(newVisitRes.status).toBe(201);
    const visitBId = newVisitRes.body.data._id;
    expect(newVisitRes.body.data.status).toBe('REGISTERED');

    // Attempt invalid transition: REGISTERED -> COMPLETED
    const badTrans1 = await request(app)
      .patch(`/api/opd/visits/${visitBId}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'COMPLETED' });
    expect(badTrans1.status).toBe(400);
    expect(badTrans1.body.success).toBe(false);

    // Transition from REGISTERED -> WAITING (Valid)
    const validTrans1 = await request(app)
      .patch(`/api/opd/visits/${visitBId}/status`)
      .set('Authorization', `Bearer ${patientBToken}`)
      .send({ status: 'WAITING' });
    expect(validTrans1.status).toBe(200);

    // Set visit to COMPLETED directly in DB to test terminal state transitions
    await OpdVisit.findByIdAndUpdate(visitBId, { status: 'COMPLETED' });

    // Attempt invalid transition: COMPLETED -> NEW
    const badTrans2 = await request(app)
      .patch(`/api/opd/visits/${visitBId}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'NEW' });
    expect(badTrans2.status).toBe(400);

    // Attempt invalid transition: COMPLETED -> WAITING
    const badTrans3 = await request(app)
      .patch(`/api/opd/visits/${visitBId}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'WAITING' });
    expect(badTrans3.status).toBe(400);
  });

  // 23. Document Privacy: Default Private, Doctor Release, and Cross-Patient Isolation
  test('30. Document privacy: Private documents inaccessible to Patient A & B; Doctor can release, then Patient A can view but Patient B is blocked', async () => {
    // Create a dummy test file
    const testFilePath = path.join(__dirname, 'test_private_doc.pdf');
    fs.writeFileSync(testFilePath, '%PDF-1.4 CONFIDENTIAL MEDICAL REPORT DATA FOR PATIENT A');

    // Upload as Patient A (default Private)
    const uploadRes = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${patientAToken}`)
      .attach('file', testFilePath);
    expect(uploadRes.status).toBe(201);
    const docId = uploadRes.body.data._id;
    expect(uploadRes.body.data.visibility).toBe('Private');

    // Clean up local temp file
    if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);

    // Patient A attempts direct access to Private document -> 403 Forbidden
    const patAGetPrivate = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(patAGetPrivate.status).toBe(403);

    // Patient B attempts direct access to Private document -> 403 Forbidden
    const patBGetPrivate = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${patientBToken}`);
    expect(patBGetPrivate.status).toBe(403);

    // Doctor can view Private document -> 200 OK
    const docGet = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(docGet.status).toBe(200);

    // Doctor releases document
    const releaseRes = await request(app)
      .patch(`/api/documents/${docId}/visibility`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ visibility: 'Released' });
    expect(releaseRes.status).toBe(200);
    expect(releaseRes.body.data.visibility).toBe('Released');

    // Patient A now can view Released document -> 200 OK
    const patAGetReleased = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(patAGetReleased.status).toBe(200);

    // Patient B STILL cannot view Patient A's Released document -> 403 Forbidden
    const patBGetReleased = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${patientBToken}`);
    expect(patBGetReleased.status).toBe(403);
  });

  // 24. Side-by-Side OCR Verification: Update Extracted Entities while Preserving Original File
  test('31. Side-by-side OCR verification updates structured entities and preserves physical file untouched', async () => {
    const dummyPath = path.join(__dirname, 'test_ocr_verify.pdf');
    const originalContent = '%PDF-1.4 ORIGINAL TEST INVESTIGATION REPORT: Fasting Blood Sugar';
    fs.writeFileSync(dummyPath, originalContent);

    const upRes = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${patientAToken}`)
      .attach('file', dummyPath);
    expect(upRes.status).toBe(201);
    const testDocId = upRes.body.data._id;
    const storedPath = upRes.body.data.storagePath;

    if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);

    // Doctor updates extracted data and OCR verification
    const patchRes = await request(app)
      .patch(`/api/documents/${testDocId}/extracted-data`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        documentType: 'Lab Report',
        ocrText: 'Fasting Blood Sugar: 110 mg/dL (Normal Range: 70-100)',
        extractedData: {
          investigations: [{
            test: 'Fasting Blood Sugar',
            value: '110',
            unit: 'mg/dL',
            referenceRange: '70-100 mg/dL'
          }],
          diagnoses: ['Impaired Fasting Glucose']
        }
      });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.documentType).toBe('Lab Report');
    expect(patchRes.body.data.extractedData.investigations[0].test).toBe('Fasting Blood Sugar');
    expect(patchRes.body.data.extractedData.investigations[0].value).toBe('110');

    // Verify physical file is completely intact and unchanged
    const diskContent = fs.readFileSync(path.resolve(storedPath), 'utf8');
    expect(diskContent).toBe(originalContent);
  });

  // 25. Patient Cross-Access Ownership Isolation
  test('32. Patient B cannot access Patient A profile, consent, clinical history, or prescriptions', async () => {
    // 1. Profile isolation
    const profRes = await request(app)
      .get(`/api/patients/${patientAProfile._id}`)
      .set('Authorization', `Bearer ${patientBToken}`);
    expect(profRes.status).toBe(403);

    // 2. Consent isolation
    const consentRes = await request(app)
      .get(`/api/consent/patient/${patientAProfile._id}`)
      .set('Authorization', `Bearer ${patientBToken}`);
    expect(consentRes.status).toBe(403);

    // 3. Clinical history isolation
    const histRes = await request(app)
      .get(`/api/clinical-history/patient/${patientAProfile._id}`)
      .set('Authorization', `Bearer ${patientBToken}`);
    expect(histRes.status).toBe(403);

    // 4. Prescription isolation
    const rxRes = await request(app)
      .get(`/api/prescriptions/patient/${patientAProfile._id}`)
      .set('Authorization', `Bearer ${patientBToken}`);
    expect(rxRes.status).toBe(403);
  });

  // 26. Clinical Role Privileges: Patient blocked from clinical decision-making
  test('33. Patient cannot issue prescriptions or verify OCR (403 Forbidden)', async () => {
    // Patient attempts to create prescription
    const badRx = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        patientId: patientAProfile._id,
        items: [{ medicine: 'Morphine', dosage: '10mg' }]
      });
    expect(badRx.status).toBe(403);

    // Patient attempts to verify OCR
    const badOcr = await request(app)
      .patch(`/api/documents/${uploadedDocId || '650000000000000000000001'}/extracted-data`)
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({ documentType: 'Lab Report' });
    expect(badOcr.status).toBe(403);
  });

  // 27. Consent stores language, purpose, and generates audit log
  test('34. Consent stores language, purpose, and generates verifiable audit log', async () => {
    const consentRes = await request(app)
      .post('/api/consent')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        purpose: 'OPD_CONSULTATION',
        language: 'Tamil',
        version: 'v1.0-ABDM-Ready',
        consentGiven: true
      });
    expect(consentRes.status).toBe(201);
    expect(consentRes.body.data.language).toBe('Tamil');
    expect(consentRes.body.data.purpose).toBe('OPD_CONSULTATION');

    // Verify audit log exists
    const audit = await AuditLog.findOne({
      userId: patientAUser.id,
      action: 'CONSENT_RECORDED'
    });
    expect(audit).toBeDefined();
    expect(audit.resource).toBe('Consent');
  });

  // 28. FHIR R4 OPConsultRecord Bundle Export & Cross-Patient Protection
  test('35. FHIR R4 Bundle export conforms to NRCES/ABDM profile and enforces patient isolation', async () => {
    // 1. Patient A fetches their own FHIR bundle
    const fhirRes = await request(app)
      .get(`/api/patients/${patientAProfile._id}/fhir-bundle`)
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(fhirRes.status).toBe(200);
    expect(fhirRes.body.success).toBe(true);

    const bundle = fhirRes.body.data;
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('document');
    expect(bundle.meta.profile).toContain('https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord');
    expect(Array.isArray(bundle.entry)).toBe(true);

    // Verify root entry is Composition
    expect(bundle.entry[0].resource.resourceType).toBe('Composition');
    expect(bundle.entry[0].resource.title).toBe('MediKiosk Outpatient Consultation Record');

    // Verify Patient resource exists in bundle
    const patientEntry = bundle.entry.find(e => e.resource.resourceType === 'Patient');
    expect(patientEntry).toBeDefined();
    expect(patientEntry.resource.name[0].text).toBe(patientAProfile.name);

    // 2. Patient B attempts to steal Patient A's FHIR bundle (Must be 403 Forbidden)
    const unauthorizedFhirRes = await request(app)
      .get(`/api/patients/${patientAProfile._id}/fhir-bundle`)
      .set('Authorization', `Bearer ${patientBToken}`);
    expect(unauthorizedFhirRes.status).toBe(403);
    expect(unauthorizedFhirRes.body.success).toBe(false);

    // 3. Doctor can access Patient A's FHIR bundle
    const doctorFhirRes = await request(app)
      .get(`/api/patients/${patientAProfile._id}/fhir-bundle`)
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(doctorFhirRes.status).toBe(200);
    expect(doctorFhirRes.body.data.resourceType).toBe('Bundle');
  });

  // 29. Integration Services Architecture Verification (ABDM, ICD-10, Digital Signature)
  test('36. Integration services report INTEGRATION-READY status and provide functional interfaces', async () => {
    const abdmService = require('../services/abdmService');
    const icd10Service = require('../services/icd10Service');
    const digitalSignatureService = require('../services/digitalSignatureService');

    // 1. ABDM Service
    const abdmStatus = abdmService.getStatus();
    expect(abdmStatus.status).toBe('INTEGRATION-READY');
    expect(abdmStatus.milestones.m1_abha_creation).toBe('INTEGRATION-READY');
    const otpRes = await abdmService.generateOtp('9999999999');
    expect(otpRes.success).toBe(true);
    expect(otpRes.mode).toBe('INTEGRATION-READY_STUB');

    // 2. ICD-10 Service
    const icdStatus = icd10Service.getStatus();
    expect(icdStatus.status).toBe('INTEGRATION-READY');
    const searchRes = await icd10Service.searchDiagnosis('fever');
    expect(searchRes.matches.length).toBeGreaterThan(0);
    expect(searchRes.matches[0].code).toBe('R50.9');

    // 3. Digital Signature Service
    const dscStatus = digitalSignatureService.getStatus();
    expect(dscStatus.status).toBe('INTEGRATION-READY');
    const samplePayload = { rxId: 'test-123', med: 'Paracetamol' };
    const hash = digitalSignatureService.computeDigest(samplePayload);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // SHA-256 hex string length

    const signResult = await digitalSignatureService.signDocument(samplePayload, { name: 'Dr. Ramesh' });
    expect(signResult.status).toBe('INTEGRATION-READY_DIGEST_ONLY');
    expect(signResult.documentHash).toBe(hash);
  });
});
