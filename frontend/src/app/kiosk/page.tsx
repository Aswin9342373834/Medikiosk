'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VoiceInput } from '../../components/VoiceInput';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { KioskHeader } from './components/KioskHeader';
import { StepAyush } from './components/StepAyush';
import { StepDocumentUpload } from './components/StepDocumentUpload';
import { useTranslation } from '../../contexts/LanguageContext';
import { getTranslation } from '../../lib/i18n';
import api from '../../lib/api';
import { 
  ArrowRight, ArrowLeft, ShieldCheck, Activity, Sparkles, CheckCircle, RefreshCw
} from 'lucide-react';

export default function PatientKioskPage() {
  const router = useRouter();
  const { t, language, setLanguage: setGlobalLang } = useTranslation();
  const [step, setStep] = useState<number>(1);
  const totalSteps = 10;
  const [loading, setLoading] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    abhaId: '',
    phone: '',
    age: '',
    gender: 'Male',
    consentGiven: true,
    presentingComplaint: '',
    onset: '',
    duration: '',
    severity: 'Moderate',
    location: '',
    associatedSymptoms: [] as string[],
    pastMedicalHistory: [] as string[],
    medications: '',
    allergies: '',
    ayushMode: false,
    ayushData: {
      prakriti: 'Vata-Pitta',
      vikriti: 'Agni-mandya',
      sara: 'Madhyama',
      samhanana: 'Madhyama',
      pramana: 'Madhyama',
      satmya: 'Madhyama',
      sattva: 'Madhyama',
      aharaShakti: 'Madhyama',
      vyayamaShakti: 'Madhyama',
      vaya: 'Madhyama',
      ahara: 'Vegetarian, irregular timing',
      vihara: 'Sedentary work, late night sleep'
    },
    documents: [] as File[]
  });

  const [adaptiveQuestion, setAdaptiveQuestion] = useState<{
    question: string;
    options: string[];
  }>({
    question: 'When did your primary symptom or pain start?',
    options: ['Today (Suddenly)', 'Yesterday', 'A few days ago', 'More than a week ago']
  });

  const [detectedRedFlags, setDetectedRedFlags] = useState<string[]>([]);

  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleComplaintChange = (val: string) => {
    setFormData(prev => ({ ...prev, presentingComplaint: val }));
    const lower = val.toLowerCase();
    const flags: string[] = [];

    if (lower.includes('chest pain') || lower.includes('heart') || lower.includes('நெஞ்சு வலி') || lower.includes('सीने में दर्द')) {
      flags.push('Potential severe acute chest pain');
    }
    if (lower.includes('breath') || lower.includes('suffocat') || lower.includes('மூச்சுத் திணறல்') || lower.includes('सांस फूलना')) {
      flags.push('Potential severe breathing difficulty');
    }
    if (lower.includes('bleed') || lower.includes('blood') || lower.includes('இரத்தம்') || lower.includes('खून')) {
      flags.push('Potential severe bleeding');
    }
    if (lower.includes('faint') || lower.includes('blackout') || lower.includes('மயக்கம்') || lower.includes('बेहोश')) {
      flags.push('Potential loss of consciousness');
    }
    setDetectedRedFlags(flags);
  };

  const handleComplaintSelect = async (complaint: string) => {
    handleComplaintChange(complaint);
    try {
      const res = await api.getAdaptiveQuestion({ presentingComplaint: complaint }, language);
      if (res.success && res.data) {
        setAdaptiveQuestion(res.data);
      }
    } catch (e) {}
    nextStep();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData(prev => ({ ...prev, documents: [...prev.documents, ...files] }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let token = localStorage.getItem('token');
      if (!token) {
        const loginRes = await api.login({ email: 'patient@hospital.gov.in', password: 'Password123!' });
        token = loginRes.token;
      }

      const payload = {
        name: formData.name || 'OPD Patient',
        abhaId: formData.abhaId || `ABHA-KIOSK-${Date.now().toString().slice(-6)}`,
        presentingComplaint: formData.presentingComplaint,
        chiefComplaint: formData.presentingComplaint,
        onset: formData.onset,
        duration: formData.duration,
        severity: formData.severity,
        location: formData.location,
        associatedSymptoms: formData.associatedSymptoms,
        pastMedicalHistory: formData.pastMedicalHistory,
        medications: formData.medications ? [{ name: formData.medications, dosage: 'As prescribed', frequency: 'Daily', duration: 'Ongoing' }] : [],
        allergies: formData.allergies ? [formData.allergies] : [],
        ayushMode: formData.ayushMode,
        ayushData: formData.ayushMode ? formData.ayushData : undefined,
        consentGiven: formData.consentGiven,
        consentVersion: 'v1.0-ABDM'
      };

      const res = await api.submitClinicalHistory(payload);
      if (res.success) {
        setSubmissionResult(res.data);
        setStep(10);
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      alert(`Submission failed: ${err.message || 'Please contact registration counter'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      <KioskHeader
        step={step}
        totalSteps={totalSteps}
        detectedRedFlags={detectedRedFlags}
        onLanguageChange={(lang) => setGlobalLang(lang)}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-12 space-y-8 min-h-[550px] flex flex-col justify-between">
          
          {/* STEP 1: CHOOSE LANGUAGE */}
          {step === 1 && (
            <div className="space-y-8 text-center my-auto">
              <div className="space-y-2">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                  {t('kiosk.selectLanguage')}
                </h2>
                <p className="text-base sm:text-lg text-slate-600 font-medium">
                  {language === 'ta'
                    ? 'மருத்துவப் பதிவைத் தொடங்க உங்கள் தாய்மொழியைத் தேர்ந்தெடுக்கவும்'
                    : language === 'hi'
                    ? 'चिकित्सीय इनटेक शुरू करने के लिए अपनी पसंदीदा भाषा चुनें'
                    : 'Select your preferred language to begin clinical history intake'}
                </p>
              </div>

              <LanguageSwitcher
                variant="kiosk"
                onLanguageChange={(lang) => setGlobalLang(lang)}
              />

              <button
                type="button"
                onClick={nextStep}
                className="w-full py-5 bg-hospital-700 hover:bg-hospital-800 text-white text-xl sm:text-2xl font-extrabold rounded-2xl shadow-lg transition flex items-center justify-center gap-3"
              >
                <span>{t('common.continue')}</span>
                <ArrowRight className="w-7 h-7" />
              </button>
            </div>
          )}

          {/* STEP 2: PATIENT IDENTIFICATION */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-hospital-700 uppercase tracking-wider">{t('opd.step')} 2 / {totalSteps}</span>
                <h2 className="text-3xl font-black text-slate-900 mt-1">{t('opd.step1')}</h2>
                <p className="text-slate-600 text-sm mt-1">{t('opd.step1Desc')}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t('opd.fullName')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full text-xl p-4 border-2 border-slate-300 rounded-2xl focus:border-hospital-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">{t('authentication.abhaId')}</label>
                    <input
                      type="text"
                      value={formData.abhaId}
                      onChange={(e) => setFormData({ ...formData, abhaId: e.target.value })}
                      placeholder="e.g. ABHA-9928-1102"
                      className="w-full text-lg p-4 border-2 border-slate-300 rounded-2xl focus:border-hospital-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">{t('opd.phone')}</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full text-lg p-4 border-2 border-slate-300 rounded-2xl focus:border-hospital-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={prevStep} className="px-8 py-4 border-2 border-slate-300 hover:bg-slate-50 font-bold rounded-2xl text-lg">
                  {t('common.back')}
                </button>
                <button type="button" onClick={nextStep} className="flex-1 py-4 bg-hospital-700 hover:bg-hospital-800 text-white font-extrabold rounded-2xl text-xl shadow-md flex items-center justify-center gap-2">
                  <span>{t('common.continue')}</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AGE & GENDER */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-hospital-700 uppercase tracking-wider">{t('opd.step')} 3 / {totalSteps}</span>
                <h2 className="text-3xl font-black text-slate-900 mt-1">{t('opd.age')} &amp; {t('opd.gender')}</h2>
                <p className="text-slate-600 text-sm mt-1">{t('clinicalHistory.touchOptions')}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">{t('opd.age')}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {['Child (0-14)', 'Youth (15-29)', 'Adult (30-59)', 'Senior (60+)'].map(bracket => (
                      <button
                        key={bracket}
                        type="button"
                        onClick={() => setFormData({ ...formData, age: bracket.includes('60') ? '65' : bracket.includes('30') ? '45' : '22' })}
                        className={`p-5 rounded-2xl font-bold border-2 text-center transition ${
                          formData.age ? 'border-hospital-600 bg-hospital-50 text-hospital-800' : 'border-slate-200 bg-white hover:border-hospital-400'
                        }`}
                      >
                        {bracket}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">{t('opd.gender')}</label>
                  <div className="grid grid-cols-3 gap-4">
                    {['Male', 'Female', 'Other'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: g as any })}
                        className={`p-6 rounded-2xl font-black text-xl border-2 text-center transition ${
                          formData.gender === g ? 'border-hospital-700 bg-hospital-700 text-white shadow-md' : 'border-slate-200 bg-white hover:border-hospital-400'
                        }`}
                      >
                        {g === 'Male' ? t('opd.male') : g === 'Female' ? t('opd.female') : t('opd.other')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={prevStep} className="px-8 py-4 border-2 border-slate-300 font-bold rounded-2xl text-lg">
                  {t('common.back')}
                </button>
                <button type="button" onClick={nextStep} className="flex-1 py-4 bg-hospital-700 hover:bg-hospital-800 text-white font-extrabold rounded-2xl text-xl shadow-md flex items-center justify-center gap-2">
                  <span>{t('common.continue')}</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CONSENT */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-hospital-700 uppercase tracking-wider">{t('opd.step')} 4 / {totalSteps}</span>
                <h2 className="text-3xl font-black text-slate-900 mt-1">{t('consent.title')}</h2>
              </div>

              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl space-y-4 text-slate-700 text-base leading-relaxed">
                <div className="flex items-center gap-3 text-hospital-700 font-bold">
                  <ShieldCheck className="w-7 h-7" />
                  <span>{t('consent.legalNotice')}</span>
                </div>
                <p>{t('consent.body')}</p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                  <li><strong>AI:</strong> {t('consent.aiNotice')}</li>
                  <li><strong>Privacy:</strong> {t('documents.privateNotice')}</li>
                </ul>
              </div>

              <div className="flex items-center gap-4 p-4 bg-hospital-50 border border-hospital-200 rounded-2xl cursor-pointer" onClick={() => setFormData({ ...formData, consentGiven: !formData.consentGiven })}>
                <input
                  type="checkbox"
                  checked={formData.consentGiven}
                  onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
                  className="w-7 h-7 accent-hospital-700 cursor-pointer"
                />
                <label className="text-base font-bold text-slate-900 cursor-pointer">
                  {t('consent.agree')}
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={prevStep} className="px-8 py-4 border-2 border-slate-300 font-bold rounded-2xl text-lg">
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  disabled={!formData.consentGiven}
                  onClick={nextStep}
                  className={`flex-1 py-4 text-white font-extrabold rounded-2xl text-xl shadow-md flex items-center justify-center gap-2 ${
                    formData.consentGiven ? 'bg-hospital-700 hover:bg-hospital-800' : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>{t('common.continue')}</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: MAIN COMPLAINT */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-hospital-700 uppercase tracking-wider">{t('opd.step')} 5 / {totalSteps}</span>
                <h2 className="text-3xl font-black text-slate-900 mt-1">{t('clinicalHistory.mainQuestion')}</h2>
                <p className="text-slate-600 text-sm mt-1">{t('clinicalHistory.mainQuestionHelper')}</p>
              </div>

              <div className="p-6 bg-hospital-50 border-2 border-hospital-200 rounded-3xl space-y-3">
                <VoiceInput
                  language={language}
                  onTranscript={(text) => handleComplaintChange(text)}
                />
              </div>

              <div className="space-y-3">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{t('clinicalHistory.touchOptions')}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { key: 'Chest Pain', label: language === 'ta' ? 'நெஞ்சு வலி' : language === 'hi' ? 'सीने में दर्द' : 'Chest Pain' },
                    { key: 'High Fever & Chills', label: language === 'ta' ? 'காய்ச்சல் & நடுக்கம்' : language === 'hi' ? 'तेज बुखार' : 'Fever & Chills' },
                    { key: 'Breathing Difficulty', label: language === 'ta' ? 'மூச்சுத் திணறல்' : language === 'hi' ? 'सांस में तकलीफ' : 'Breathing Difficulty' },
                    { key: 'Severe Headache', label: language === 'ta' ? 'தலைவலி' : language === 'hi' ? 'सिरदर्द' : 'Severe Headache' },
                    { key: 'Stomach Pain', label: language === 'ta' ? 'வயிற்று வலி' : language === 'hi' ? 'पेट दर्द' : 'Stomach Pain' },
                    { key: 'Cough & Cold', label: language === 'ta' ? 'இருமல் & சளி' : language === 'hi' ? 'खांसी-जुकाम' : 'Cough & Cold' },
                    { key: 'Joint Pain', label: language === 'ta' ? 'மூட்டு வலி' : language === 'hi' ? 'जोड़ों का दर्द' : 'Joint Pain' },
                    { key: 'Dizziness / Fatigue', label: language === 'ta' ? 'மயக்கம் / சோர்வு' : language === 'hi' ? 'चक्कर / थकान' : 'Dizziness' }
                  ].map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleComplaintSelect(item.key)}
                      className={`p-5 rounded-2xl font-bold border-2 text-base text-left transition ${
                        formData.presentingComplaint === item.key ? 'border-hospital-700 bg-hospital-700 text-white shadow-md' : 'border-slate-200 bg-white hover:border-hospital-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={prevStep} className="px-8 py-4 border-2 border-slate-300 font-bold rounded-2xl text-lg">
                  {t('common.back')}
                </button>
                <button type="button" onClick={nextStep} className="flex-1 py-4 bg-hospital-700 hover:bg-hospital-800 text-white font-extrabold rounded-2xl text-xl shadow-md flex items-center justify-center gap-2">
                  <span>{t('common.continue')}</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: ADAPTIVE QUESTIONS & SEVERITY */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-hospital-700 uppercase tracking-wider">{t('opd.step')} 6 / {totalSteps}</span>
                <h2 className="text-3xl font-black text-slate-900 mt-1">{t('ai.history')}</h2>
              </div>

              <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-black text-base">
                  <Activity className="w-6 h-6 text-amber-700" />
                  <span>{adaptiveQuestion.question}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {adaptiveQuestion.options.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData({ ...formData, onset: opt })}
                      className={`p-4 rounded-xl border-2 font-bold text-sm text-left transition ${
                        formData.onset === opt ? 'border-amber-700 bg-amber-700 text-white shadow' : 'border-slate-200 bg-white hover:border-amber-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('clinicalHistory.severityQuestion')}</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { val: 'Mild', label: t('clinicalHistory.mild') },
                    { val: 'Moderate', label: t('clinicalHistory.moderate') },
                    { val: 'Severe', label: t('clinicalHistory.severe') }
                  ].map(s => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => setFormData({ ...formData, severity: s.val })}
                      className={`p-5 rounded-2xl font-bold border-2 text-center transition ${
                        formData.severity === s.val ? 'border-hospital-700 bg-hospital-700 text-white shadow' : 'border-slate-200 bg-white hover:border-hospital-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={prevStep} className="px-8 py-4 border-2 border-slate-300 font-bold rounded-2xl text-lg">
                  {t('common.back')}
                </button>
                <button type="button" onClick={nextStep} className="flex-1 py-4 bg-hospital-700 hover:bg-hospital-800 text-white font-extrabold rounded-2xl text-xl shadow-md flex items-center justify-center gap-2">
                  <span>{t('common.continue')}</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: AYUSH MODE */}
          {step === 7 && (
            <StepAyush
              formData={formData}
              setFormData={setFormData}
              language={language as any}
              totalSteps={totalSteps}
              prevStep={prevStep}
              nextStep={nextStep}
            />
          )}

          {/* STEP 8: DOCUMENT UPLOAD */}
          {step === 8 && (
            <StepDocumentUpload
              formData={formData}
              handleFileUpload={handleFileUpload}
              language={language as any}
              totalSteps={totalSteps}
              prevStep={prevStep}
              nextStep={nextStep}
            />
          )}

          {/* STEP 9: REVIEW SUMMARY */}
          {step === 9 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-hospital-700 uppercase tracking-wider">{t('opd.step')} 9 / {totalSteps}</span>
                <h2 className="text-3xl font-black text-slate-900 mt-1">{t('ai.summaryTitle')}</h2>
                <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold mt-2">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>{t('ai.doctorReviewNotice').toUpperCase()}</span>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl space-y-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">{t('ai.chiefComplaint')}</span>
                  <p className="text-xl font-black text-slate-900">{formData.presentingComplaint}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">{t('clinicalHistory.onsetQuestion')}</span>
                    <p className="text-sm font-bold text-slate-800">{formData.onset || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">{t('clinicalHistory.severityQuestion')}</span>
                    <p className="text-sm font-bold text-hospital-700">{formData.severity}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={prevStep} className="px-8 py-4 border-2 border-slate-300 font-bold rounded-2xl text-lg">
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="flex-1 py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl text-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-6 h-6" />
                  <span>{loading ? t('common.loading') : t('clinicalHistory.sendToDoctor')}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 10: CONFIRMATION */}
          {step === 10 && (
            <div className="text-center space-y-6 my-auto">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle className="w-14 h-14" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                {language === 'ta' ? 'பதிவு முடிந்தது! அறை எண் 104-க்குச் செல்லவும்.' : language === 'hi' ? 'इनटेक पूर्ण हुआ! ओपीडी कक्ष 104 पर जाएं।' : 'Intake Complete! Please Proceed to OPD Room 104.'}
              </h2>
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl max-w-md mx-auto">
                <span className="text-xs font-bold text-slate-400 uppercase">{t('patient.tokenNumber')}</span>
                <div className="text-4xl font-black text-hospital-700">
                  {submissionResult?.tokenNumber || 'TKN-104'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/patient')}
                className="px-8 py-4 bg-hospital-700 text-white text-lg font-bold rounded-2xl shadow hover:bg-hospital-800"
              >
                {t('patient.title')}
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
