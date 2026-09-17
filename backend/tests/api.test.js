const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { app } = require('../index');

const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const ClinicalHistory = require('../models/ClinicalHistory');
const MedicalDocument = require('../models/MedicalDocument');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const AuditLog = require('../models/AuditLog');

const MONGODB_TEST_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medikiosk_test';

beforeAll(async () => {
  await mongoose.connect(MONGODB_TEST_URI);
  // Clear collections for clean test run
  await User.deleteMany({});
  await Patient.deleteMany({});
  await Doctor.deleteMany({});
  await ClinicalHistory.deleteMany({});
  await MedicalDocument.deleteMany({});
  await Consultation.deleteMany({});
  await Prescription.deleteMany({});
  await AuditLog.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('MediKiosk Comprehensive Automated Test Suite', () => {
  let patientAToken, patientBToken, doctorToken, adminToken;
  let patientAUser, patientBUser, doctorUser, adminUser;
  let patientAProfile, patientBProfile;
  let uploadedDocId;

  // 1. Health & Startup
  test('Backend Health Check returns 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // 2. Auth: Patient A Registration & Login
  test('Patient A Registration & Login', async () => {
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

  // 3. Auth: Patient B Registration & Login
  test('Patient B Registration & Login', async () => {
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

  // 3b. Government Hospital OP Registration
  test('Government Hospital OP Registration generates OP Number and Token Number', async () => {
    const res = await request(app)
      .post('/api/patients/op-register')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        fullName: 'Aarav Sharma',
        dateOfBirth: '1988-04-12',
        age: 38,
        gender: 'Male',
        contactNumber: '+919811111111',
        uhid: 'UHID-882101',
        abhaId: 'ABHA-9921-1188',
        address: '14/B Ring Road',
        villageArea: 'Ansari Nagar',
        district: 'South Delhi',
        state: 'Delhi',
        pincode: '110029',
        emergencyName: 'Sunita Sharma',
        emergencyPhone: '+919811111112',
        emergencyRelationship: 'Spouse',
        hospital: 'All India Institute of Medical Sciences (AIIMS)',
        department: 'General Medicine',
        opdType: 'General OPD',
        visitType: 'New',
        preferredLanguage: 'English',
        reasonForVisit: 'Persistent chest discomfort and breathlessness',
        existingConditions: ['Hypertension'],
        currentMedications: 'Amlodipine 5mg',
        allergies: ['Penicillin']
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.opNumber).toMatch(/^OPD-/);
    expect(res.body.data.tokenNumber).toMatch(/^TKN-/);
    expect(res.body.data.department).toBe('General Medicine');
  });

  // 4. Auth: Doctor Registration & Login
  test('Doctor Registration & Login', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'dr.priya@test.hospital.gov.in',
        password: 'Password123!',
        firstName: 'Priya',
        lastName: 'Nair',
        role: 'DOCTOR',
        department: 'Cardiology'
      });
    expect(res.status).toBe(201);
    doctorToken = res.body.token;
    doctorUser = res.body.user;
  });

  // 5. Auth: Admin Registration & Login
  test('Admin Registration & Login', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin.super@test.hospital.gov.in',
        password: 'Password123!',
        firstName: 'Vikram',
        lastName: 'Patel',
        role: 'ADMIN'
      });
    expect(res.status).toBe(201);
    adminToken = res.body.token;
    adminUser = res.body.user;
  });

  // 6. RBAC Verification
  test('RBAC: Patient cannot access Admin Stats endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('RBAC: Admin CAN access Admin Stats endpoint', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // 7. Clinical History Submission (Safety Order: DB First)
  test('Patient A Submits Clinical History with Consent and Red Flag check', async () => {
    const res = await request(app)
      .post('/api/clinical-history/submit-history')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        presentingComplaint: 'Severe chest pain radiating to left arm',
        chiefComplaint: 'Chest Pain',
        historyOfPresentIllness: 'Sudden onset substernal pressure for 1 hour with sweating.',
        onset: '1 hour ago',
        duration: 'Constant',
        location: 'Chest / Left Arm',
        severity: 'Severe (8/10)',
        pastMedicalHistory: ['Hypertension'],
        allergies: ['Penicillin'],
        ayushMode: false,
        consentGiven: true,
        consentVersion: 'v1.0-ABDM'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.presentingComplaint).toBe('Severe chest pain radiating to left arm');
    // Safety check: Red flag is properly detected deterministically or via AI
    expect(res.body.data.redFlags).toBeDefined();
    expect(res.body.data.redFlags.length).toBeGreaterThan(0);
  });

  // 8. Adaptive Questioning
  test('Adaptive Questioning returns structured questions', async () => {
    const res = await request(app)
      .post('/api/clinical-history/adaptive-question')
      .send({
        currentHistory: { presentingComplaint: 'Chest Pain' },
        language: 'English'
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.question).toBeDefined();
    expect(Array.isArray(res.body.data.options)).toBe(true);
  });

  // 9. Document Upload & Default Visibility Private
  test('Patient A Uploads Medical Report (Default visibility is Private)', async () => {
    // Create temporary dummy test file
    const testFilePath = path.join(__dirname, 'test_sample_report.png');
    fs.writeFileSync(testFilePath, 'DUMMY_IMAGE_DATA_FOR_TEST');

    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${patientAToken}`)
      .attach('file', testFilePath)
      .field('documentType', 'Lab Report');

    fs.unlinkSync(testFilePath);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.visibility).toBe('Private');
    uploadedDocId = res.body.data._id;
  });

  // ============================================================
  // CRITICAL SECURITY TEST: MANDATORY REPORT VISIBILITY FLOW
  // ============================================================
  test('CRITICAL SECURITY: Patient A cannot access Private document (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/documents/${uploadedDocId}`)
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Access Denied/i);
  });

  test('CRITICAL SECURITY: Doctor marks document as MAKE VISIBLE (Released)', async () => {
    const res = await request(app)
      .patch(`/api/documents/${uploadedDocId}/visibility`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ visibility: 'Released' });

    expect(res.status).toBe(200);
    expect(res.body.data.visibility).toBe('Released');
    expect(res.body.data.reviewStatus).toBe('Reviewed');
  });

  test('CRITICAL SECURITY: Patient A can now access document after release (200 OK)', async () => {
    const res = await request(app)
      .get(`/api/documents/${uploadedDocId}`)
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id.toString()).toBe(uploadedDocId.toString());
  });

  test('CRITICAL SECURITY: Patient B cannot access Patient A document (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/documents/${uploadedDocId}`)
      .set('Authorization', `Bearer ${patientBToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Forbidden|Access denied/i);
  });

  // 10. Doctor Queue
  test('Doctor can fetch queue and see urgent red flags prioritized', async () => {
    const res = await request(app)
      .get('/api/doctors/queue')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].priority).toBe('URGENT');
  });

  // 11. Prescription Creation
  test('Doctor creates a Prescription for Patient A', async () => {
    const res = await request(app)
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
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(2);
  });

  // 12. Consultation Completion
  test('Doctor completes consultation for Patient A', async () => {
    const res = await request(app)
      .post('/api/consultations/complete')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: patientAProfile._id,
        clinicalAssessment: 'Suspected acute coronary syndrome. Stabilized and referred to cardiology.',
        diagnosis: 'Acute Coronary Syndrome / Angina',
        doctorNotes: 'ECG showed ST changes. Given loading doses of antiplatelets.',
        treatmentPlan: 'Immediate Cardiology referral & observation'
      });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  // 13. Audit Log Verification
  test('Audit logs have tracked security and clinical events', async () => {
    const logs = await AuditLog.find();
    expect(logs.length).toBeGreaterThan(3);
    const actions = logs.map(l => l.action);
    expect(actions).toContain('PATIENT_CREATED');
    expect(actions).toContain('HISTORY_SUBMITTED');
    expect(actions).toContain('DOCUMENT_UPLOADED');
    expect(actions).toContain('DOCUMENT_RELEASED');
  });
});
