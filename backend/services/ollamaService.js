const axios = require('axios');
require('dotenv').config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'deepseek-r1:8b';

// Safety Guardrail: Clinical attention item keywords for rules-based backup
const RED_FLAG_KEYWORDS = [
  { term: /chest pain|angina|heart attack/i, flag: 'Potential severe acute chest pain' },
  { term: /breathless|shortness of breath|dyspnea|cannot breathe|suffocation/i, flag: 'Potential severe breathing difficulty' },
  { term: /unconscious|blackout|syncope|fainted|loss of consciousness/i, flag: 'Potential loss of consciousness' },
  { term: /heavy bleeding|hemorrhage|blood vomit|rectal bleeding/i, flag: 'Potential severe bleeding' },
  { term: /paralysis|slurred speech|face drooping|stroke/i, flag: 'Potential stroke-like neurological symptoms' },
  { term: /anaphylaxis|swelling face|throat closing/i, flag: 'Potential severe allergic reaction' },
  { term: /suicid|harm myself|end life/i, flag: 'Potential self-harm statement' },
  { term: /severe abdominal pain|rigid abdomen/i, flag: 'Potential acute abdomen' },
  { term: /pregnancy bleeding|labor pain|eclampsia/i, flag: 'Potential high-risk pregnancy symptom' }
];

function ruleBasedRedFlagScan(data) {
  if (!data) return [];
  const stringified = typeof data === 'string' ? data : JSON.stringify(data);
  const detected = [];
  for (const item of RED_FLAG_KEYWORDS) {
    if (item.term.test(stringified)) {
      detected.push(item.flag);
    }
  }
  return detected;
}

