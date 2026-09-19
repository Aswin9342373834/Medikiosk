'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VoiceInput } from '../../../components/VoiceInput';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { useTranslation } from '../../../contexts/LanguageContext';
import api from '../../../lib/api';
import {
  Building2, Mic, ArrowRight, ArrowLeft, AlertTriangle,
  CheckCircle2, Sparkles, Activity, ShieldCheck, HeartPulse, Stethoscope
} from 'lucide-react';

export default function PatientClinicalHistoryWizard() {
  const router = useRouter();
  const { t, language, speechLang } = useTranslation();
  const [step, setStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [activeVisit, setActiveVisit] = useState<any>(null);
  const [checkingVisit, setCheckingVisit] = useState<boolean>(true);
  const [consentAgreed, setConsentAgreed] = useState<boolean>(false);

  // Conversational clinical history state
  const [formData, setFormData] = useState({
    presentingComplaint: '',
    onset: '1-3 days ago',
    duration: 'Intermittent',
    severity: 'Moderate',
    location: '',
    aggravatingFactors: '',
    relievingFactors: '',
    associatedSymptoms: [] as string[],
    pastMedicalHistory: [] as string[],
    pastSurgicalHistory: [] as string[],
    medications: '',
    allergies: '',
    familyHistory: '',
    personalHistory: 'Non-smoker, non-alcoholic',
    socialHistory: '',
    reviewOfSystems: [] as string[],

    // AYUSH
    department: 'General Medicine',
    ayushMode: false,
    ayushData: {
      prakriti: 'Vata-Pitta',
      vikriti: 'Agni-mandya',
      agni: 'Manda (Low digestive fire)',
      koshtha: 'Madhyama',
      ahara: 'Vegetarian, irregular timing',
      vihara: 'Sedentary desk work, late sleep',
      nidana: 'Indigestion and erratic meal schedule',
      samprapti: 'Pitta-Kapha vitiation'
    },

    consentGiven: false
  });

  // Verify authentication and fetch authoritative OPD visit
  React.useEffect(() => {
    const checkAuthAndVisit = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        router.push('/login?redirect=/patient/clinical-history');
        return;
      }

      try {
        const visitRes = await api.getActiveOpdVisit();
        if (visitRes.success && visitRes.data) {
          const v = visitRes.data;
          setActiveVisit(v);
          const isAyush = v.clinicalMode === 'AYUSH' || (v.department?.clinicalMode === 'AYUSH') || (v.departmentId?.clinicalMode === 'AYUSH');
          setFormData(prev => ({
            ...prev,
            department: v.departmentName || v.department?.name || v.departmentId?.name || prev.department,
            ayushMode: isAyush
          }));
        }
      } catch (err) {
        console.log('No active OPD visit or load error', err);
      } finally {
        setCheckingVisit(false);
      }
    };

    checkAuthAndVisit();
  }, [router]);

  const [attentionItems, setAttentionItems] = useState<string[]>([]);
  const [adaptiveQuestion, setAdaptiveQuestion] = useState<{
    question: string;
    options: string[];
  }>({
    question: 'How quickly did the symptom or pain start?',
    options: ['Suddenly within hours', 'Gradually over 2-3 days', 'Persistent for weeks', 'Comes and goes']
  });

  const handleConsentProceed = async () => {
    if (!consentAgreed) return;
    setFormData(prev => ({ ...prev, consentGiven: true }));
    try {
      await api.recordConsent({
        purpose: 'OPD_CONSULTATION',
        consentGiven: true,
        version: 'v1.0-ABDM'
      });
    } catch (e) {
      console.warn('Consent recorded locally');
    }
    setStep(1);
  };

  const handleComplaintChange = (val: string) => {
    setFormData(prev => ({ ...prev, presentingComplaint: val }));
    const lower = val.toLowerCase();
    const flags: string[] = [];

    if (lower.includes('chest pain') || lower.includes('heart') || lower.includes('सीने में दर्द') || lower.includes('நெஞ்சு வலி')) {
      flags.push('Potential Clinical Attention Item: Acute chest discomfort');
    }
    if (lower.includes('breath') || lower.includes('suffocat') || lower.includes('सांस फूलना') || lower.includes('மூச்சுத் திணறல்')) {
      flags.push('Potential Clinical Attention Item: Respiratory distress');
    }
    if (lower.includes('bleed') || lower.includes('blood') || lower.includes('खून') || lower.includes('இரத்தம்')) {
      flags.push('Potential Clinical Attention Item: Severe active bleeding');
    }
    if (lower.includes('unconscious') || lower.includes('faint') || lower.includes('बेहोश') || lower.includes('மயக்கம்')) {
      flags.push('Potential Clinical Attention Item: Altered sensorium / Syncope');
    }
    setAttentionItems(flags);
  };

  const handleComplaintSelect = async (complaint: string) => {
    handleComplaintChange(complaint);
    try {
      const res = await api.getAdaptiveQuestion({ presentingComplaint: complaint }, language);
      if (res.success && res.data) {
        setAdaptiveQuestion(res.data);
      }
    } catch (e) {}
    setStep(2);
  };

  const toggleArrayItem = (field: 'associatedSymptoms' | 'pastMedicalHistory' | 'pastSurgicalHistory' | 'reviewOfSystems', item: string) => {
    setFormData(prev => {
      const exists = prev[field].includes(item);
      return {
        ...prev,
        [field]: exists ? prev[field].filter(i => i !== item) : [...prev[field], item]
      };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        router.push('/login?redirect=/patient/clinical-history');
        return;
      }

      const payload = {
        opdVisitId: activeVisit?._id,
        presentingComplaint: formData.presentingComplaint || 'General OPD Evaluation',
        chiefComplaint: formData.presentingComplaint,
        historyOfPresentIllness: `${formData.presentingComplaint}. Onset: ${formData.onset}. Duration: ${formData.duration}. Severity: ${formData.severity}. Location: ${formData.location || 'General'}. Aggravating: ${formData.aggravatingFactors || 'None'}. Relieving: ${formData.relievingFactors || 'Rest'}.`,
        onset: formData.onset,
        duration: formData.duration,
        severity: formData.severity,
        location: formData.location,
        aggravatingFactors: formData.aggravatingFactors,
        relievingFactors: formData.relievingFactors,
        associatedSymptoms: formData.associatedSymptoms,
        pastMedicalHistory: formData.pastMedicalHistory,
        pastSurgicalHistory: formData.pastSurgicalHistory,
        medications: formData.medications ? [{ name: formData.medications, dosage: 'Regular', frequency: 'Daily', duration: 'Ongoing' }] : [],
        allergies: formData.allergies ? [formData.allergies] : [],
        familyHistory: formData.familyHistory,
        personalHistory: formData.personalHistory,
        socialHistory: formData.socialHistory,
        reviewOfSystems: formData.reviewOfSystems,
        ayushMode: formData.ayushMode,
        ayushData: formData.ayushMode ? formData.ayushData : undefined,
        consentGiven: formData.consentGiven,
        consentVersion: 'v1.0-ABDM'
      };

      const res = await api.submitClinicalHistory(payload);
      if (res.success && res.data) {
        setSubmissionResult(res.data);
        setStep(9);
      } else {
        throw new Error(res.message || t('errors.generic'));
      }
    } catch (err: any) {
      setError(err.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  // Localized touch options for Step 1
  const localizedSymptoms = (
    language === 'ta'
      ? [
          { key: 'Chest Pain', label: 'நெஞ்சு வலி' },
          { key: 'High Fever & Chills', label: 'காய்ச்சல் & நடுக்கம்' },
          { key: 'Breathing Difficulty', label: 'மூச்சுத் திணறல்' },
          { key: 'Severe Headache', label: 'கடுமையான தலைவலி' },
          { key: 'Stomach / Abdominal Pain', label: 'வயிற்று வலி / பிடிப்பு' },
          { key: 'Cough & Cold', label: 'இருமல் & சளி' },
          { key: 'Joint & Knee Pain', label: 'மூட்டு & முழங்கால் வலி' },
          { key: 'Dizziness / Weakness', label: 'தலைசுற்றல் / பலவீனம்' }
        ]
      : language === 'hi'
      ? [
          { key: 'Chest Pain', label: 'सीने में दर्द' },
          { key: 'High Fever & Chills', label: 'तेज बुखार और कंपकंपी' },
          { key: 'Breathing Difficulty', label: 'सांस लेने में तकलीफ' },
          { key: 'Severe Headache', label: 'तेज सिरदर्द' },
          { key: 'Stomach / Abdominal Pain', label: 'पेट दर्द / ऐंठन' },
          { key: 'Cough & Cold', label: 'खांसी और जुकाम' },
          { key: 'Joint & Knee Pain', label: 'जोड़ों और घुटने का दर्द' },
          { key: 'Dizziness / Weakness', label: 'चक्कर आना / कमजोरी' }
        ]
      : [
          { key: 'Chest Pain', label: 'Chest Pain' },
          { key: 'High Fever & Chills', label: 'High Fever & Chills' },
          { key: 'Breathing Difficulty', label: 'Breathing Difficulty' },
          { key: 'Severe Headache', label: 'Severe Headache' },
          { key: 'Stomach / Abdominal Pain', label: 'Stomach / Abdominal Pain' },
          { key: 'Cough & Cold', label: 'Cough & Cold' },
          { key: 'Joint & Knee Pain', label: 'Joint & Knee Pain' },
          { key: 'Dizziness / Weakness', label: 'Dizziness / Weakness' }
        ]
  );

  // Localized touch options for onset (Step 2)
  const onsetOptions = [
    { value: 'Today', label: t('clinicalHistory.today') },
    { value: 'Yesterday', label: t('clinicalHistory.yesterday') },
    { value: 'This week', label: t('clinicalHistory.thisWeek') },
    { value: 'More than a week ago', label: t('clinicalHistory.moreThanWeek') },
    { value: 'Not sure', label: t('clinicalHistory.notSure') }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">

      {/* Top Header */}
      <div className="bg-[#0b1b3d] text-white py-2.5 px-3 sm:px-8 border-b border-blue-900">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center text-xs gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span className="font-bold">{t('clinicalHistory.title')}</span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <Link href="/patient" className="text-blue-300 hover:text-white font-bold transition">
              &larr; {t('common.back')}
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">

        {/* Urgent Triage Warning */}
        {attentionItems.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex items-start gap-3 text-red-900">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-black text-red-950 block">
                {t('clinicalHistory.redFlagTitle').toUpperCase()}:
              </strong>
              <span className="text-xs sm:text-sm font-semibold">{attentionItems.join(' • ')}</span>
              <p className="text-xs text-red-700 mt-1">
                {t('clinicalHistory.redFlagAlert')}
              </p>
            </div>
          </div>
        )}

        {/* Active Visit Banner with Authoritative Clinical Mode */}
        {activeVisit && (
          <div className="mb-4 p-4 bg-white border-2 border-slate-200 shadow-sm rounded-2xl flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-[#1e40af]" />
              <div>
                <span className="font-black text-slate-900 text-sm">OPD Token: {activeVisit.tokenNumber}</span>
                <span className="text-slate-600 font-semibold ml-2">• {activeVisit.departmentName || activeVisit.department?.name || activeVisit.departmentId?.name || formData.department}</span>
                {activeVisit.queueNumber && <span className="text-slate-500 font-bold ml-1.5">(Queue #{activeVisit.queueNumber})</span>}
              </div>
            </div>

            {/* Dedicated Standout CLINICAL MODE Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full font-black uppercase text-xs tracking-wider flex items-center gap-1.5 border-2 ${
                (activeVisit.clinicalMode === 'AYUSH' || formData.ayushMode)
                  ? 'bg-emerald-50 text-emerald-950 border-emerald-400 shadow-sm'
                  : 'bg-blue-50 text-blue-950 border-blue-400 shadow-sm'
              }`}>
                {(activeVisit.clinicalMode === 'AYUSH' || formData.ayushMode) ? (
                  <HeartPulse className="w-4 h-4 text-emerald-700" />
                ) : (
                  <Stethoscope className="w-4 h-4 text-[#1e40af]" />
                )}
                <span>
                  {t('common.clinicalMode')}: {(activeVisit.clinicalMode === 'AYUSH' || formData.ayushMode) ? 'AYUSH' : 'MEDICAL'}
                </span>
              </span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl p-6 sm:p-10 space-y-6">

          {/* STEP 0: EXPLICIT INFORMED CONSENT */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-black text-[#1e40af] uppercase tracking-wider">
                  {t('consent.title')} • Step 0 / Digital Consent
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {language === 'ta' ? 'மருத்துவ வரலாறு ஒப்புதல்' : language === 'hi' ? 'चिकित्सीय इनटेक डिजिटल सहमति' : 'Digital Consent for Clinical Intake'}
                </h2>
                <p className="text-sm text-slate-600 font-medium">
                  {language === 'ta'
                    ? 'உங்கள் மருத்துவ விவரங்கள் மற்றும் அறிகுறிகளை பாதுகாப்பாக பதிவு செய்ய முன் ஒப்புதல் தேவை.'
                    : language === 'hi'
                    ? 'अपने लक्षणों और चिकित्सीय इतिहास को इलेक्ट्रॉनिक स्वास्थ्य रिकॉर्ड में दर्ज करने के लिए सहमति दें।'
                    : 'Formal patient authorization to record clinical complaints, symptoms, and medical history (ABDM-ready consent architecture).'}
                </p>
              </div>

              <div className="p-5 sm:p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <div className="flex items-center gap-2.5 text-[#1e40af] font-black">
                  <ShieldCheck className="w-5 h-5 text-[#1e40af]" />
                  <span className="uppercase tracking-wider">Consent Purpose: OPD Consultation &amp; Triage Assessment</span>
                </div>

                <ul className="space-y-2 list-disc pl-5 text-slate-600">
                  <li>
                    <strong className="text-slate-900">Clinical Data Intake:</strong> Reported symptoms, duration, prior illnesses, and allergies will be stored in your official hospital OPD encounter.
                  </li>
                  <li>
                    <strong className="text-slate-900">Assistive AI Support:</strong> Clinical NLP and rule-based triage assist with structuring information and red-flag warnings; the final diagnosis and care decisions are made exclusively by the attending doctor.
                  </li>
                  <li>
                    <strong className="text-slate-900">Data Privacy:</strong> Medical records and diagnostic reports remain confidential and private, released only with physician authorization.
                  </li>
                </ul>
              </div>

              <div
                className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-blue-100/60 transition"
                onClick={() => setConsentAgreed(!consentAgreed)}
              >
                <input
                  type="checkbox"
                  id="consentCheckbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="w-5 h-5 accent-[#1e40af] cursor-pointer"
                />
                <label htmlFor="consentCheckbox" className="text-xs sm:text-sm font-bold text-slate-900 cursor-pointer">
                  {t('consent.agree')}
                </label>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Link
                  href="/patient"
                  className="px-6 py-3 border-2 border-slate-300 font-bold rounded-xl text-xs hover:bg-slate-50 transition"
                >
                  {t('common.cancel')}
                </Link>

                <button
                  type="button"
                  disabled={!consentAgreed}
                  onClick={handleConsentProceed}
                  className={`px-8 py-3.5 font-black rounded-xl text-sm transition flex items-center gap-2 shadow ${
                    consentAgreed
                      ? 'bg-[#1e40af] hover:bg-blue-800 text-white'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>{t('common.continue')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: CONVERSATIONAL PROMPT */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-black text-[#1e40af] uppercase tracking-wider">
                  {t('clinicalHistory.title')} • {t('opd.step')} 1
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {t('clinicalHistory.mainQuestion')}
                </h2>
                <p className="text-sm text-slate-600 font-medium">
                  {t('clinicalHistory.mainQuestionHelper')}
                </p>
              </div>

              {/* Dual Modality 1: Spoken Voice */}
              <div className="p-5 sm:p-6 bg-blue-50/70 border-2 border-blue-200 rounded-2xl space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-[#1e40af] block">
                  {language === 'ta' ? 'தேர்வு 1: குரல் உள்ளீடு (பேசவும்)' : language === 'hi' ? 'विकल्प 1: वॉइस इनपुट (बोलें)' : 'Option 1: Spoken Voice'}
                </span>
                <VoiceInput
                  language={language}
                  onTranscript={(text) => handleComplaintChange(text)}
                />
              </div>

              {/* Dual Modality 2: Touch Quick Selection */}
              <div className="space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                  {t('clinicalHistory.touchOptions')}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {localizedSymptoms.map(sym => (
                    <button
                      key={sym.key}
                      type="button"
                      onClick={() => handleComplaintSelect(sym.key)}
                      className={`p-4 rounded-xl border-2 font-bold text-xs sm:text-sm text-left transition ${
                        formData.presentingComplaint === sym.key
                          ? 'border-[#1e40af] bg-[#1e40af] text-white shadow-md'
                          : 'border-slate-200 bg-white hover:border-[#1e40af]'
                      }`}
                    >
                      {sym.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dual Modality 3: Direct Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {language === 'ta' ? 'அல்லது தட்டச்சு செய்யவும்:' : language === 'hi' ? 'या विवरण टाइप करें:' : 'Or type complaint details:'}
                </label>
                <input
                  type="text"
                  value={formData.presentingComplaint}
                  onChange={(e) => handleComplaintChange(e.target.value)}
                  placeholder={language === 'ta' ? 'எ.கா: உணவு உண்ட பிறகு வயிற்றில் வலி...' : language === 'hi' ? 'उदा: खाना खाने के बाद पेट में तेज दर्द...' : 'e.g. Sharp pain in abdomen after meals...'}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none"
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="px-6 py-3 border-2 border-slate-300 font-bold rounded-xl text-xs hover:bg-slate-50 transition"
                >
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  disabled={!formData.presentingComplaint.trim()}
                  onClick={() => setStep(2)}
                  className={`px-8 py-3.5 text-white font-black rounded-xl text-sm transition flex items-center gap-2 ${
                    formData.presentingComplaint.trim() ? 'bg-[#1e40af] hover:bg-blue-800 shadow-md' : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  <span>{t('common.continue')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: HISTORY OF PRESENT ILLNESS & TOUCH OPTIONS */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-black text-[#1e40af] uppercase tracking-wider">
                  {t('clinicalHistory.title')} • {t('opd.step')} 2
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  {t('ai.history')}
                </h2>
                <p className="text-xs text-slate-600">
                  {t('ai.chiefComplaint')}: <strong>"{formData.presentingComplaint}"</strong>
                </p>
              </div>

              {/* Onset Selection with Localized Touch Options */}
              <div className="p-5 bg-amber-50/80 border-2 border-amber-300 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                  <Activity className="w-5 h-5 text-amber-700" />
                  <span>{t('clinicalHistory.onsetQuestion')}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                  {onsetOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, onset: opt.value })}
                      className={`p-3.5 rounded-xl border-2 font-bold text-xs text-left transition ${
                        formData.onset === opt.value
                          ? 'border-amber-700 bg-amber-700 text-white shadow'
                          : 'border-slate-300 bg-white hover:border-amber-500'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('clinicalHistory.severityQuestion')}
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm font-bold outline-none bg-white"
                  >
                    <option value="Mild">{t('clinicalHistory.mild')}</option>
                    <option value="Moderate">{t('clinicalHistory.moderate')}</option>
                    <option value="Severe">{t('clinicalHistory.severe')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('clinicalHistory.durationQuestion')}
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm font-bold outline-none bg-white"
                  >
                    <option value="Intermittent">{t('clinicalHistory.intermittent')}</option>
                    <option value="Continuous">{t('clinicalHistory.continuous')}</option>
                    <option value="Sudden">{t('clinicalHistory.sudden')}</option>
                    <option value="Gradual">{t('clinicalHistory.gradual')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {language === 'ta' ? 'வலிக்கான இடம் / பரவுதல்' : language === 'hi' ? 'दर्द का स्थान' : 'Location / Radiation'}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder={language === 'ta' ? 'எ.கா: இடது பக்க மார்பில் தொடங்கி கைக்கு பரவுகிறது' : language === 'hi' ? 'उदा: छाती के बाईं ओर से हाथ तक' : 'e.g. Left side of chest radiating to jaw and arm'}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm outline-none"
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setStep(1)} className="px-6 py-3 border-2 border-slate-300 font-bold rounded-xl text-xs">
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(formData.ayushMode ? 7 : 3)}
                  className="px-8 py-3 bg-[#1e40af] hover:bg-blue-800 text-white font-black rounded-xl text-sm shadow"
                >
                  {t('common.continue')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAST MEDICAL & SURGICAL HISTORY */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-black text-[#1e40af] uppercase tracking-wider">
                  {t('clinicalHistory.title')} • {t('opd.step')} 3
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  {t('clinicalHistory.pastMedicalHistory')}
                </h2>
                <p className="text-xs text-slate-600">
                  {language === 'ta' ? 'நீண்டகால நோய்கள், அறுவை சிகிச்சைகள் அல்லது முந்தைய மருத்துவமனை சேர்க்கைகள்' : language === 'hi' ? 'पुरानी बीमारियाँ, पिछली सर्जरी या अस्पताल में भर्ती' : 'Chronic illnesses, prior hospitalizations, or operations'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {t('clinicalHistory.pastMedicalHistory')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {['Hypertension (High BP)', 'Diabetes Mellitus', 'Ischemic Heart Disease', 'Asthma / COPD', 'Tuberculosis', 'Thyroid Disorder'].map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleArrayItem('pastMedicalHistory', item)}
                      className={`p-3 rounded-xl border-2 font-bold text-xs text-left transition ${
                        formData.pastMedicalHistory.includes(item)
                          ? 'border-[#1e40af] bg-blue-50 text-[#1e40af]'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {t('clinicalHistory.pastSurgicalHistory')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {['Appendectomy', 'Cholecystectomy (Gallbladder)', 'Coronary Stent / Bypass', 'Hernia Repair', 'Cesarean Section (C-Section)', 'No Past Surgeries'].map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleArrayItem('pastSurgicalHistory', item)}
                      className={`p-3 rounded-xl border-2 font-bold text-xs text-left transition ${
                        formData.pastSurgicalHistory.includes(item)
                          ? 'border-[#1e40af] bg-blue-50 text-[#1e40af]'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setStep(2)} className="px-6 py-3 border-2 border-slate-300 font-bold rounded-xl text-xs">
                  {t('common.back')}
                </button>
                <button type="button" onClick={() => setStep(4)} className="px-8 py-3 bg-[#1e40af] hover:bg-blue-800 text-white font-black rounded-xl text-sm shadow">
                  {t('common.continue')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: MEDICATION HISTORY & ALLERGIES */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-black text-[#1e40af] uppercase tracking-wider">
                  {t('clinicalHistory.title')} • {t('opd.step')} 4
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  {t('clinicalHistory.medications')} &amp; {t('clinicalHistory.allergies')}
                </h2>
                <p className="text-xs text-slate-600">
                  {language === 'ta' ? 'தற்போது உட்கொள்ளும் மாத்திரைகள் மற்றும் மருந்து ஒவ்வாமைகள்' : language === 'hi' ? 'चल रही दवाएं और दवा एलर्जी' : 'Prescription tablets, over-the-counter medicines, or known drug reactions'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t('clinicalHistory.medications')}
                </label>
                <textarea
                  rows={2}
                  value={formData.medications}
                  onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                  placeholder="e.g. Aspirin 75mg, Metformin 500mg..."
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm focus:border-[#1e40af] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t('clinicalHistory.allergies')}
                </label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Sulfa drugs, Dust"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm focus:border-[#1e40af] outline-none"
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setStep(3)} className="px-6 py-3 border-2 border-slate-300 font-bold rounded-xl text-xs">
                  {t('common.back')}
                </button>
                <button type="button" onClick={() => setStep(5)} className="px-8 py-3 bg-[#1e40af] hover:bg-blue-800 text-white font-black rounded-xl text-sm shadow">
                  {t('common.continue')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: FAMILY, PERSONAL & SOCIAL HISTORY */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-black text-[#1e40af] uppercase tracking-wider">
                  {t('clinicalHistory.title')} • {t('opd.step')} 5
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  {t('clinicalHistory.familyHistory')}
                </h2>
                <p className="text-xs text-slate-600">
                  {language === 'ta' ? 'குடும்ப மரபு வழி நோய்கள் மற்றும் வாழ்க்கை முறை பழக்கவழக்கங்கள்' : language === 'hi' ? 'पारिवारिक बीमारियाँ और जीवनशैली की आदतें' : 'Heritable conditions, occupation, and lifestyle habits'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('clinicalHistory.familyHistory')}
                  </label>
                  <input
                    type="text"
                    value={formData.familyHistory}
                    onChange={(e) => setFormData({ ...formData, familyHistory: e.target.value })}
                    placeholder="e.g. Father had hypertension, mother diabetic"
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm focus:border-[#1e40af] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {language === 'ta' ? 'தனிப்பட்ட பழக்கங்கள்' : language === 'hi' ? 'व्यक्तिगत आदतें' : 'Personal Habits'}
                  </label>
                  <input
                    type="text"
                    value={formData.personalHistory}
                    onChange={(e) => setFormData({ ...formData, personalHistory: e.target.value })}
                    placeholder="e.g. Non-smoker, vegetarian"
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm focus:border-[#1e40af] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setStep(4)} className="px-6 py-3 border-2 border-slate-300 font-bold rounded-xl text-xs">
                  {t('common.back')}
                </button>
                <button type="button" onClick={() => setStep(6)} className="px-8 py-3 bg-[#1e40af] hover:bg-blue-800 text-white font-black rounded-xl text-sm shadow">
                  {t('common.continue')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW OF SYSTEMS (ROS) */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-black text-[#1e40af] uppercase tracking-wider">
                  {t('clinicalHistory.title')} • {t('opd.step')} 6
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  {t('clinicalHistory.reviewOfSystems')}
                </h2>
                <p className="text-xs text-slate-600">
                  {language === 'ta' ? 'சமீபத்தில் கவனித்த கூடுதல் அறிகுறிகளைத் தேர்ந்தெடுக்கவும்' : language === 'hi' ? 'हाल ही में देखे गए अन्य लक्षणों का चयन करें' : 'Select any additional organ system symptoms noticed recently'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  'Weight Loss / Appetite Change', 'Dizziness / Lightheadedness',
                  'Palpitations (Fast heartbeat)', 'Shortness of Breath on Exertion',
                  'Nausea or Vomiting', 'Acid Reflux / Heartburn',
                  'Frequent Urination (Polyuria)', 'Joint Swelling / Stiffness',
                  'Skin Rash or Itching'
                ].map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem('reviewOfSystems', item)}
                    className={`p-3.5 rounded-xl border-2 font-bold text-xs text-left transition ${
                      formData.reviewOfSystems.includes(item)
                        ? 'border-[#1e40af] bg-blue-50 text-[#1e40af]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setStep(5)} className="px-6 py-3 border-2 border-slate-300 font-bold rounded-xl text-xs">
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(formData.ayushMode ? 7 : 8)}
                  className="px-8 py-3 bg-[#1e40af] hover:bg-blue-800 text-white font-black rounded-xl text-sm shadow"
                >
                  {t('common.continue')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: AYUSH MODE */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                  {t('clinicalHistory.ayushTitle')} • Ayurvedic Assessment
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  {t('clinicalHistory.ayushSubtitle')}
                </h2>
                <p className="text-xs text-slate-600">
                  Authoritative AYUSH OPD Clinical Parameters (Prakriti, Vikriti, Agni, Koshtha, Ahara &amp; Vihara)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    1. {t('clinicalHistory.prakriti')} (Constitutional Type)
                  </label>
                  <select
                    value={formData.ayushData.prakriti}
                    onChange={(e) => setFormData({ ...formData, ayushData: { ...formData.ayushData, prakriti: e.target.value } })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="Vata-Pitta">Vata-Pitta</option>
                    <option value="Pitta-Kapha">Pitta-Kapha</option>
                    <option value="Vata-Kapha">Vata-Kapha</option>
                    <option value="Tridoshaja">Tridoshaja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    2. Vikriti (Current Imbalance / Dosha Vitiation)
                  </label>
                  <input
                    type="text"
                    value={formData.ayushData.vikriti}
                    onChange={(e) => setFormData({ ...formData, ayushData: { ...formData.ayushData, vikriti: e.target.value } })}
                    placeholder="e.g. Vata-Pitta Dushti, Agnimandya"
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    3. {t('clinicalHistory.agni')} (Digestive Fire)
                  </label>
                  <select
                    value={formData.ayushData.agni}
                    onChange={(e) => setFormData({ ...formData, ayushData: { ...formData.ayushData, agni: e.target.value } })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="Sama (Balanced)">Sama (Balanced)</option>
                    <option value="Manda (Low / Sluggish)">Manda (Low / Sluggish)</option>
                    <option value="Tikshna (Hyperactive)">Tikshna (Hyperactive)</option>
                    <option value="Visham (Irregular)">Visham (Irregular)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    4. Koshtha (Bowel Habit)
                  </label>
                  <select
                    value={formData.ayushData.koshtha}
                    onChange={(e) => setFormData({ ...formData, ayushData: { ...formData.ayushData, koshtha: e.target.value } })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="Madhyama">Madhyama (Regular / Normal)</option>
                    <option value="Krura">Krura (Constipated / Hard)</option>
                    <option value="Mridu">Mridu (Soft / Frequent)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    5. Ahara (Dietary Habits)
                  </label>
                  <input
                    type="text"
                    value={formData.ayushData.ahara}
                    onChange={(e) => setFormData({ ...formData, ayushData: { ...formData.ayushData, ahara: e.target.value } })}
                    placeholder="e.g. Vegetarian, spicy food, irregular timing"
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    6. Vihara (Lifestyle &amp; Sleep)
                  </label>
                  <input
                    type="text"
                    value={formData.ayushData.vihara}
                    onChange={(e) => setFormData({ ...formData, ayushData: { ...formData.ayushData, vihara: e.target.value } })}
                    placeholder="e.g. Sedentary work, late night sleep, stress"
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setStep(6)} className="px-6 py-3 border-2 border-slate-300 font-bold rounded-xl text-xs">
                  {t('common.back')}
                </button>
                <button type="button" onClick={() => setStep(8)} className="px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-sm shadow">
                  {t('common.continue')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 8: CONFIRMATION & TRANSMIT */}
          {step === 8 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-black text-[#1e40af] uppercase tracking-wider">
                  {t('clinicalHistory.title')} • {t('opd.step')} 8
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  {t('clinicalHistory.sendToDoctor')}
                </h2>
                <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-black mt-2">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>{t('ai.doctorReviewNotice').toUpperCase()}</span>
                </div>
              </div>

              {error && (
                <div className="p-3.5 bg-red-50 border-2 border-red-200 text-red-700 text-xs font-bold rounded-xl">
                  {error}
                </div>
              )}

              {/* Draft Summary Card */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 space-y-4 text-xs sm:text-sm">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">{t('ai.chiefComplaint')}</span>
                  <strong className="text-slate-900 font-black text-base">{formData.presentingComplaint}</strong>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">{t('clinicalHistory.onsetQuestion')}</span>
                    <span>{formData.onset}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">{t('clinicalHistory.severityQuestion')}</span>
                    <span className="font-bold text-[#1e40af]">{formData.severity}</span>
                  </div>
                </div>

                {formData.pastMedicalHistory.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">{t('clinicalHistory.pastMedicalHistory')}</span>
                    <span>{formData.pastMedicalHistory.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center gap-3 cursor-pointer" onClick={() => setFormData({ ...formData, consentGiven: !formData.consentGiven })}>
                <input
                  type="checkbox"
                  checked={formData.consentGiven}
                  onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
                  className="w-6 h-6 accent-[#1e40af] cursor-pointer"
                />
                <label className="text-xs font-bold text-slate-900 cursor-pointer">
                  {t('consent.agree')}
                </label>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setStep(step === 8 && formData.ayushMode ? 7 : 6)} className="px-6 py-3 border-2 border-slate-300 font-bold rounded-xl text-xs">
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  disabled={loading || !formData.consentGiven}
                  onClick={handleSubmit}
                  className={`px-8 py-4 text-white font-black rounded-xl text-base shadow-xl transition flex items-center gap-2 ${
                    formData.consentGiven && !loading ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{loading ? t('common.loading') : t('clinicalHistory.sendToDoctor')}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 9: SUCCESS CONFIRMATION */}
          {step === 9 && (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-1">
                <span className="bg-emerald-100 text-emerald-900 text-xs font-black px-3 py-1 rounded-full uppercase">
                  {t('common.success')}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {language === 'ta'
                    ? 'மருத்துவ வரலாறு வெற்றிகரமாக பதிவு செய்யப்பட்டது'
                    : language === 'hi'
                    ? 'चिकित्सीय इतिहास सफलतापूर्वक दर्ज किया गया'
                    : 'Clinical Intake Successfully Recorded'}
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {language === 'ta'
                    ? 'உங்கள் மருத்துவ விவரங்கள் மருத்துவரின் வரிசைக்கு அனுப்பப்பட்டுள்ளன.'
                    : language === 'hi'
                    ? 'आपकी जानकारी डॉक्टर की कतार में सफलतापूर्वक भेज दी गई है।'
                    : 'Your structured clinical history is now live in the doctor queue.'}
                </p>
              </div>

              <div className="p-6 bg-slate-50 border-2 border-slate-300 rounded-2xl max-w-md mx-auto space-y-2">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  {t('common.status')}
                </span>
                <div className="text-2xl font-black text-[#1e40af]">
                  Ready for Consultation
                </div>
                <p className="text-xs text-slate-700 font-bold">
                  Token: <span className="text-[#1e40af] font-black">{activeVisit?.tokenNumber || submissionResult?.tokenNumber || 'Recorded'}</span> • {activeVisit?.department?.name || formData.department}
                </p>
                <p className="text-xs text-slate-500">
                  Room: {activeVisit?.department?.roomNumber || 'OPD Room 104'}
                </p>
              </div>

              <div className="pt-4 flex flex-wrap justify-center gap-4">
                <Link
                  href="/patient/documents"
                  className="px-6 py-3.5 bg-[#1e40af] hover:bg-blue-800 text-white font-black text-sm rounded-xl transition flex items-center gap-2 shadow"
                >
                  <span>{t('documents.uploadReport')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/patient"
                  className="px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm rounded-xl transition flex items-center gap-2"
                >
                  <span>{t('navigation.dashboard')}</span>
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
