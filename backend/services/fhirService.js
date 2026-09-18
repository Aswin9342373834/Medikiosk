/**
 * MediKiosk FHIR R4 Mapping & Bundle Generator Service
 *
 * Implements NRCES / ABDM OPConsultRecord FHIR R4 Profile specifications:
 * Profile URL: https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord
 * 
 * Maps MediKiosk models (Patient, OpdVisit, ClinicalHistory, Consultation, Prescription)
 * into a standardized, valid FHIR R4 Document Bundle.
 */

const crypto = require('crypto');

/**
 * Maps MediKiosk clinical records into a FHIR R4 Bundle
 * @param {Object} params
 * @param {Object} params.patient - Patient model instance
 * @param {Object} [params.opdVisit] - OpdVisit model instance
 * @param {Object} [params.clinicalHistory] - ClinicalHistory model instance
 * @param {Object} [params.consultation] - Consultation model instance
 * @param {Array} [params.prescriptions] - Array of Prescription instances
 * @param {Object} [params.doctor] - Doctor user instance
 * @returns {Object} FHIR R4 Bundle
 */
function createOpConsultFhirBundle({ patient, opdVisit, clinicalHistory, consultation, prescriptions = [], doctor }) {
  if (!patient) {
    throw new Error('Patient record is required to generate FHIR R4 Bundle');
  }

  const nowIso = new Date().toISOString();
  const bundleId = `bundle-${patient._id}-${Date.now()}`;
  const patientResId = `patient-${patient._id}`;
  const encounterResId = opdVisit ? `encounter-${opdVisit._id}` : `encounter-${Date.now()}`;
  const doctorResId = doctor ? `practitioner-${doctor._id || doctor.id}` : `practitioner-attending`;
  const compositionResId = `composition-${Date.now()}`;

  const entries = [];

  // 1. Patient Resource
  const genderMap = {
    'Male': 'male',
    'Female': 'female',
    'Other': 'other'
  };

  const fhirPatient = {
    resourceType: 'Patient',
    id: patientResId,
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient']
    },
    identifier: [
      {
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'MR',
            display: 'Medical record number'
          }]
        },
        system: 'https://hospital.gov.in/uhid',
        value: patient.uhid || `UHID-${patient._id.toString().slice(-8)}`
      },
      {
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'BN',
            display: 'ABHA ID / National Health ID'
          }]
        },
        system: 'https://healthid.ndhm.gov.in',
        value: patient.abhaId || `ABHA-${patient._id.toString().slice(-8)}`
      }
    ],
    name: [
      {
        text: patient.name || 'Anonymous Patient',
        family: patient.name ? patient.name.split(' ').slice(1).join(' ') || undefined : undefined,
        given: patient.name ? [patient.name.split(' ')[0]] : undefined
      }
    ],
    telecom: patient.contactNumber ? [
      {
        system: 'phone',
        value: patient.contactNumber,
        use: 'mobile'
      }
    ] : [],
    gender: genderMap[patient.gender] || 'unknown',
    birthDate: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : undefined,
    address: [
      {
        use: 'home',
        text: patient.address || patient.addressDetails?.address || undefined,
        city: patient.addressDetails?.district || undefined,
        state: patient.addressDetails?.state || undefined,
        postalCode: patient.addressDetails?.pincode || undefined,
        country: 'India'
      }
    ]
  };

  // 2. Encounter Resource
  const encounterStatus = opdVisit?.status === 'COMPLETED' ? 'finished' : 'in-progress';
  const fhirEncounter = {
    resourceType: 'Encounter',
    id: encounterResId,
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Encounter']
    },
    status: encounterStatus,
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory'
    },
    subject: {
      reference: `Patient/${patientResId}`,
      display: patient.name
    },
    period: {
      start: opdVisit?.registeredAt ? new Date(opdVisit.registeredAt).toISOString() : nowIso,
      end: opdVisit?.completedAt ? new Date(opdVisit.completedAt).toISOString() : undefined
    },
    serviceType: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '408443003',
        display: opdVisit?.departmentName || patient.department || 'General Medicine'
      }],
      text: opdVisit?.departmentName || patient.department || 'General Medicine'
    }
  };

  // 3. Practitioner Resource (Doctor)
  const doctorName = doctor?.name || (consultation ? 'Consulting Physician' : 'OPD Attending Physician');
  const fhirPractitioner = {
    resourceType: 'Practitioner',
    id: doctorResId,
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Practitioner']
    },
    name: [
      {
        prefix: ['Dr.'],
        text: doctorName
      }
    ]
  };

  // 4. Condition Resources (Diagnosis & Presenting Complaints)
  const fhirConditions = [];
  const conditionRefs = [];

  const mainConditionText = consultation?.diagnosis || 
                            clinicalHistory?.presentingComplaint || 
                            patient.basicHealth?.reasonForVisit;

  if (mainConditionText) {
    const condId = `condition-${Date.now()}-1`;
    fhirConditions.push({
      resourceType: 'Condition',
      id: condId,
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition']
      },
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
          display: 'Active'
        }]
      },
      verificationStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: consultation?.diagnosis ? 'confirmed' : 'provisional',
          display: consultation?.diagnosis ? 'Confirmed' : 'Provisional'
        }]
      },
      code: {
        text: mainConditionText
      },
      subject: {
        reference: `Patient/${patientResId}`,
        display: patient.name
      },
      encounter: {
        reference: `Encounter/${encounterResId}`
      },
      recordedDate: nowIso
    });
    conditionRefs.push({ reference: `Condition/${condId}`, display: mainConditionText });
  }

  // 5. MedicationRequest Resources
  const fhirMedicationRequests = [];
  const medRefs = [];

  if (prescriptions && prescriptions.length > 0) {
    prescriptions.forEach((rx, rxIdx) => {
      if (rx.items && Array.isArray(rx.items)) {
        rx.items.forEach((item, itemIdx) => {
          const medId = `medreq-${rx._id || 'rx'}-${rxIdx}-${itemIdx}`;
          fhirMedicationRequests.push({
            resourceType: 'MedicationRequest',
            id: medId,
            meta: {
              profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/MedicationRequest']
            },
            status: 'active',
            intent: 'order',
            medicationCodeableConcept: {
              text: `${item.medicine} ${item.dosage || ''}`.trim()
            },
            subject: {
              reference: `Patient/${patientResId}`,
              display: patient.name
            },
            authoredOn: rx.date ? new Date(rx.date).toISOString() : nowIso,
            requester: {
              reference: `Practitioner/${doctorResId}`,
              display: doctorName
            },
            dosageInstruction: [
              {
                text: `${item.dosage || ''} ${item.frequency || ''} for ${item.duration || ''} (${item.instructions || ''})`.trim(),
                route: {
                  text: item.route || 'Oral'
                }
              }
            ]
          });
          medRefs.push({ reference: `MedicationRequest/${medId}`, display: item.medicine });
        });
      }
    });
  }

  // 6. Observations (Vitals)
  const fhirObservations = [];
  const observationRefs = [];
  const vitals = patient.vitals;

  if (vitals) {
    const obsId = `obs-vitals-${Date.now()}`;
    const components = [];

    if (vitals.bp) {
      components.push({
        code: { text: 'Blood Pressure' },
        valueString: vitals.bp
      });
    }
    if (vitals.pulse) {
      components.push({
        code: { text: 'Pulse Rate' },
        valueString: vitals.pulse
      });
    }
    if (vitals.temp) {
      components.push({
        code: { text: 'Body Temperature' },
        valueString: vitals.temp
      });
    }
    if (vitals.spo2) {
      components.push({
        code: { text: 'Oxygen Saturation (SpO2)' },
        valueString: vitals.spo2
      });
    }
    if (vitals.weight) {
      components.push({
        code: { text: 'Body Weight' },
        valueString: vitals.weight
      });
    }
    if (vitals.height) {
      components.push({
        code: { text: 'Height' },
        valueString: vitals.height
      });
    }

    if (components.length > 0) {
      fhirObservations.push({
        resourceType: 'Observation',
        id: obsId,
        meta: {
          profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation']
        },
        status: 'final',
        category: [
          {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }]
          }
        ],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '85353-1',
            display: 'Vital signs, weight, height, head circumference, oxygen saturation & BMI panel'
          }],
          text: 'Vital Signs'
        },
        subject: {
          reference: `Patient/${patientResId}`,
          display: patient.name
        },
        effectiveDateTime: nowIso,
        component: components
      });
      observationRefs.push({ reference: `Observation/${obsId}`, display: 'Vital Signs' });
    }
  }

  // 7. AllergyIntolerance Resources
  const fhirAllergies = [];
  const allergyRefs = [];
  const allergiesList = clinicalHistory?.allergies || patient.basicHealth?.allergies;
  if (allergiesList && allergiesList.length > 0) {
    allergiesList.forEach((allergy, aIdx) => {
      const allId = `allergy-${Date.now()}-${aIdx}`;
      fhirAllergies.push({
        resourceType: 'AllergyIntolerance',
        id: allId,
        meta: {
          profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/AllergyIntolerance']
        },
        clinicalStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
            code: 'active',
            display: 'Active'
          }]
        },
        verificationStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
            code: 'confirmed',
            display: 'Confirmed'
          }]
        },
        code: { text: allergy },
        patient: { reference: `Patient/${patientResId}`, display: patient.name }
      });
      allergyRefs.push({ reference: `AllergyIntolerance/${allId}`, display: allergy });
    });
  }

  // 8. Composition Resource (Mandatory root for Document bundle)
  const compositionSections = [
    {
      title: 'Chief Complaints / Reason for Visit',
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '422843007',
          display: 'Chief complaint section'
        }]
      },
      text: {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${clinicalHistory?.presentingComplaint || patient.basicHealth?.reasonForVisit || 'Not specified'}</p></div>`
      },
      entry: conditionRefs
    }
  ];

  if (observationRefs.length > 0) {
    compositionSections.push({
      title: 'Vital Signs',
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '1184593002',
          display: 'Vital signs document section'
        }]
      },
      entry: observationRefs
    });
  }

  if (allergyRefs.length > 0) {
    compositionSections.push({
      title: 'Allergies and Adverse Reactions',
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '722446000',
          display: 'Allergy record'
        }]
      },
      entry: allergyRefs
    });
  }

  if (medRefs.length > 0) {
    compositionSections.push({
      title: 'Prescribed Medications',
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '761938008',
          display: 'Medical prescription record'
        }]
      },
      entry: medRefs
    });
  }

  if (consultation) {
    compositionSections.push({
      title: 'Clinical Impression and Advice',
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '423100009',
          display: 'Results section'
        }]
      },
      text: {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><strong>Impression:</strong> ${consultation.clinicalImpression || consultation.clinicalAssessment || 'Routine evaluation'}</p><p><strong>Advice:</strong> ${consultation.treatmentPlan || consultation.followUpInstructions || 'Follow prescribed regimen'}</p></div>`
      }
    });
  }

  const fhirComposition = {
    resourceType: 'Composition',
    id: compositionResId,
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord']
    },
    identifier: {
      system: 'https://hospital.gov.in/records/opconsult',
      value: `OPC-${patient.opNumber || patient._id}-${Date.now()}`
    },
    status: 'final',
    type: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '371530004',
        display: 'Clinical consultation report'
      }],
      text: 'Outpatient Consultation Record'
    },
    subject: {
      reference: `Patient/${patientResId}`,
      display: patient.name
    },
    encounter: {
      reference: `Encounter/${encounterResId}`
    },
    date: nowIso,
    author: [
      {
        reference: `Practitioner/${doctorResId}`,
        display: doctorName
      }
    ],
    title: 'MediKiosk Outpatient Consultation Record',
    section: compositionSections
  };

  // Compile full entries list (Composition MUST be the first entry in a FHIR Document bundle)
  entries.push({ fullUrl: `urn:uuid:${compositionResId}`, resource: fhirComposition });
  entries.push({ fullUrl: `urn:uuid:${patientResId}`, resource: fhirPatient });
  entries.push({ fullUrl: `urn:uuid:${encounterResId}`, resource: fhirEncounter });
  entries.push({ fullUrl: `urn:uuid:${doctorResId}`, resource: fhirPractitioner });

  fhirConditions.forEach(cond => entries.push({ fullUrl: `urn:uuid:${cond.id}`, resource: cond }));
  fhirObservations.forEach(obs => entries.push({ fullUrl: `urn:uuid:${obs.id}`, resource: obs }));
  fhirAllergies.forEach(all => entries.push({ fullUrl: `urn:uuid:${all.id}`, resource: all }));
  fhirMedicationRequests.forEach(med => entries.push({ fullUrl: `urn:uuid:${med.id}`, resource: med }));

  const bundle = {
    resourceType: 'Bundle',
    id: bundleId,
    meta: {
      versionId: '1',
      lastUpdated: nowIso,
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord']
    },
    identifier: {
      system: 'https://medikiosk.gov.in/fhir/bundles',
      value: bundleId
    },
    type: 'document',
    timestamp: nowIso,
    entry: entries
  };

  return bundle;
}

module.exports = {
  createOpConsultFhirBundle
};
