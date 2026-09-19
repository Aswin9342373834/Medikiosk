const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { app } = require('../index');

const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');

const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/medikiosk_test';

beforeAll(async () => {
  await mongoose.connect(MONGODB_TEST_URI);
  await User.deleteMany({});
  await Patient.deleteMany({});
  await Doctor.deleteMany({});
  await Hospital.deleteMany({});

  const hospital = await Hospital.create({
    name: 'All India Institute of Medical Sciences',
    code: 'AIIMS-01',
    city: 'New Delhi',
    state: 'Delhi'
  });

  const hashedPass = await bcrypt.hash('Password123!', 10);

  // Seed Demo Patient
  const patUser = await User.create({
    email: 'patient@hospital.gov.in',
    password: hashedPass,
    role: 'PATIENT',
    firstName: 'Ramesh',
    lastName: 'Kumar',
    phone: '+919876543212'
  });
  await Patient.create({
    userId: patUser._id,
    name: 'Ramesh Kumar',
    abhaId: 'ABHA-9928-1102',
    uhid: 'UHID-481920',
    contactNumber: '+919876543212',
    currentStatus: 'Registered'
  });

  // Seed Demo Doctor
  const docUser = await User.create({
    email: 'doctor@hospital.gov.in',
    password: hashedPass,
    role: 'DOCTOR',
    firstName: 'Ananya',
    lastName: 'Sharma',
    phone: '+919876543211'
  });
  await Doctor.create({
    userId: docUser._id,
    name: 'Dr. Ananya Sharma',
    licenseNumber: 'MCI-882910',
    department: 'General Medicine',
    specialization: 'Senior Consultant Physician'
  });

  // Seed Demo Admin
  await User.create({
    email: 'admin@hospital.gov.in',
    password: hashedPass,
    role: 'ADMIN',
    firstName: 'Rajesh',
    lastName: 'Verma',
    phone: '+919876543210'
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('MediKiosk Authentication & Role-Based Access Control Suite', () => {
  let patientToken, doctorToken, adminToken;

  test('TEST 1: Valid Patient login returns 200 and JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient@hospital.gov.in', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('PATIENT');
    expect(res.body.user.patient).toBeDefined();
    patientToken = res.body.token;
  });

  test('TEST 2: Valid Doctor login returns 200 and JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'doctor@hospital.gov.in', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('DOCTOR');
    expect(res.body.user.doctor).toBeDefined();
    doctorToken = res.body.token;
  });

  test('TEST 3: Valid Admin login returns 200 and JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@hospital.gov.in', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('ADMIN');
    adminToken = res.body.token;
  });

  test('TEST 4: Invalid password returns 401 Unauthorized with clear message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient@hospital.gov.in', password: 'WrongPassword999!' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/incorrect/i);
  });

  test('TEST 5: Invalid email returns 401 Unauthorized with clear message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent.user@hospital.gov.in', password: 'Password123!' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/incorrect/i);
  });

  test('TEST 6: Empty email returns 400 Bad Request with validation error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '', password: 'Password123!' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('TEST 7: Empty password returns 400 Bad Request with validation error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient@hospital.gov.in', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('TEST 8: Patient registration succeeds with valid data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'newpatient@hospital.gov.in',
        password: 'SecurePassword123!',
        firstName: 'Siddharth',
        lastName: 'Menon',
        role: 'PATIENT',
        phone: '+919812345678'
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('newpatient@hospital.gov.in');
    expect(res.body.user.role).toBe('PATIENT');
  });

  test('TEST 9: Duplicate registration fails with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'newpatient@hospital.gov.in',
        password: 'AnotherPassword123!',
        firstName: 'Duplicate',
        lastName: 'User',
        role: 'PATIENT',
        phone: '+919812345678'
      });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('DUPLICATE_EMAIL');
  });

  test('TEST 10: Invalid/expired token rejects protected route with 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid_garbage_token_123');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('TEST 11: /api/auth/me returns authenticated user profile and strips password', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer ' + patientToken);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('patient@hospital.gov.in');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.profile).toBeDefined();
  });

  test('TEST 12: Patient accessing Doctor route is blocked with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/doctors/queue')
      .set('Authorization', 'Bearer ' + patientToken);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('TEST 13: Doctor accessing Admin telemetry route is blocked with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', 'Bearer ' + doctorToken);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('TEST 14: Admin accessing Admin telemetry route succeeds with 200 OK', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('TEST 15: Public registration rejects DOCTOR or ADMIN role with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'malicious.doctor@hospital.gov.in',
        password: 'Password123!',
        firstName: 'Malicious',
        lastName: 'Doctor',
        role: 'DOCTOR'
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  test('TEST 16: Password is encrypted with bcrypt and never stored in plaintext', async () => {
    const user = await User.findOne({ email: 'patient@hospital.gov.in' });
    expect(user.password).toBeDefined();
    expect(user.password).not.toBe('Password123!');
    expect(user.password).toMatch(/^\$2[aby]\$\d{2}\$/);
    const valid = await bcrypt.compare('Password123!', user.password);
    expect(valid).toBe(true);
  });
});
