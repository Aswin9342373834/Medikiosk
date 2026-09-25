/**
 * MediKiosk Clinically Conservative Medicine Matching Utility
 *
 * Rules:
 * - Normalizes whitespace, punctuation, and capitalization.
 * - Extracts strength (e.g., '500mg', '10 mg' -> '500mg').
 * - Preserves formulations (Tablet, Syrup, Capsule, Injection, etc.).
 * - Conservative matching: Does NOT equate 500mg with 650mg.
 * - Does NOT equate Syrup with Tablet.
 */

// Common dosage forms
const DOSAGE_FORMS = [
  'tablet', 'tab', 'tablets',
  'capsule', 'cap', 'capsules',
  'syrup', 'syr',
  'injection', 'inj',
  'ointment', 'cream', 'gel',
  'drops', 'drop',
  'sachet', 'powder',
  'inhaler', 'spray'
];

/**
 * Normalize dosage form string into canonical category
 */
function normalizeDosageForm(form) {
  if (!form || typeof form !== 'string') return null;
  const f = form.toLowerCase().trim();
  if (f.includes('tab')) return 'Tablet';
  if (f.includes('cap')) return 'Capsule';
  if (f.includes('syr') || f.includes('liquid') || f.includes('suspension')) return 'Syrup';
  if (f.includes('inj')) return 'Injection';
  if (f.includes('ointment') || f.includes('cream') || f.includes('gel')) return 'Ointment';
  if (f.includes('drop')) return 'Drops';
  if (f.includes('sachet') || f.includes('powder')) return 'Sachet';
  if (f.includes('inhaler') || f.includes('spray')) return 'Inhaler';
  return 'Tablet';
}

/**
 * Extract canonical strength string (e.g., '500mg', '10mg', '2.5mg')
 */
function extractStrength(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|iu|%)\b/i);
  if (match) {
    return `${match[1].toLowerCase()}${match[2].toLowerCase()}`;
  }
  return null;
}

/**
 * Extract base medicine name stripped of strength, units, and dosage forms
 */
function extractBaseName(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text.toLowerCase()
    .replace(/\b\d+(?:\.\d+)?\s*(mg|mcg|g|ml|iu|%)\b/gi, '')
    .replace(/\b(tablet|tab|tablets|capsule|cap|capsules|syrup|syr|injection|inj|drops|sachet)\b/gi, '')
    .replace(/[(),\-–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

/**
 * Check whether a requested prescription item matches a pharmacy inventory item
 *
 * @param {Object} queryItem
 *   - medicine / medicineName
 *   - dosage / strength
 *   - dosageForm / form
 * @param {Object} inventoryItem
 *   - medicineName
 *   - brandName
 *   - strength
 *   - dosageForm
 *   - inStock
 */
function matchesMedicine(queryItem, inventoryItem) {
  if (!inventoryItem || !inventoryItem.inStock) return false;

  const queryName = queryItem.medicine || queryItem.medicineName || queryItem.name || '';
  const inventoryName = inventoryItem.medicineName || '';
  const inventoryBrand = inventoryItem.brandName || '';

  const qBase = extractBaseName(queryName);
  const invBase = extractBaseName(inventoryName);
  const invBrandBase = extractBaseName(inventoryBrand);

  // 1. Base Name Matching: query name must match generic or brand name
  const nameMatches = (
    (qBase && invBase && (qBase.includes(invBase) || invBase.includes(qBase))) ||
    (qBase && invBrandBase && (qBase.includes(invBrandBase) || invBrandBase.includes(qBase)))
  );

  if (!nameMatches) return false;

  // 2. Strength Matching (Clinically conservative)
  // Determine query strength from queryItem.strength or queryItem.dosage or queryName
  const qStrength = extractStrength(queryItem.strength) ||
                    extractStrength(queryItem.dosage) ||
                    extractStrength(queryName);

  const invStrength = extractStrength(inventoryItem.strength) ||
                      extractStrength(inventoryName);

  // If query specifies a strength, inventory MUST have the exact matching strength
  if (qStrength && invStrength) {
    if (qStrength !== invStrength) {
      return false; // Mismatch! e.g., 500mg vs 650mg
    }
  }

  // 3. Dosage Form Matching (if specified in both)
  const qForm = normalizeDosageForm(queryItem.dosageForm || queryItem.form || queryItem.route || queryName);
  const invForm = normalizeDosageForm(inventoryItem.dosageForm || inventoryName);

  if (qForm && invForm) {
    // If one is liquid/syrup and the other is tablet/capsule, do not conflate
    const isLiquidQ = qForm === 'Syrup' || qForm === 'Drops';
    const isLiquidInv = invForm === 'Syrup' || invForm === 'Drops';
    if (isLiquidQ !== isLiquidInv) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate geographical distance in kilometers using the Haversine formula
 *
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in kilometers rounded to 1 decimal place
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

module.exports = {
  matchesMedicine,
  extractStrength,
  extractBaseName,
  normalizeDosageForm,
  calculateHaversineDistance
};
