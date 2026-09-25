const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { app } = require('../index');

const Pharmacy = require('../models/Pharmacy');
const Prescription = require('../models/Prescription');
const User = require('../models/User');
const Patient = require('../models/Patient');
const {
  matchesMedicine,
  extractStrength,
  extractBaseName,
  normalizeDosageForm,
  calculateHaversineDistance
} = require('../utils/medicineMatcher');

const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/medikiosk_test';

describe('Pharmacy & Prescription Medicine Availability Integration Tests', () => {
  let patientAToken, patientBToken;
  let patientAId, patientBId;
  let prescriptionAId, prescriptionBId;

  // AIIMS Reference Coordinates: 28.5672° N, 77.2100° E
  const centerLat = 28.5672;
  const centerLon = 77.2100;

  beforeAll(async () => {
    await mongoose.connect(MONGODB_TEST_URI);
    await Pharmacy.deleteMany({});
    await Prescription.deleteMany({});
    await User.deleteMany({});
    await Patient.deleteMany({});

    const defaultPassword = await bcrypt.hash('Password123!', 10);

    // 1. Create Patient A
    const userA = await User.create({
      email: 'patienta@hospital.gov.in',
      password: defaultPassword,
      role: 'PATIENT',
      firstName: 'Patient',
      lastName: 'Alpha',
      phone: '+919999900001'
    });
    const patientA = await Patient.create({
      userId: userA._id,
      abhaId: 'ABHA-TEST-0001',
      name: 'Patient Alpha',
      gender: 'Male',
      age: 45
    });
    patientAId = patientA._id;

    // 2. Create Patient B
    const userB = await User.create({
      email: 'patientb@hospital.gov.in',
      password: defaultPassword,
      role: 'PATIENT',
      firstName: 'Patient',
      lastName: 'Beta',
      phone: '+919999900002'
    });
    const patientB = await Patient.create({
      userId: userB._id,
      abhaId: 'ABHA-TEST-0002',
      name: 'Patient Beta',
      gender: 'Female',
      age: 38
    });
    patientBId = patientB._id;

    // Login Patient A
    const loginResA = await request(app).post('/api/auth/login').send({
      email: 'patienta@hospital.gov.in',
      password: 'Password123!'
    });
    patientAToken = loginResA.body.token;

    // Login Patient B
    const loginResB = await request(app).post('/api/auth/login').send({
      email: 'patientb@hospital.gov.in',
      password: 'Password123!'
    });
    patientBToken = loginResB.body.token;

    // 3. Create Doctor & Prescriptions
    const doctorUser = await User.create({
      email: 'doctor.test@hospital.gov.in',
      password: defaultPassword,
      role: 'DOCTOR',
      firstName: 'Test',
      lastName: 'Doctor',
      phone: '+919999900003'
    });

    const rxA = await Prescription.create({
      patientId: patientA._id,
      doctorId: doctorUser._id,
      diagnosis: 'Hypertension & Diabetes',
      items: [
        { medicine: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', route: 'Oral', instructions: 'After food' },
        { medicine: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '30 days', route: 'Oral', instructions: 'After meals' }
      ],
      status: 'Active'
    });
    prescriptionAId = rxA._id;

    const rxB = await Prescription.create({
      patientId: patientB._id,
      doctorId: doctorUser._id,
      diagnosis: 'Acute Bronchitis',
      items: [
        { medicine: 'Azithromycin', dosage: '500mg', frequency: 'Once daily', duration: '5 days', route: 'Oral', instructions: 'After food' }
      ],
      status: 'Active'
    });
    prescriptionBId = rxB._id;

    // 4. Seed Test Pharmacies at deterministic distances:
    // P1: ~0.5 km away (coordinates: 28.564, 77.208)
    // P2: ~2.0 km away (coordinates: 28.552, 77.202)
    // P3: ~4.5 km away (coordinates: 28.530, 77.210)
    // P4: ~8.0 km away (coordinates: 28.635, 77.215)
    // P5: ~15.0 km away (coordinates: 28.700, 77.210)
    await Pharmacy.create([
      {
        name: 'MediKiosk Demo Pharmacy 01',
        code: 'TEST-PHARM-01',
        address: 'Ansari Nagar, New Delhi',
        phone: '+91-11-2659-0001',
        rating: 4.8,
        location: { type: 'Point', coordinates: [77.208, 28.564] }, // ~0.5 km
        isSimulated: true,
        inventory: [
          { medicineName: 'Amlodipine', dosageForm: 'Tablet', strength: '5mg', inStock: true, quantity: 100 },
          { medicineName: 'Metformin', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 100 },
          { medicineName: 'Paracetamol', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 100 }
        ]
      },
      {
        name: 'MediKiosk Demo Pharmacy 02',
        code: 'TEST-PHARM-02',
        address: 'Green Park, New Delhi',
        phone: '+91-11-2659-0002',
        rating: 4.6,
        location: { type: 'Point', coordinates: [77.202, 28.552] }, // ~2.0 km
        isSimulated: true,
        inventory: [
          { medicineName: 'Amlodipine', dosageForm: 'Tablet', strength: '5mg', inStock: true, quantity: 50 },
          // Metformin 500mg is NOT in stock here, but has Metformin 1000mg
          { medicineName: 'Metformin', dosageForm: 'Tablet', strength: '1000mg', inStock: true, quantity: 50 },
          { medicineName: 'Paracetamol', dosageForm: 'Tablet', strength: '650mg', inStock: true, quantity: 50 }
        ]
      },
      {
        name: 'MediKiosk Demo Pharmacy 03',
        code: 'TEST-PHARM-03',
        address: 'Malviya Nagar, New Delhi',
        phone: '+91-11-2659-0003',
        rating: 4.5,
        location: { type: 'Point', coordinates: [77.210, 28.530] }, // ~4.1 km
        isSimulated: true,
        inventory: [
          { medicineName: 'Amlodipine', dosageForm: 'Tablet', strength: '5mg', inStock: true, quantity: 30 },
          { medicineName: 'Metformin', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 40 }
        ]
      },
      {
        name: 'MediKiosk Demo Pharmacy 04',
        code: 'TEST-PHARM-04',
        address: 'Connaught Place, New Delhi',
        phone: '+91-11-2659-0004',
        rating: 4.7,
        location: { type: 'Point', coordinates: [77.215, 28.635] }, // ~7.6 km
        isSimulated: true,
        inventory: [
          { medicineName: 'Azithromycin', dosageForm: 'Tablet', strength: '500mg', inStock: true, quantity: 80 }
        ]
      },
      {
        name: 'MediKiosk Demo Pharmacy 05',
        code: 'TEST-PHARM-05',
        address: 'Rohini, New Delhi',
        phone: '+91-11-2659-0005',
        rating: 4.3,
        location: { type: 'Point', coordinates: [77.210, 28.700] }, // ~14.8 km
        isSimulated: true,
        inventory: [
          { medicineName: 'Amlodipine', dosageForm: 'Tablet', strength: '5mg', inStock: true, quantity: 10 }
        ]
      }
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // --- UNIT TESTS: Medicine Matching & Haversine ---
  describe('Medicine Matcher Unit Tests', () => {
    it('calculates accurate Haversine distance', () => {
      // Distance between AIIMS (28.5672, 77.2100) and Safdarjung (28.5610, 77.1985) ~1.3 km
      const d = calculateHaversineDistance(28.5672, 77.2100, 28.5610, 77.1985);
      expect(d).toBeGreaterThan(1.0);
      expect(d).toBeLessThan(1.6);
      expect(typeof d).toBe('number');
    });

    it('exact matching on medicine name and strength succeeds', () => {
      const query = { medicine: 'Paracetamol', dosage: '500mg' };
      const inventory = { medicineName: 'Paracetamol', strength: '500mg', dosageForm: 'Tablet', inStock: true };
      expect(matchesMedicine(query, inventory)).toBe(true);
    });

    it('conservative matching rejects strength mismatch (500mg vs 650mg)', () => {
      const query = { medicine: 'Paracetamol', dosage: '500mg' };
      const inventory = { medicineName: 'Paracetamol', strength: '650mg', dosageForm: 'Tablet', inStock: true };
      expect(matchesMedicine(query, inventory)).toBe(false);
    });

    it('dosage form matching rejects conflicting formulation (Tablet vs Syrup)', () => {
      const query = { medicine: 'Paracetamol', dosage: '500mg', dosageForm: 'Syrup' };
      const inventory = { medicineName: 'Paracetamol', strength: '500mg', dosageForm: 'Tablet', inStock: true };
      expect(matchesMedicine(query, inventory)).toBe(false);
    });

    it('brand name matching works when generic active ingredient is requested', () => {
      const query = { medicine: 'Calpol', dosage: '500mg' };
      const inventory = { medicineName: 'Paracetamol', brandName: 'Calpol', strength: '500mg', dosageForm: 'Tablet', inStock: true };
      expect(matchesMedicine(query, inventory)).toBe(true);
    });
  });

  // --- INTEGRATION TESTS: Nearby Pharmacy API Validation ---
  describe('Nearby Pharmacy API Validation', () => {
    it('returns 400 when coordinates are missing', async () => {
      const res = await request(app).get('/api/pharmacies/nearby');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/coordinates are required/i);
    });

    it('returns 400 for invalid latitude/longitude numbers', async () => {
      const res = await request(app).get('/api/pharmacies/nearby?latitude=150&longitude=77.2100');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/valid numbers/i);
    });

    it('returns 400 for unapproved search radius (e.g. 7 km)', async () => {
      const res = await request(app).get(`/api/pharmacies/nearby?latitude=${centerLat}&longitude=${centerLon}&radius=7`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Radius must be one of: 1, 3, 5, 10 km/i);
    });
  });

  // --- INTEGRATION TESTS: Radius Search Filtering ---
  describe('Radius Search Filtering', () => {
    it('radius = 1 km returns only pharmacies within 1 km (P1)', async () => {
      const res = await request(app).get(`/api/pharmacies/nearby?latitude=${centerLat}&longitude=${centerLon}&radius=1`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].code).toBe('TEST-PHARM-01');
      expect(res.body.results[0].distanceKm).toBeLessThanOrEqual(1.0);
    });

    it('radius = 3 km returns pharmacies within 3 km (P1, P2)', async () => {
      const res = await request(app).get(`/api/pharmacies/nearby?latitude=${centerLat}&longitude=${centerLon}&radius=3`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.results.length).toBe(2);
      const codes = res.body.results.map(r => r.code);
      expect(codes).toContain('TEST-PHARM-01');
      expect(codes).toContain('TEST-PHARM-02');
    });

    it('radius = 5 km returns pharmacies within 5 km (P1, P2, P3)', async () => {
      const res = await request(app).get(`/api/pharmacies/nearby?latitude=${centerLat}&longitude=${centerLon}&radius=5`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.results.length).toBe(3);
      const codes = res.body.results.map(r => r.code);
      expect(codes).toContain('TEST-PHARM-01');
      expect(codes).toContain('TEST-PHARM-02');
      expect(codes).toContain('TEST-PHARM-03');
    });

    it('radius = 10 km returns pharmacies within 10 km (P1, P2, P3, P4)', async () => {
      const res = await request(app).get(`/api/pharmacies/nearby?latitude=${centerLat}&longitude=${centerLon}&radius=10`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.results.length).toBe(4);
      const codes = res.body.results.map(r => r.code);
      expect(codes).not.toContain('TEST-PHARM-05'); // P5 is at ~15km, excluded
    });
  });

  // --- INTEGRATION TESTS: Single Medicine Search ---
  describe('Single Medicine Search', () => {
    it('searches nearby pharmacies having Paracetamol 500mg', async () => {
      const res = await request(app).get(
        `/api/pharmacies/nearby?latitude=${centerLat}&longitude=${centerLon}&radius=5&medicine=Paracetamol&strength=500mg`
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // P1 has 500mg, P2 only has 650mg -> only P1 should be returned
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].code).toBe('TEST-PHARM-01');
      expect(res.body.results[0].isSimulated).toBe(true);
      expect(res.body.disclaimer).toMatch(/simulated inventory/i);
    });

    it('returns empty results when medicine is unavailable in radius', async () => {
      const res = await request(app).get(
        `/api/pharmacies/nearby?latitude=${centerLat}&longitude=${centerLon}&radius=1&medicine=NonExistentDrugXYZ`
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.results.length).toBe(0);
    });
  });

  // --- INTEGRATION TESTS: Prescription RBAC & Authorization ---
  describe('Prescription Ownership & RBAC', () => {
    it('Patient A can search pharmacies for their own prescription', async () => {
      const res = await request(app)
        .get(`/api/pharmacies/nearby?latitude=${centerLat}&longitude=${centerLon}&radius=5&prescriptionId=${prescriptionAId}`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.searchMode).toBe('PRESCRIPTION');
      expect(res.body.totalPrescribed).toBe(2);
      expect(res.body.isSimulated).toBe(true);

      // P1 has both Amlodipine 5mg and Metformin 500mg -> allAvailable: true
      const p1 = res.body.results.find(r => r.code === 'TEST-PHARM-01');
      expect(p1).toBeDefined();
      expect(p1.allAvailable).toBe(true);
      expect(p1.availableCount).toBe(2);

      // P2 has Amlodipine 5mg, but NOT Metformin 500mg (it has 1000mg) -> availableCount: 1
      const p2 = res.body.results.find(r => r.code === 'TEST-PHARM-02');
      expect(p2).toBeDefined();
      expect(p2.allAvailable).toBe(false);
      expect(p2.availableCount).toBe(1);
      expect(p2.unavailableMedicines[0].medicine).toBe('Metformin');
    });

    it('Patient B CANNOT search pharmacies for Patient A prescription (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/pharmacies/nearby?latitude=${centerLat}&longitude=${centerLon}&radius=5&prescriptionId=${prescriptionAId}`)
        .set('Authorization', `Bearer ${patientBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/access forbidden/i);
    });

    it('requires authentication when prescriptionId is provided', async () => {
      const res = await request(app)
        .get(`/api/pharmacies/nearby?latitude=${centerLat}&longitude=${centerLon}&radius=5&prescriptionId=${prescriptionAId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 for non-existent prescriptionId', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/pharmacies/nearby?latitude=${centerLat}&longitude=${centerLon}&radius=5&prescriptionId=${fakeId}`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // --- INTEGRATION TESTS: Prescription API ---
  describe('Prescription API (GET /api/prescriptions/:id)', () => {
    it('Patient A can retrieve their own prescription by ID', async () => {
      const res = await request(app)
        .get(`/api/prescriptions/${prescriptionAId}`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(prescriptionAId.toString());
      expect(res.body.data.items.length).toBe(2);
    });

    it('Patient B cannot retrieve Patient A prescription by ID (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/prescriptions/${prescriptionAId}`)
        .set('Authorization', `Bearer ${patientBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
