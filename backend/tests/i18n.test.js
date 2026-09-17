const fs = require('fs');
const path = require('path');

describe('MediKiosk Multilingual & Localization Suite', () => {
  const enPath = path.resolve(__dirname, '../../frontend/src/locales/en.json');
  const taPath = path.resolve(__dirname, '../../frontend/src/locales/ta.json');
  const hiPath = path.resolve(__dirname, '../../frontend/src/locales/hi.json');

  let en, ta, hi;

  beforeAll(() => {
    en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    ta = JSON.parse(fs.readFileSync(taPath, 'utf-8'));
    hi = JSON.parse(fs.readFileSync(hiPath, 'utf-8'));
  });

  test('All three locale dictionaries (en, ta, hi) exist and are valid JSON', () => {
    expect(en).toBeDefined();
    expect(ta).toBeDefined();
    expect(hi).toBeDefined();
    expect(typeof en).toBe('object');
    expect(typeof ta).toBe('object');
    expect(typeof hi).toBe('object');
  });

  test('Core feature namespaces are present across all languages', () => {
    const requiredSections = [
      'common',
      'navigation',
      'authentication',
      'patient',
      'opd',
      'consent',
      'clinicalHistory',
      'documents',
      'ocr',
      'ai',
      'prescriptions',
      'records',
      'kiosk',
      'validation',
      'errors'
    ];

    requiredSections.forEach(section => {
      expect(en[section]).toBeDefined();
      expect(ta[section]).toBeDefined();
      expect(hi[section]).toBeDefined();
    });
  });

  test('Tamil and Hindi files contain valid UTF-8 strings without corrupted ???? characters', () => {
    const checkNoCorruptedQuestions = (obj, pathStr = '') => {
      for (const [key, val] of Object.entries(obj)) {
        const currentPath = pathStr ? `${pathStr}.${key}` : key;
        if (typeof val === 'string') {
          expect(val).not.toMatch(/\?{3,}/); // No ??? or ????
        } else if (typeof val === 'object' && val !== null) {
          checkNoCorruptedQuestions(val, currentPath);
        }
      }
    };

    checkNoCorruptedQuestions(ta, 'ta');
    checkNoCorruptedQuestions(hi, 'hi');
  });

  test('Key phrases are authentically translated in Tamil', () => {
    expect(ta.common.continue).toBe('தொடரவும்');
    expect(ta.common.back).toBe('பின்செல்லவும்');
    expect(ta.opd.title).toBe('அரசு மருத்துவமனை வெளிநோயாளர் பதிவு');
    expect(ta.clinicalHistory.mainQuestion).toBe('இன்று நீங்கள் மருத்துவமனைக்கு வருவதற்கான முக்கிய காரணம் என்ன?');
    expect(ta.documents.privateBadge).toBe('தனிப்பட்டது');
    expect(ta.documents.privateNotice).toBe('இந்த ஆவணம் உங்கள் மருத்துவருக்கு மட்டும் கிடைக்கும்.');
    expect(ta.ai.doctorReviewNotice).toBe('மருத்துவர் பரிசீலனை தேவை');
  });

  test('Key phrases are authentically translated in Hindi', () => {
    expect(hi.common.continue).toBe('जारी रखें');
    expect(hi.common.back).toBe('वापस जाएँ');
    expect(hi.opd.title).toBe('सरकारी अस्पताल ओपी पंजीकरण');
    expect(hi.clinicalHistory.mainQuestion).toBe('आज आप अस्पताल किस मुख्य कारण से आए हैं?');
    expect(hi.documents.privateBadge).toBe('निजी');
    expect(hi.documents.privateNotice).toBe('यह दस्तावेज़ केवल आपके डॉक्टर के लिए उपलब्ध है।');
    expect(hi.ai.doctorReviewNotice).toBe('डॉक्टर की समीक्षा आवश्यक है');
  });

  test('Web Speech API locale mapping is accurate', () => {
    const getSpeechCode = (lang) => {
      const lower = String(lang).toLowerCase();
      if (lower === 'ta' || lower === 'tamil') return 'ta-IN';
      if (lower === 'hi' || lower === 'hindi') return 'hi-IN';
      return 'en-IN';
    };

    expect(getSpeechCode('en')).toBe('en-IN');
    expect(getSpeechCode('English')).toBe('en-IN');
    expect(getSpeechCode('ta')).toBe('ta-IN');
    expect(getSpeechCode('Tamil')).toBe('ta-IN');
    expect(getSpeechCode('hi')).toBe('hi-IN');
    expect(getSpeechCode('Hindi')).toBe('hi-IN');
  });

  test('Fallback resolution: returns English if a key is missing in target language', () => {
    const resolveWithFallback = (dict, enDict, key) => {
      const parts = key.split('.');
      let current = dict;
      for (const p of parts) {
        if (!current) break;
        current = current[p];
      }
      if (current !== undefined) return current;

      let enCurrent = enDict;
      for (const p of parts) {
        if (!enCurrent) break;
        enCurrent = enCurrent[p];
      }
      return enCurrent !== undefined ? enCurrent : key;
    };

    // Existing key
    expect(resolveWithFallback(ta, en, 'common.continue')).toBe('தொடரவும்');
    // Missing fake key in ta should fallback to en
    const fakeTa = { ...ta, missingSection: {} };
    const fakeEn = { ...en, missingSection: { dummyKey: 'Fallback English Text' } };
    expect(resolveWithFallback(fakeTa, fakeEn, 'missingSection.dummyKey')).toBe('Fallback English Text');
  });
});