function extractJSON(rawText) {
  if (!rawText) throw new Error('Empty response from AI');
  let clean = rawText.trim();
  
  // Remove markdown code fences if present
  if (clean.includes('```json')) {
    clean = clean.replace(/```json\s*/gi, '').replace(/```/g, '');
  } else if (clean.includes('```')) {
    clean = clean.replace(/```/g, '');
  }
  
  // Strip <think>...</think> tags if deepseek-r1 reasoning tags are output
  clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Find first { and last }
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(clean);
}

const ollamaService = {
  async getAvailableModel() {
    try {
      const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 2500 });
      const models = response.data?.models || [];
      if (models.length === 0) return null;
      
      const found = models.find(m => m.name === DEFAULT_MODEL || m.name.startsWith(DEFAULT_MODEL.split(':')[0]));
      if (found) return found.name;
      return models[0].name;
    } catch (e) {
      return null;
    }
  },

  async callOllamaWithRetry(systemPrompt, userPrompt, retries = 1) {
    const activeModel = await this.getAvailableModel();
    if (!activeModel) {
      throw new Error('Ollama service is not running or no model is installed.');
    }

    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, {
          model: activeModel,
          messages: [
            { 
              role: 'system', 
              content: `${systemPrompt}\nIMPORTANT: Do NOT diagnose or prescribe medication. You are an assistive medical intake summarizer. Return ONLY raw valid JSON without commentary.` 
            },
            { role: 'user', content: userPrompt }
          ],
          stream: false,
          format: 'json',
          options: {
            temperature: 0.2
          }
        }, { timeout: 35000 });

        const content = response.data?.message?.content;
        return extractJSON(content);
      } catch (err) {
        lastError = err;
        console.warn(`Ollama call attempt ${attempt + 1} failed: ${err.message}`);
        userPrompt += '\nCRITICAL: Output valid JSON syntax only, no extra words.';
      }
    }
    throw lastError || new Error('Ollama generation failed after retry');
  },

  async generateClinicalSummary(patientData, ocrData = []) {
    const ruleFlags = ruleBasedRedFlagScan({ patientData, ocrData });

    const systemPrompt = `You are an AI Clinical History Intake Assistant for Indian Government Hospital OPDs.
Assist the physician by structuring the patient's narrative history.
AI SAFETY RULES:
1. You MUST NOT make a medical diagnosis.
2. You MUST NOT prescribe or alter treatments.
3. Label all outputs as AI-Assisted Clinical Summary (Requires Doctor Review).
4. If symptoms might be critical, flag under "redFlags" as "Potential Clinical Attention Item".
Return JSON with keys:
{
  "presentingComplaint": string,
  "historyOfPresentIllness": string,
  "pastMedicalHistory": string[],
  "pastSurgicalHistory": string[],
  "medications": string[],
  "allergies": string[],
  "familyHistory": string,
  "personalHistory": string,
  "socialHistory": string,
  "reviewOfSystems": string[],
  "investigations": string[],
  "documentFindings": string[],
  "redFlags": string[],
  "doctorAttentionItems": string[],
  "missingInformation": string[]
}`;

    const userPrompt = `Patient Intake Information:\n${JSON.stringify(patientData, null, 2)}\n\nDocument OCR Data:\n${JSON.stringify(ocrData, null, 2)}`;

    try {
      const summary = await this.callOllamaWithRetry(systemPrompt, userPrompt);
      const combinedRedFlags = Array.from(new Set([...(summary.redFlags || []), ...ruleFlags]));
      summary.redFlags = combinedRedFlags;
      summary.potentialClinicalAttentionItems = combinedRedFlags;
      summary.doctorReviewNotice = 'REQUIRES DOCTOR REVIEW';
      return {
        success: true,
        summary,
        aiStatus: 'Completed'
      };
    } catch (error) {
      console.warn('Ollama unavailable or failed. Using safe deterministic structuring:', error.message);
      return {
        success: false,
        summary: {
          presentingComplaint: patientData.complaint || patientData.presentingComplaint || 'Not specified',
          historyOfPresentIllness: patientData.hpi || patientData.historyOfPresentIllness || 'Information recorded by patient at kiosk.',
          pastMedicalHistory: Array.isArray(patientData.pastMedicalHistory) ? patientData.pastMedicalHistory : (patientData.pmh ? [patientData.pmh] : (patientData.pastMedicalHistory ? [patientData.pastMedicalHistory] : [])),
          pastSurgicalHistory: Array.isArray(patientData.pastSurgicalHistory) ? patientData.pastSurgicalHistory : (patientData.psh ? [patientData.psh] : (patientData.pastSurgicalHistory ? [patientData.pastSurgicalHistory] : [])),
          medications: Array.isArray(patientData.medications) ? patientData.medications.map(m => typeof m === 'object' && m ? (m.name || JSON.stringify(m)) : String(m)) : (patientData.medications ? [String(patientData.medications)] : []),
          allergies: Array.isArray(patientData.allergies) ? patientData.allergies.map(String) : (patientData.allergies ? [String(patientData.allergies)] : []),
          familyHistory: patientData.familyHistory || '',
          personalHistory: patientData.personalHistory || '',
          socialHistory: patientData.socialHistory || '',
          reviewOfSystems: patientData.ros ? [patientData.ros] : [],
          investigations: [],
          documentFindings: [],
          redFlags: ruleFlags,
          potentialClinicalAttentionItems: ruleFlags,
          doctorAttentionItems: ruleFlags.map(f => `Potential Clinical Attention Item: ${f}`),
          missingInformation: ['Detailed physician clinical examination pending'],
          doctorReviewNotice: 'REQUIRES DOCTOR REVIEW',
          aiNote: 'AI processing is temporarily unavailable. Your information has been saved and can be reviewed manually.'
        },
        aiStatus: 'Unavailable',
        error: error.message
      };
    }
  },

  async generateAdaptiveQuestions(currentHistory, language = 'English') {
    const complaint = currentHistory.complaint || currentHistory.presentingComplaint || '';
    
    const systemPrompt = `You are a clinical history taking assistant.
Based on the patient complaint, generate the next logical follow-up question to clarify onset, duration, character, radiation, aggravating/relieving factors, or associated symptoms.
Language for question and options must be: ${language}.
Return JSON only:
{
  "question": string,
  "options": string[]
}`;

    const userPrompt = `Patient complaint so far: ${JSON.stringify(currentHistory)}`;

    try {
      const response = await this.callOllamaWithRetry(systemPrompt, userPrompt);
      if (response && response.question && Array.isArray(response.options)) {
        return response;
      }
    } catch (e) {
      // Deterministic fallback
    }

    const lower = complaint.toLowerCase();
    const isTamil = language === 'Tamil' || language === 'ta';
    const isHindi = language === 'Hindi' || language === 'hi';

    if (lower.includes('chest pain') || lower.includes('நெஞ்சு வலி') || lower.includes('सीने में दर्द')) {
      return {
        question: isTamil ? 'நெஞ்சு வலி எப்போது தொடங்கியது?' : isHindi ? 'सीने में दर्द कब शुरू हुआ?' : 'When did the chest pain start?',
        options: isTamil ? ['இன்று', 'நேற்று', 'சில நாட்களுக்கு முன்', 'ஒரு வாரத்திற்கும் முன்'] : isHindi ? ['आज', 'कल', 'कुछ दिन पहले', 'एक सप्ताह से अधिक'] : ['Today', 'Yesterday', 'A few days ago', 'More than a week']
      };
    } else if (lower.includes('fever') || lower.includes('காய்ச்சல்') || lower.includes('बुखार')) {
      return {
        question: isTamil ? 'காய்ச்சலுடன் நடுக்கம் அல்லது குளிர்காய்ச்சல் உள்ளதா?' : isHindi ? 'क्या बुखार के साथ कंपकंपी या ठंड लग रही है?' : 'Do you have chills or shivering with fever?',
        options: isTamil ? ['ஆம், நடுக்கத்துடன்', 'நடுக்கம் இல்லை', 'இரவில் மட்டும்', 'தொடர்ச்சியாக'] : isHindi ? ['हाँ, कंपकंपी के साथ', 'कंपकंपी नहीं है', 'केवल रात में', 'लगातार'] : ['Yes, with shivering', 'No shivering', 'Only at night', 'Continuous']
      };
    } else if (lower.includes('cough') || lower.includes('இருமல்') || lower.includes('खांसी')) {
      return {
        question: isTamil ? 'இருமல் வறட்டு இருமலா அல்லது சளியுடன் வருகிறதா?' : isHindi ? 'क्या आपकी खांसी सूखी है या बलगम वाली?' : 'Is your cough dry or with phlegm/sputum?',
        options: isTamil ? ['வறட்டு இருமல்', 'சளியுடன் கூடிய இருமல்', 'சளியில் இரத்தம்', 'மூச்சுத் திணறலுடன்'] : isHindi ? ['सूखी खांसी', 'बलगम वाली खांसी', 'बलगम में खून', 'सांस फूलने के साथ'] : ['Dry cough', 'Wet cough with sputum', 'Blood in sputum', 'Associated breathlessness']
      };
    }

    return {
      question: isTamil ? 'இந்த அறிகுறிகள் எவ்வளவு காலமாக உள்ளன?' : isHindi ? 'ये लक्षण कितने समय से हैं?' : 'How long have you experienced these symptoms?',
      options: isTamil ? ['1-2 நாட்கள்', 'ஒரு வாரத்திற்குள்', '1 முதல் 4 வாரங்கள்', 'ஒரு மாதத்திற்கும் மேலாக'] : isHindi ? ['1-2 दिन', 'एक सप्ताह से कम', '1 से 4 सप्ताह', 'एक महीने से अधिक'] : ['1-2 days', 'Less than a week', '1 to 4 weeks', 'More than a month']
    };
  },

  async analyzeExtractedDocument(ocrText) {
    if (!ocrText || ocrText.trim().length === 0) {
      return {
        diagnoses: [],
        medications: [],
        investigations: [],
        procedures: [],
        hospital: 'Not found',
        doctor: 'Not found',
        date: null
      };
    }

    const systemPrompt = `You are a medical record entity extractor.
Extract clinical entities explicitly mentioned in the medical document text.
Do NOT invent or fabricate any missing values. Use null or omit if not found.
Return JSON only:
{
  "diagnoses": string[],
  "medications": [
    { "name": string, "dosage": string, "frequency": string, "duration": string }
  ],
  "investigations": [
    { "test": string, "result": string, "value": string, "unit": string, "referenceRange": string }
  ],
  "procedures": string[],
  "hospital": string,
  "doctor": string
}`;

    const userPrompt = `Document OCR Text:\n${ocrText}`;

    try {
      const extracted = await this.callOllamaWithRetry(systemPrompt, userPrompt);
      return extracted;
    } catch (e) {
      const diagnoses = [];
      const medications = [];
      const investigations = [];

      const hbMatch = ocrText.match(/Hb|Hemoglobin\s*[:=-]?\s*([0-9.]+)\s*(g\/dL|gm%|g%)/i);
      if (hbMatch) {
        investigations.push({
          test: 'Hemoglobin (Hb)',
          result: hbMatch[1],
          value: hbMatch[1],
          unit: hbMatch[2],
          referenceRange: '12.0 - 16.0 g/dL'
        });
      }

      const bpMatch = ocrText.match(/BP\s*[:=-]?\s*([0-9]{2,3}\/[0-9]{2,3})/i);
      if (bpMatch) {
        investigations.push({
          test: 'Blood Pressure',
          result: bpMatch[1],
          value: bpMatch[1],
          unit: 'mmHg',
          referenceRange: '120/80 mmHg'
        });
      }

      return {
        diagnoses,
        medications,
        investigations,
        procedures: [],
        hospital: 'Source Document',
        doctor: 'Not found'
      };
    }
  },

  async generateDoctorReviewSummary(clinicalHistory, documents) {
    const summary = clinicalHistory.aiSummary || clinicalHistory.historyOfPresentIllness || 'Patient intake collected.';
    return {
      status: 'Physician Review Ready',
      summary: summary,
      redFlags: clinicalHistory.redFlags || [],
      attentionItems: clinicalHistory.doctorAttentionItems || []
    };
  }
};

module.exports = ollamaService;
