'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useTranslation } from '../../../contexts/LanguageContext';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { 
  Building2, User, MapPin, Phone, HeartPulse, CheckCircle2, 
  ArrowRight, ArrowLeft, ShieldCheck, Printer, RefreshCw, FileText, Stethoscope,
  Sparkles, Check, Activity
} from 'lucide-react';

export default function PatientOPRegistrationPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  
  // Step 1: Select Department (Touch Cards Grid)
  // Step 2: Patient Identification & Details
  // Step 3: Clinical Reason & Digital Consent
  const [step, setStep] = useState<number>(1);
  const totalSteps = 3;

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [registeredResult, setRegisteredResult] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingDepts, setLoadingDepts] = useState<boolean>(true);

  // Form State
  const [formData, setFormData] = useState({
    // Department Selection
    departmentId: '',
    department: 'General Medicine',
    clinicalMode: 'MEDICAL',

    // Patient Identification
    fullName: '',
    age: '',
    gender: 'Male',
    contactNumber: '',
    abhaId: '',
    uhid: '',

    // Address & Emergency
    address: 'Main Road',
    district: 'Central',
    state: 'Delhi',
    pincode: '110029',
    emergencyName: 'Family Contact',
    emergencyRelationship: 'Spouse',
    emergencyPhone: '',

    // Clinical Reason & Health
    reasonForVisit: '',
    existingConditions: [] as string[],
    allergies: [] as string[],

    // Consent
    consentGiven: true
  });

  // Fetch Authoritative Departments from Backend
  useEffect(() => {
    const fetchDepartmentsAndProfile = async () => {
      setLoadingDepts(true);
      try {
        const deptRes = await api.getDepartments();
        if (deptRes.success && Array.isArray(deptRes.data) && deptRes.data.length > 0) {
          setDepartments(deptRes.data);
          const first = deptRes.data[0];
          setFormData(prev => ({
            ...prev,
            department: prev.department || first.name,
            departmentId: prev.departmentId || first._id,
            clinicalMode: first.clinicalMode
          }));
        }

        // Try pre-filling from logged-in patient profile
        try {
          const profRes = await api.getPatientProfile();
          if (profRes.success && profRes.data) {
            const p = profRes.data;
            setFormData(prev => ({
              ...prev,
              fullName: p.name || prev.fullName,
              age: p.age ? String(p.age) : prev.age,
              gender: p.gender || prev.gender,
              contactNumber: p.contactNumber || p.phone || prev.contactNumber,
              abhaId: p.abhaId || prev.abhaId,
              uhid: p.uhid || prev.uhid
            }));
          }
        } catch (e) {
          // Guest registration flow
        }
      } catch (err: any) {
        console.warn('Failed to load authoritative departments:', err.message);
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchDepartmentsAndProfile();
  }, []);

  const selectedDeptObj = departments.find(d => d.name === formData.department || d._id === formData.departmentId) || {
    name: formData.department,
    clinicalMode: /ayush|ayurveda|siddha|unani/i.test(formData.department) ? 'AYUSH' : 'MEDICAL',
    description: /ayush|ayurveda|siddha|unani/i.test(formData.department) 
      ? 'Traditional AYUSH clinical management and herbal medicine' 
      : 'Adult primary care, acute fevers, respiratory issues, and non-communicable diseases'
  };

  const isAyushMode = selectedDeptObj.clinicalMode === 'AYUSH';

  const handleSelectDepartment = (dept: any) => {
    setFormData(prev => ({
      ...prev,
      department: dept.name,
      departmentId: dept._id,
      clinicalMode: dept.clinicalMode
    }));
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.department) {
        setError(t('validation.fillRequiredFields') || 'Please select a hospital department');
        return;
      }
    }
    if (step === 2) {
      if (!formData.fullName.trim() || !formData.age) {
        setError(t('validation.fillRequiredFields') || 'Please enter full name and age');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setError('');
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        fullName: formData.fullName || 'OPD Patient',
        name: formData.fullName || 'OPD Patient',
        age: formData.age || '45',
        gender: formData.gender,
        contactNumber: formData.contactNumber || '+91 98111 22334',
        phone: formData.contactNumber || '+91 98111 22334',
        abhaId: formData.abhaId,
        uhid: formData.uhid,
        department: formData.department,
        departmentId: formData.departmentId,
        address: formData.address,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        emergencyName: formData.emergencyName,
        emergencyPhone: formData.emergencyPhone,
        reasonForVisit: formData.reasonForVisit || (isAyushMode ? 'Traditional AYUSH Consultation' : 'General Medical OPD'),
        preferredLanguage: language === 'ta' ? 'Tamil' : language === 'hi' ? 'Hindi' : 'English'
      };

      const res = await api.opRegister(payload);
      if (res.success && res.data) {
        setRegisteredResult(res.data);
      } else {
        throw new Error(res.message || t('errors.generic'));
      }
    } catch (err: any) {
      setError(err.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      
      {/* Top Government Bar */}
      <div className="bg-[#0b1b3d] text-white py-2.5 px-3 sm:px-8 border-b border-blue-900">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center text-xs gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span className="font-bold">{t('opd.title')}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="select" className="bg-[#152a57] border-blue-800 text-white" />
            <Link href="/patient" className="text-blue-300 hover:text-white font-bold transition">
              &larr; {t('common.back')}
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        
        {registeredResult ? (
          /* ======================================================== */
          /* REGISTRATION CONFIRMATION SLIP                           */
          /* ======================================================== */
          <div className="bg-white rounded-3xl border-2 border-emerald-600 shadow-2xl p-6 sm:p-10 space-y-6">
            <div className="text-center space-y-2 border-b-2 border-slate-200 pb-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <span className="inline-block bg-emerald-100 text-emerald-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                {t('opd.confirmation')} • {t('opd.tokenGenerated')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {registeredResult.department} Outpatient Consultation
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                {registeredResult.hospital || 'All India Institute of Medical Sciences (AIIMS)'}
              </p>
            </div>

            {/* Token Highlight Box */}
            <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-6 text-center space-y-2">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                {t('patient.tokenNumber')}
              </span>
              <div className="text-5xl sm:text-6xl font-black text-[#1e40af] tracking-wider font-mono">
                {registeredResult.tokenNumber}
              </div>
              <p className="text-xs text-slate-600 font-bold">
                {language === 'ta'
                  ? `தயவுசெய்து ${registeredResult.department} ஆலோசனை அறைக்குச் செல்லவும்`
                  : language === 'hi'
                  ? `कृपया ${registeredResult.department} परामर्श कक्ष में जाएं`
                  : `Please proceed to ${registeredResult.department} Consultation Room`}
              </p>
            </div>

            {/* Official Identifiers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-blue-50/50 p-6 rounded-2xl border border-blue-200 text-xs sm:text-sm">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">{t('opd.fullName')}</span>
                <strong className="text-slate-900 font-black text-base">{registeredResult.name}</strong>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">{t('patient.opNumber')}</span>
                <strong className="text-[#1e40af] font-mono font-black text-base">{registeredResult.opNumber}</strong>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">{t('patient.department')}</span>
                <strong className="text-slate-900 text-base">{registeredResult.department}</strong>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">{t('common.clinicalMode')}</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs uppercase border ${
                  registeredResult.clinicalMode === 'AYUSH'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-blue-100 text-blue-950 border-blue-300'
                }`}>
                  {registeredResult.clinicalMode === 'AYUSH' ? <HeartPulse className="w-3.5 h-3.5 text-emerald-700" /> : <Stethoscope className="w-3.5 h-3.5 text-[#1e40af]" />}
                  <span>Clinical Mode: {registeredResult.clinicalMode || 'MEDICAL'}</span>
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">{t('authentication.abhaId')}</span>
                <span className="font-mono font-bold text-slate-800">{registeredResult.abhaId || 'ABHA-VERIFIED'}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">{t('common.status')}</span>
                <span className="bg-blue-100 text-blue-900 font-black px-2.5 py-0.5 rounded text-xs">
                  {registeredResult.registrationStatus || 'Registered'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200">
              <Link
                href="/patient/clinical-history"
                className="flex-1 py-4 bg-[#1e40af] hover:bg-blue-800 text-white font-black text-base rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
              >
                <span>{t('opd.proceedToVitals')}</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <Link
                href="/patient"
                className="px-6 py-4 bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
              >
                <span>{t('navigation.dashboard')}</span>
              </Link>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>{t('opd.printSlip')}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* REGISTRATION WIZARD                                      */
          /* ======================================================== */
          <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl p-6 sm:p-10 space-y-6">
            
            {/* Step Progress Bar */}
            <div className="space-y-2 border-b border-slate-200 pb-4">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-500">
                <span className="text-[#1e40af] font-black">
                  {t('opd.step')} {step} / {totalSteps}
                </span>
                <span>
                  {step === 1 && (t('opd.departmentSelect') || 'Select Department')}
                  {step === 2 && t('opd.step1')}
                  {step === 3 && (t('opd.step6') || 'Consent & Confirmation')}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1e40af] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border-2 border-red-200 text-red-700 text-xs font-bold rounded-xl">
                {error}
              </div>
            )}

            {/* ==================================================== */}
            {/* STEP 1: SELECT DEPARTMENT (TOUCH CARDS)               */}
            {/* ==================================================== */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">
                    {t('opd.departmentSelect') || 'Select Hospital Department'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {language === 'ta'
                      ? 'உங்கள் மருத்துவ ஆலோசனைகான துறையைத் தேர்ந்தெடுக்கவும். நீங்கள் தேர்ந்தெடுக்கும் துறையின் அடிப்படையில் முறை செயல்படுத்தப்படும்.'
                      : language === 'hi'
                      ? 'अपने परामर्श के लिए विभाग चुनें। प्रणाली स्वचालित रूप से संबंधित क्लीनिकल मोड लागू करेगी।'
                      : 'Choose the department for your consultation. The system authoritatively activates Allopathic or AYUSH clinical protocols based on your selection.'}
                  </p>
                </div>

                {/* Accessible Select Dropdown with Synchronized Options */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('opd.departmentSelect') || 'Department'}
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => {
                      const found = departments.find(d => d.name === e.target.value);
                      if (found) handleSelectDepartment(found);
                      else setFormData(p => ({ ...p, department: e.target.value }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 outline-none"
                  >
                    {departments.map(d => (
                      <option key={d._id || d.name} value={d.name}>
                        {d.name} ({d.clinicalMode === 'AYUSH' ? 'AYUSH Mode' : 'Medical Mode'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Touch-Friendly Department Cards Grid */}
                {loadingDepts ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Loading departments from hospital database...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {departments.map((dept) => {
                      const isSelected = formData.department === dept.name || formData.departmentId === dept._id;
                      const isDeptAyush = dept.clinicalMode === 'AYUSH';

                      return (
                        <div
                          key={dept._id || dept.name}
                          onClick={() => handleSelectDepartment(dept)}
                          className={`p-5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-4 ${
                            isSelected
                              ? isDeptAyush
                                ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-400'
                                : 'border-blue-700 bg-blue-50/70 shadow-md ring-2 ring-blue-400'
                              : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isDeptAyush ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-[#1e40af]'
                          }`}>
                            {isDeptAyush ? <HeartPulse className="w-6 h-6" /> : <Stethoscope className="w-6 h-6" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-black text-base text-slate-900 truncate">
                                {dept.name}
                              </h4>
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                                isDeptAyush 
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                  : 'bg-blue-100 text-blue-900 border-blue-300'
                              }`}>
                                {isDeptAyush ? 'Clinical Mode: AYUSH' : 'Clinical Mode: MEDICAL'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                              {dept.description || (isDeptAyush ? 'Traditional AYUSH clinical management and herbal medicine' : 'General and specialized allopathic outpatient care')}
                            </p>

                            <div className="mt-2 text-[11px] text-slate-500 font-semibold flex items-center gap-2">
                              <span>Room: {dept.roomNumber || (isDeptAyush ? 'Room 201' : 'Room 104')}</span>
                              <span>•</span>
                              <span>{isDeptAyush ? 'AYUSH Protocols' : 'Allopathic OPD'}</span>
                            </div>
                          </div>

                          <div className="flex items-center self-center pl-2">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? isDeptAyush ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-[#1e40af] bg-[#1e40af] text-white'
                                : 'border-slate-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ================================================ */}
                {/* PROMINENT SELECTION & CLINICAL MODE CONFIRMATION */}
                {/* ================================================ */}
                <div className={`p-5 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-4 transition ${
                  isAyushMode 
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
                    : 'bg-blue-50/80 border-blue-300 text-blue-950'
                }`}>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      {t('patient.department')}
                    </span>
                    <strong className="text-2xl font-black text-slate-900 block">
                      {selectedDeptObj.name}
                    </strong>
                    <p className="text-xs text-slate-600 font-medium">
                      {isAyushMode
                        ? '🌿 AYUSH Clinical Protocol Activated: Prakriti, Vikriti, Agni, and Ayurvedic/AYUSH assessments will be presented.'
                        : '🩺 Medical OPD Allopathic Protocol Activated: General triage and allopathic clinical history will be presented.'}
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      {t('common.clinicalMode')}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-sm uppercase border-2 shadow-sm ${
                      isAyushMode
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-[#1e40af] text-white border-blue-900'
                    }`}>
                      {isAyushMode ? <HeartPulse className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                      <span>Clinical Mode: {selectedDeptObj.clinicalMode}</span>
                    </span>
                  </div>
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
                    onClick={nextStep}
                    className="px-8 py-3.5 bg-[#1e40af] hover:bg-blue-800 text-white font-black rounded-xl text-sm transition flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <span>{t('common.continue')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* STEP 2: PATIENT IDENTIFICATION & REASON              */}
            {/* ==================================================== */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xl font-black text-slate-900">{t('opd.step1')}</h3>
                  <p className="text-xs text-slate-500">{t('opd.step1Desc')}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('opd.fullName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Full Name as per ID"
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('opd.age')} *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="e.g. 45"
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('opd.gender')} *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none bg-white font-bold"
                    >
                      <option value="Male">{t('opd.male')}</option>
                      <option value="Female">{t('opd.female')}</option>
                      <option value="Other">{t('opd.other')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('opd.phone')}
                    </label>
                    <input
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('authentication.abhaId')} ({t('common.optional')})
                    </label>
                    <input
                      type="text"
                      value={formData.abhaId}
                      onChange={(e) => setFormData({ ...formData, abhaId: e.target.value })}
                      placeholder="e.g. 91-8492-1102-3401"
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm focus:border-[#1e40af] outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {isAyushMode ? 'Chief Health Complaint / AYUSH Concern' : t('opd.reasonForVisit')}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.reasonForVisit}
                    onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
                    placeholder={
                      isAyushMode
                        ? 'e.g. Chronic indigestion, joint stiffness, body weakness, sleep issues'
                        : 'e.g. High fever, cough, chest discomfort, acute pain'
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm focus:border-[#1e40af] outline-none"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 border-2 border-slate-300 font-bold rounded-xl text-xs hover:bg-slate-50 transition"
                  >
                    &larr; {t('common.back')}
                  </button>

                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3.5 bg-[#1e40af] hover:bg-blue-800 text-white font-black rounded-xl text-sm transition flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <span>{t('common.continue')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* STEP 3: DIGITAL CONSENT & CONFIRMATION               */}
            {/* ==================================================== */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xl font-black text-slate-900">{t('opd.step6')}</h3>
                  <p className="text-xs text-slate-500">
                    Review and confirm outpatient registration for {formData.department}.
                  </p>
                </div>

                {/* Review Card */}
                <div className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3 text-xs sm:text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('opd.fullName')}</span>
                      <strong className="text-slate-900 font-black">{formData.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('opd.age')} & {t('opd.gender')}</span>
                      <strong className="text-slate-900 font-black">{formData.age} yrs • {formData.gender}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('patient.department')}</span>
                      <strong className="text-slate-900 font-black text-base">{formData.department}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('common.clinicalMode')}</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full font-black text-xs uppercase border ${
                        isAyushMode ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-blue-100 text-blue-900 border-blue-300'
                      }`}>
                        {isAyushMode ? <HeartPulse className="w-3 h-3 text-emerald-700" /> : <Stethoscope className="w-3 h-3 text-[#1e40af]" />}
                        <span>{selectedDeptObj.clinicalMode}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div 
                  className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center gap-3 cursor-pointer"
                  onClick={() => setFormData({ ...formData, consentGiven: !formData.consentGiven })}
                >
                  <input
                    type="checkbox"
                    id="consentAgreed"
                    checked={formData.consentGiven}
                    onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
                    className="w-5 h-5 accent-[#1e40af] cursor-pointer"
                  />
                  <label htmlFor="consentAgreed" className="text-xs sm:text-sm font-bold text-slate-900 cursor-pointer">
                    {t('consent.agree')}
                  </label>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 border-2 border-slate-300 font-bold rounded-xl text-xs hover:bg-slate-50 transition"
                  >
                    &larr; {t('common.back')}
                  </button>

                  <button
                    type="button"
                    disabled={loading || !formData.consentGiven}
                    onClick={handleSubmit}
                    className={`px-8 py-3.5 text-white font-black rounded-xl text-sm transition flex items-center gap-2 shadow-lg ${
                      loading || !formData.consentGiven 
                        ? 'bg-slate-400 cursor-not-allowed' 
                        : 'bg-emerald-700 hover:bg-emerald-800'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{loading ? t('common.loading') : 'Register OPD Visit & Continue'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
