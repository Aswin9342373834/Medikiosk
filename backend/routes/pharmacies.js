const express = require('express');
const router = express.Router();
const Pharmacy = require('../models/Pharmacy');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const { authenticateUser } = require('../middleware/auth');
const { matchesMedicine, calculateHaversineDistance } = require('../utils/medicineMatcher');

const ALLOWED_RADII = [1, 3, 5, 10];
const DISCLAIMER = 'Demo Pharmacy Availability — simulated inventory';

/**
 * GET /api/pharmacies/nearby
 *
 * Query Parameters:
 * - latitude (required, -90 to 90)
 * - longitude (required, -180 to 180)
 * - radius (optional, 1 | 3 | 5 | 10, default 5)
 * - prescriptionId (optional, requires authentication)
 * - medicine (optional, single medicine name)
 * - strength (optional, single medicine strength)
 * - dosageForm (optional)
 */
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius, prescriptionId, medicine, strength, dosageForm } = req.query;

    // 1. Validate Coordinates
    if (latitude === undefined || longitude === undefined || latitude === '' || longitude === '') {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude coordinates are required for nearby pharmacy search.'
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates must be valid numbers: latitude (-90 to 90) and longitude (-180 to 180).'
      });
    }

    // 2. Validate Radius
    let radiusKm = 5;
    if (radius !== undefined && radius !== '') {
      const parsedRadius = parseInt(radius, 10);
      if (!ALLOWED_RADII.includes(parsedRadius)) {
        return res.status(400).json({
          success: false,
          message: `Radius must be one of: ${ALLOWED_RADII.join(', ')} km.`
        });
      }
      radiusKm = parsedRadius;
    }

    // 3. Handle Prescription Lookup & Authorization (if prescriptionId provided)
    let prescriptionItems = null;
    if (prescriptionId) {
      // Must authenticate user
      if (!req.headers.authorization) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to search pharmacies for a specific prescription.'
        });
      }

      // Run auth middleware manually or verify token
      const authResult = await new Promise((resolve) => {
        authenticateUser(req, res, () => resolve(true));
      });

      if (!authResult) return; // Response handled in middleware

      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription) {
        return res.status(404).json({
          success: false,
          message: 'Prescription not found.'
        });
      }

      // Check Ownership: Patient can only search for their own prescription
      if (req.user.role === 'PATIENT') {
        const patient = await Patient.findOne({ userId: req.user.id });
        if (!patient || patient._id.toString() !== prescription.patientId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access forbidden: You can only search pharmacies for your own prescriptions.'
          });
        }
      } else if (req.user.role !== 'DOCTOR' && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden.'
        });
      }

      prescriptionItems = prescription.items && prescription.items.length > 0
        ? prescription.items
        : prescription.medications || [];
    }

    // 4. Query Pharmacies from Database using Geospatial Index or Distance Filter
    // 1 km = approx 1 / 111.32 degrees
    const maxDistanceMeters = radiusKm * 1000;

    let pharmacies = [];
    try {
      pharmacies = await Pharmacy.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lon, lat]
            },
            $maxDistance: maxDistanceMeters
          }
        }
      }).lean();
    } catch (geoErr) {
      // Fallback in case 2dsphere index is building: in-memory Haversine filtering
      const allPharmacies = await Pharmacy.find({}).lean();
      pharmacies = allPharmacies.filter(p => {
        if (!p.location || !p.location.coordinates) return false;
        const [pLon, pLat] = p.location.coordinates;
        const dist = calculateHaversineDistance(lat, lon, pLat, pLon);
        return dist <= radiusKm;
      });
    }

    // If no pharmacies found in the given radius
    if (!pharmacies || pharmacies.length === 0) {
      return res.json({
        success: true,
        radiusKm,
        totalFound: 0,
        isSimulated: true,
        disclaimer: DISCLAIMER,
        results: [],
        medicinesSummary: []
      });
    }

    // 5. Evaluate Results based on Search Mode (Prescription vs Single Medicine vs All)
    if (prescriptionItems) {
      // MODE A: Entire Prescription Search
      const totalPrescribed = prescriptionItems.length;
      const medicineAvailabilityMap = new Map();

      prescriptionItems.forEach(item => {
        const medKey = `${item.medicine || item.name || 'Medicine'}::${item.dosage || item.strength || ''}`;
        medicineAvailabilityMap.set(medKey, {
          medicine: item.medicine || item.name || 'Medicine',
          dosage: item.dosage || item.strength || 'Not specified',
          frequency: item.frequency || 'Not specified',
          duration: item.duration || 'Not specified',
          instructions: item.instructions || 'Not specified',
          availableNearby: false,
          availablePharmacyCount: 0
        });
      });

      const processedPharmacies = pharmacies.map(pharmacy => {
        const [pLon, pLat] = pharmacy.location.coordinates;
        const distanceKm = calculateHaversineDistance(lat, lon, pLat, pLon);

        const availableMedicines = [];
        const unavailableMedicines = [];

        prescriptionItems.forEach(rxItem => {
          const matchedInvItem = (pharmacy.inventory || []).find(invItem =>
            matchesMedicine(rxItem, invItem)
          );

          const itemDesc = {
            medicine: rxItem.medicine || rxItem.name || 'Medicine',
            dosage: rxItem.dosage || rxItem.strength || 'Not specified'
          };

          if (matchedInvItem) {
            availableMedicines.push({
              ...itemDesc,
              matchedName: matchedInvItem.medicineName,
              strength: matchedInvItem.strength,
              dosageForm: matchedInvItem.dosageForm,
              inStock: true
            });

            // Update overall map
            const medKey = `${rxItem.medicine || rxItem.name || 'Medicine'}::${rxItem.dosage || rxItem.strength || ''}`;
            const summaryEntry = medicineAvailabilityMap.get(medKey);
            if (summaryEntry) {
              summaryEntry.availableNearby = true;
              summaryEntry.availablePharmacyCount += 1;
            }
          } else {
            unavailableMedicines.push(itemDesc);
          }
        });

        return {
          pharmacyId: pharmacy._id,
          name: pharmacy.name,
          code: pharmacy.code,
          address: pharmacy.address,
          city: pharmacy.city,
          pincode: pharmacy.pincode,
          phone: pharmacy.phone,
          operatingHours: pharmacy.operatingHours,
          rating: pharmacy.rating,
          distanceKm,
          coordinates: {
            latitude: pLat,
            longitude: pLon
          },
          isSimulated: pharmacy.isSimulated !== false,
          availableCount: availableMedicines.length,
          totalCount: totalPrescribed,
          allAvailable: availableMedicines.length === totalPrescribed,
          availableMedicines,
          unavailableMedicines
        };
      });

      // Filter to keep only within radius
      const withinRadius = processedPharmacies.filter(p => p.distanceKm <= radiusKm);

      // Sort by: 1) availableCount descending, 2) distanceKm ascending
      withinRadius.sort((a, b) => {
        if (b.availableCount !== a.availableCount) {
          return b.availableCount - a.availableCount;
        }
        return a.distanceKm - b.distanceKm;
      });

      const medicinesSummary = Array.from(medicineAvailabilityMap.values());
      const availablePrescribedCount = medicinesSummary.filter(m => m.availableNearby).length;

      return res.json({
        success: true,
        searchMode: 'PRESCRIPTION',
        radiusKm,
        totalPrescribed,
        availablePrescribed: availablePrescribedCount,
        allPrescribedAvailable: availablePrescribedCount === totalPrescribed,
        totalFound: withinRadius.length,
        isSimulated: true,
        disclaimer: DISCLAIMER,
        medicinesSummary,
        results: withinRadius
      });

    } else if (medicine) {
      // MODE B: Single Medicine Query
      const queryItem = { medicine, strength, dosageForm };

      const processedPharmacies = [];
      pharmacies.forEach(pharmacy => {
        const [pLon, pLat] = pharmacy.location.coordinates;
        const distanceKm = calculateHaversineDistance(lat, lon, pLat, pLon);
        if (distanceKm > radiusKm) return;

        const matchedInvItem = (pharmacy.inventory || []).find(invItem =>
          matchesMedicine(queryItem, invItem)
        );

        if (matchedInvItem) {
          processedPharmacies.push({
            pharmacyId: pharmacy._id,
            name: pharmacy.name,
            code: pharmacy.code,
            address: pharmacy.address,
            city: pharmacy.city,
            pincode: pharmacy.pincode,
            phone: pharmacy.phone,
            operatingHours: pharmacy.operatingHours,
            rating: pharmacy.rating,
            distanceKm,
            coordinates: {
              latitude: pLat,
              longitude: pLon
            },
            isSimulated: pharmacy.isSimulated !== false,
            availability: 'available',
            inventoryItem: {
              medicineName: matchedInvItem.medicineName,
              strength: matchedInvItem.strength,
              dosageForm: matchedInvItem.dosageForm,
              inStock: matchedInvItem.inStock
            }
          });
        }
      });

      // Sort by distance ascending
      processedPharmacies.sort((a, b) => a.distanceKm - b.distanceKm);

      return res.json({
        success: true,
        searchMode: 'SINGLE_MEDICINE',
        medicine,
        strength: strength || null,
        radiusKm,
        totalFound: processedPharmacies.length,
        isSimulated: true,
        disclaimer: DISCLAIMER,
        results: processedPharmacies
      });

    } else {
      // MODE C: General Nearby Pharmacies
      const processedPharmacies = pharmacies.map(pharmacy => {
        const [pLon, pLat] = pharmacy.location.coordinates;
        const distanceKm = calculateHaversineDistance(lat, lon, pLat, pLon);
        return {
          pharmacyId: pharmacy._id,
          name: pharmacy.name,
          code: pharmacy.code,
          address: pharmacy.address,
          city: pharmacy.city,
          pincode: pharmacy.pincode,
          phone: pharmacy.phone,
          operatingHours: pharmacy.operatingHours,
          rating: pharmacy.rating,
          distanceKm,
          coordinates: {
            latitude: pLat,
            longitude: pLon
          },
          isSimulated: pharmacy.isSimulated !== false,
          totalInventoryItems: (pharmacy.inventory || []).length
        };
      }).filter(p => p.distanceKm <= radiusKm);

      processedPharmacies.sort((a, b) => a.distanceKm - b.distanceKm);

      return res.json({
        success: true,
        searchMode: 'GENERAL_NEARBY',
        radiusKm,
        totalFound: processedPharmacies.length,
        isSimulated: true,
        disclaimer: DISCLAIMER,
        results: processedPharmacies
      });
    }

  } catch (error) {
    console.error('Nearby pharmacies search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search nearby pharmacies.'
    });
  }
});

/**
 * GET /api/pharmacies/:id
 * Retrieve a specific pharmacy by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found.' });
    }

    res.json({
      success: true,
      data: {
        _id: pharmacy._id,
        name: pharmacy.name,
        code: pharmacy.code,
        address: pharmacy.address,
        city: pharmacy.city,
        pincode: pharmacy.pincode,
        phone: pharmacy.phone,
        operatingHours: pharmacy.operatingHours,
        rating: pharmacy.rating,
        coordinates: {
          latitude: pharmacy.location.coordinates[1],
          longitude: pharmacy.location.coordinates[0]
        },
        isSimulated: pharmacy.isSimulated !== false,
        disclaimer: DISCLAIMER
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
