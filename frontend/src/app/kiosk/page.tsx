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
  ArrowRight, ArrowLeft, ShieldCheck, Activity, Sparkles, CheckCircle, RefreshCw,
  Building2, Stethoscope, HeartPulse, Clock, AlertTriangle
} from 'lucide-react';

export default function PatientKioskPage() {
  const router = useRouter();
  const { t, language, setLanguage: setGlobalLang } = useTranslation();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    abhaId: '',
    phone: '',
    age: '',
    gender: 'Male',
    department: 'General Medicine',
    departmentId: '',
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

  const totalSteps = formData.ayushMode ? 11 : 10;

  // Fetch departments from database
  React.useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.getDepartments();
        if (res.success && Array.isArray(res.data)) {
          setDepartments(res.data);
          if (res.data.length > 0) {
            const first = res.data[0];
            setFormData(prev => ({
              ...prev,
              department: first.name,
              departmentId: first._id,
              ayushMode: first.clinicalMode === 'AYUSH'
            }));
          }
        }
      } catch (e) {
        console.warn('Failed to load departments in kiosk', e);
      }
    };
    fetchDepts();
  }, []);

  // 90-Second Inactivity Reset with 15-Second Visual Warning
  const [showIdleModal, setShowIdleModal] = useState<boolean>(false);
  const [countdownRemaining, setCountdownRemaining] = useState<number>(15);
  const lastActivityRef = React.useRef<number>(Date.now());

  const resetKioskSession = React.useCallback(() => {
    setFormData({
      name: '',
      abhaId: '',
      phone: '',
      age: '',
      gender: 'Male',
      department: departments[0]?.name || 'General Medicine',
      departmentId: departments[0]?._id || '',
      consentGiven: false,
      presentingComplaint: '',
      onset: '',
      duration: '',
      severity: 'Moderate',
      location: '',
      associatedSymptoms: [],
      pastMedicalHistory: [],
      medications: '',
      allergies: '',
      ayushMode: departments[0]?.clinicalMode === 'AYUSH',
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
      documents: []
    });
    setStep(1);
    setSubmissionResult(null);
    setShowIdleModal(false);
    setCountdownRemaining(15);
    lastActivityRef.current = Date.now();
  }, [departments]);

  const handleUserActivity = React.useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showIdleModal) {
      setShowIdleModal(false);
      setCountdownRemaining(15);
    }
  }, [showIdleModal]);

  React.useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleEvent = () => handleUserActivity();

    activityEvents.forEach(evt => window.addEventListener(evt, handleEvent, { passive: true }));

    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);

      if (elapsedSeconds >= 90) {
        resetKioskSession();
      } else if (elapsedSeconds >= 75) {
        setShowIdleModal(true);
        setCountdownRemaining(90 - elapsedSeconds);
      } else {
        if (showIdleModal) {
          setShowIdleModal(false);
        }
      }
    }, 1000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleEvent));
      clearInterval(timer);
    };
  }, [handleUserActivity, resetKioskSession, showIdleModal]);

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
    setStep(7);
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
      let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        // Register genuine walk-in patient account
        const walkinEmail = `kiosk_${Date.now()}@hospital.internal`;
        const walkinPassword = `Kiosk${Math.random().toString(36).slice(-6)}!`;
        const regRes = await api.register({
          email: walkinEmail,
          password: walkinPassword,
          firstName: formData.name ? formData.name.split(' ')[0] : 'Kiosk',
          lastName: formData.name && formData.name.split(' ').length > 1 ? formData.name.split(' ').slice(1).join(' ') : 'Walkin',
          phone: formData.phone || '+919876543210',
          abhaId: formData.abhaId,
          role: 'PATIENT'
        });
        if (regRes.token) {
          token = regRes.token;
          localStorage.setItem('token', token);
        }
      }

      const payload = {
        name: formData.name || 'OPD Patient',
        abhaId: formData.abhaId || `ABHA-KIOSK-${Date.now().toString().slice(-6)}`,
        department: formData.department,
        departmentId: formData.departmentId,
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
        setStep(11);
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
                    placeholder="Full Name as per ID"
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
                <button type="button" onClick={() => setStep(2)} className="px-8 py-4 border-2 border-slate-300 font-bold rounded-2xl text-lg">
                  {t('common.back')}
                </button>
                <button type="button" onClick={() => setStep(4)} className="flex-1 py-4 bg-hospital-700 hover:bg-hospital-800 text-white font-extrabold rounded-2xl text-xl shadow-md flex items-center justify-center gap-2">
                  <span>{t('common.continue')}</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: DEPARTMENT SELECTION (AUTHORITATIVE MEDICAL VS AYUSH) */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-hospital-700 uppercase tracking-wider">{t('opd.step')} 4 / {totalSteps}</span>
                <h2 className="text-3xl font-black text-slate-900 mt-1">Select Hospital Department</h2>
                <p className="text-slate-600 text-sm mt-1">
                  Choose the clinic for your consultation. The system authoritatively activates Allopathic or AYUSH clinical protocols based on your selection.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
                {departments.map((dept) => {
                  const isSelected = formData.departmentId === dept._id || formData.department === dept.name;
                  const isAyush = dept.clinicalMode === 'AYUSH';
                  return (
                    <button
                      key={dept._id || dept.name}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          department: dept.name,
                          departmentId: dept._id,
                          ayushMode: isAyush
                        }));
                        setStep(5);
                      }}
                      className={`p-5 rounded-2xl border-2 text-left transition flex items-start gap-4 ${
                        isSelected
                          ? isAyush
                            ? 'border-emerald-600 bg-emerald-50 shadow-md'
                            : 'border-hospital-700 bg-hospital-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isAyush ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-[#1e40af]'
                      }`}>
                        {isAyush ? <HeartPulse className="w-6 h-6" /> : <Stethoscope className="w-6 h-6" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-base text-slate-900 truncate">{dept.name}</h4>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            isAyush ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isAyush ? 'AYUSH' : 'Medical'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Room: {dept.roomNumber || 'Room 104'} • {isAyush ? 'Traditional AYUSH Consultation' : 'General & Specialized Allopathy'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Touch-Friendly Selected Department & Clinical Mode Indicator */}
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">{t('patient.department')}</span>
                  <strong className="text-slate-900 text-lg">{formData.department}</strong>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 uppercase block">{t('common.clinicalMode')}</span>
                  <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-black text-sm uppercase border-2 ${
                    formData.ayushMode
                      ? 'bg-emerald-50 text-emerald-950 border-emerald-400 shadow-sm'
                      : 'bg-blue-50 text-blue-950 border-blue-400 shadow-sm'
                  }`}>
                    {formData.ayushMode ? (
                      <HeartPulse className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <Stethoscope className="w-4 h-4 text-[#1e40af]" />
                    )}
                    <span>{formData.ayushMode ? 'AYUSH' : 'MEDICAL'}</span>
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setStep(3)} className="px-8 py-4 border-2 border-slate-300 font-bold rounded-2xl text-lg">
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="flex-1 py-4 bg-hospital-700 hover:bg-hospital-800 text-white font-extrabold rounded-2xl text-xl shadow-md flex items-center justify-center gap-2"
                >
                  <span>{t('common.continue')}</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: CONSENT */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-hospital-700 uppercase tracking-wider">{t('opd.step')} 5 / {totalSteps}</span>
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
                <button type="button" onClick={() => setStep(4)} className="px-8 py-4 border-2 border-slate-300 font-bold rounded-2xl text-lg">
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  disabled={!formData.consentGiven}
                  onClick={() => setStep(6)}
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

          {/* STEP 6: MAIN COMPLAINT */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-hospital-700 uppercase tracking-wider">{t('opd.step')} 6 / {totalSteps}</span>
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
                    { key: 'Breathing Difficulty', label: language === 'ta' ? 'மூச்சுத் திணறல்' : language === 'hi' ? 'சாंस में तकलीफ' : 'Breathing Difficulty' },
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
                <button type="button" onClick={() => setStep(5)} className="px-8 py-4 border-2 border-slate-300 font-bold rounded-2xl text-lg">
                  {t('common.back')}
                </button>
                <button type="button" onClick={() => setStep(7)} className="flex-1 py-4 bg-hospital-700 hover:bg-hospital-800 text-white font-extrabold rounded-2xl text-xl shadow-md flex items-center justify-center gap-2">
                  <span>{t('common.continue')}</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: ADAPTIVE QUESTIONS & SEVERITY */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-hospital-700 uppercase tracking-wider">{t('opd.step')} 7 / {totalSteps}</span>
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
                <button type="button" onClick={() => setStep(6)} className="px-8 py-4 border-2 border-slate-300 font-bold rounded-2xl text-lg">
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(formData.ayushMode ? 8 : 9)}
                  className="flex-1 py-4 bg-hospital-700 hover:bg-hospital-800 text-white font-extrabold rounded-2xl text-xl shadow-md flex items-center justify-center gap-2"
                >
                  <span>{t('common.continue')}</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 8: AYUSH MODE (Only reached in AYUSH Clinical Mode) */}
          {step === 8 && (
            <StepAyush
              formData={formData}
              setFormData={setFormData}
              language={language as any}
              totalSteps={totalSteps}
              prevStep={() => setStep(7)}
              nextStep={() => setStep(9)}
            />
          )}

          {/* STEP 9: DOCUMENT UPLOAD */}
          {step === 9 && (
            <StepDocumentUpload
              formData={formData}
              handleFileUpload={handleFileUpload}
              language={language as any}
              totalSteps={totalSteps}
              prevStep={() => setStep(formData.ayushMode ? 8 : 7)}
              nextStep={() => setStep(10)}
            />
          )}

          {/* STEP 10: REVIEW SUMMARY */}
          {step === 10 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-hospital-700 uppercase tracking-wider">{t('opd.step')} 10 / {totalSteps}</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block">{t('patient.department')}</span>
                    <p className="text-base font-black text-slate-900 mt-0.5">{formData.department}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block">{t('common.clinicalMode')}</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs uppercase border mt-1 ${
                      formData.ayushMode
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-blue-50 text-blue-900 border-blue-300'
                    }`}>
                      {formData.ayushMode ? (
                        <HeartPulse className="w-3.5 h-3.5 text-emerald-700" />
                      ) : (
                        <Stethoscope className="w-3.5 h-3.5 text-[#1e40af]" />
                      )}
                      <span>{formData.ayushMode ? 'AYUSH' : 'MEDICAL'}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block">{t('clinicalHistory.severityQuestion')}</span>
                    <p className="text-base font-black text-hospital-700 mt-0.5">{formData.severity}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setStep(9)} className="px-8 py-4 border-2 border-slate-300 font-bold rounded-2xl text-lg">
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

          {/* STEP 11: CONFIRMATION & TOKEN */}
          {step === 11 && (
            <div className="text-center space-y-6 my-auto">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle className="w-14 h-14" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                {language === 'ta' ? 'பதிவு முடிந்தது! டோக்கன் உருவாக்கப்பட்டது.' : language === 'hi' ? 'इनटेक पूर्ण हुआ! ओपीडी टोकन उत्पन्न हुआ।' : 'Intake Complete! OPD Token Generated.'}
              </h2>
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl max-w-md mx-auto space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">{t('patient.tokenNumber')}</span>
                <div className="text-4xl font-black text-hospital-700">
                  {submissionResult?.tokenNumber || 'TKN-OPD-ACTIVE'}
                </div>
                <p className="text-xs text-slate-500 font-bold">
                  Department: {formData.department} • Room: OPD Room 104
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={resetKioskSession}
                  className="px-8 py-4 bg-hospital-700 text-white text-lg font-bold rounded-2xl shadow hover:bg-hospital-800 transition"
                >
                  Register Next Patient
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/patient')}
                  className="px-8 py-4 bg-slate-200 text-slate-800 text-lg font-bold rounded-2xl hover:bg-slate-300 transition"
                >
                  {t('patient.title')}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 90-Second Idle Warning Modal (15s Visual Countdown) */}
      {showIdleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full text-center space-y-6 shadow-2xl border-4 border-amber-400 animate-in fade-in zoom-in-95">
            <div className="w-24 h-24 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-4xl font-black border-4 border-amber-300 animate-pulse">
              {countdownRemaining}s
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">
                {language === 'ta' ? 'செயலற்ற எச்சரிக்கை' : language === 'hi' ? 'निष्क्रियता चेतावनी' : 'Inactivity Warning'}
              </h3>
              <p className="text-sm text-slate-600 font-medium">
                {language === 'ta'
                  ? `நோயாளி தனியுரிமைக்காக இன்னும் ${countdownRemaining} வினாடிகளில் அமர்வு தானாக மீட்டமைக்கப்படும்.`
                  : language === 'hi'
                  ? `रोगी की गोपनीयता के लिए यह सत्र ${countdownRemaining} सेकंड में रीसेट हो जाएगा।`
                  : `To protect patient privacy, your session will reset in ${countdownRemaining} seconds.`}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetKioskSession}
                className="flex-1 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-sm transition"
              >
                {language === 'ta' ? 'மீட்டமை' : language === 'hi' ? 'रीसेट करें' : 'Reset Now'}
              </button>
              <button
                type="button"
                onClick={handleUserActivity}
                className="flex-1 py-3.5 bg-hospital-700 hover:bg-hospital-800 text-white font-black rounded-xl text-sm shadow-lg transition"
              >
                {language === 'ta' ? 'தொடரவும்' : language === 'hi' ? 'मैं यहाँ हूँ' : "I'm Still Here"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
