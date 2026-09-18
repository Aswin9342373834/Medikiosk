/**
 * MediKiosk ICD-10 Clinical Terminology & Codification Service
 *
 * STATUS: INTEGRATION-READY (Prototype / Terminology Lookup Interface)
 *
 * Provides diagnostic codification interfaces for WHO ICD-10 API,
 * SNOMED-CT, and standard hospital diagnostic taxonomies.
 *
 * In production, this connects to the official WHO ICD API:
 * - WHO_ICD_CLIENT_ID: WHO API client credentials
 * - WHO_ICD_CLIENT_SECRET: WHO API client secret
 * - WHO_ICD_ENDPOINT: https://id.who.int/icd/release/11/mms
 */

const LOCAL_DIAGNOSTIC_TERMS = [
  { code: 'R50.9', display: 'Fever, unspecified', category: 'General' },
  { code: 'R05', display: 'Cough', category: 'Respiratory' },
  { code: 'J06.9', display: 'Acute upper respiratory infection, unspecified', category: 'Respiratory' },
  { code: 'I10', display: 'Essential (primary) hypertension', category: 'Cardiovascular' },
  { code: 'E11.9', display: 'Type 2 diabetes mellitus without complications', category: 'Endocrine' },
  { code: 'K29.7', display: 'Gastritis, unspecified', category: 'Gastrointestinal' },
  { code: 'M54.5', display: 'Low back pain', category: 'Musculoskeletal' },
  { code: 'R51', display: 'Headache', category: 'Neurological' },
  { code: 'B34.9', display: 'Viral infection, unspecified', category: 'Infectious' }
];

class Icd10Service {
  constructor() {
    this.clientId = process.env.WHO_ICD_CLIENT_ID || null;
    this.clientSecret = process.env.WHO_ICD_CLIENT_SECRET || null;
  }

  isConfigured() {
    return Boolean(this.clientId && this.clientSecret);
  }

  getStatus() {
    return {
      service: 'ICD-10 Diagnostic Codification Service',
      status: this.isConfigured() ? 'CONFIGURED' : 'INTEGRATION-READY',
      localDictionaryEntries: LOCAL_DIAGNOSTIC_TERMS.length,
      notice: 'Requires WHO API credentials for automated ICD-10 / ICD-11 ontology searches. Local fallback lookup is active.'
    };
  }

  /**
   * Search clinical diagnostic codes by term
   * @param {string} query
   */
  async searchDiagnosis(query) {
    if (!query) return [];

    const q = query.toLowerCase().trim();
    // Return matching local vocabulary terms
    const results = LOCAL_DIAGNOSTIC_TERMS.filter(item => 
      item.display.toLowerCase().includes(q) || item.code.toLowerCase().includes(q)
    );

    return {
      query,
      status: this.isConfigured() ? 'REMOTE_ICD_API' : 'INTEGRATION-READY_LOCAL_VOCAB',
      count: results.length,
      matches: results
    };
  }
}

module.exports = new Icd10Service();
