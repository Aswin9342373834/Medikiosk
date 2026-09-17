'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useTranslation } from '../../../contexts/LanguageContext';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { 
  Building2, User, MapPin, Phone, HeartPulse, CheckCircle2, 
  ArrowRight, ArrowLeft, ShieldCheck, Printer, RefreshCw, FileText
} from 'lucide-react';

export default function PatientOPRegistrationPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [step, setStep] = useState<number>(1);
  const totalSteps = 6;
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [registeredResult, setRegisteredResult] = useState<any>(null);

  // Form State matching the 6 government hospital sections
  const [formData, setFormData] = useState({
    // Section 1: Patient Identification
    fullName: '',
    age: '',
    dateOfBirth: '',
    gender: 'Male',
    contactNumber: '',
    uhid: '',
    abhaId: '',

    // Section 2: Address
    address: '',
    villageArea: '',
    district: 'Central',
    state: 'Delhi',
    pincode: '110029',

    // Section 3: Emergency Contact
    emergencyName: '',
    emergencyRelationship: 'Spouse',
    emergencyPhone: '',

    // Section 4: Hospital Visit
    hospital: 'All India Institute of Medical Sciences (AIIMS)',
    department: 'General Medicine',
    opdType: 'General OPD',
    visitType: 'New',
    preferredLanguage: language === 'ta' ? 'Tamil' : language === 'hi' ? 'Hindi' : 'English',

    // Section 5: Basic Health Information
    reasonForVisit: '',
    existingConditions: [] as string[],
    currentMedications: '',
    allergies: [] as string[],

    // Section 6: Consent
    consentGiven: true
  });

  const nextStep = () => {
    setError('');
    // Validation per step
    if (step === 1) {
      if (!formData.fullName.trim() || !formData.age) {
        setError(t('validation.fillRequiredFields'));
        return;
      }
    }
    if (step === 5) {
      if (!formData.reasonForVisit.trim()) {
        setError(t('validation.fillRequiredFields'));
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

  const handleCheckboxToggle = (field: 'existingConditions' | 'allergies', value: string) => {
    setFormData(prev => {
      const exists = prev[field].includes(value);
      return {
        ...prev,
        [field]: exists ? prev[field].filter(v => v !== value) : [...prev[field], value]
      };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.opRegister({
        ...formData,
        preferredLanguage: language === 'ta' ? 'Tamil' : language === 'hi' ? 'Hindi' : 'English'
      });
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
        <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center text-xs gap-2">
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

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        
        {registeredResult ? (
          /* COMPLETION SLIP / TOKEN CONFIRMATION */
          <div className="bg-white rounded-3xl border-2 border-emerald-600 shadow-2xl p-6 sm:p-10 space-y-6">
            <div className="text-center space-y-2 border-b-2 border-slate-200 pb-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <span className="inline-block bg-emerald-100 text-emerald-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                {t('opd.confirmation')} • {t('opd.tokenGenerated')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {t('opd.title')}
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
              <div className="text-5xl sm:text-6xl font-black text-[#1e40af] tracking-wider">
                {registeredResult.tokenNumber}
              </div>
              <p className="text-xs text-slate-600 font-bold">
                {language === 'ta'
                  ? `தயவுசெய்து ${registeredResult.department} ஆலோசனை அறைக்குச் செல்லவும்`
                  : language === 'hi'
                  ? `कृपया ${registeredResult.department} परामर्श कक्ष में जाएं`
                  : `Please proceed to ${registeredResult.department} Consultation Room 104`}
              </p>
            </div>

            {/* Generated Official Identifiers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/50 p-6 rounded-2xl border border-blue-200 text-xs sm:text-sm">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">{t('opd.fullName')}</span>
                <strong className="text-slate-900 font-black text-base">{registeredResult.name}</strong>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">{t('patient.opNumber')}</span>
                <strong className="text-[#1e40af] font-mono font-black text-base">{registeredResult.opNumber}</strong>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">{t('authentication.abhaId')}</span>
                <span className="font-mono font-bold text-slate-800">{registeredResult.abhaId}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">UHID / Patient ID</span>
                <span className="font-mono font-bold text-slate-800">{registeredResult.uhid || registeredResult.patientId}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">{t('patient.department')}</span>
                <strong className="text-slate-900">{registeredResult.department}</strong>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">{t('common.status')}</span>
                <span className="bg-blue-100 text-blue-900 font-black px-2 py-0.5 rounded text-xs">
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
          /* MULTI-STEP REGISTRATION WIZARD */
          <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl p-6 sm:p-10 space-y-6">
            
            {/* Step Progress Bar */}
            <div className="space-y-2 border-b border-slate-200 pb-4">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-500">
                <span className="text-[#1e40af] font-black">
                  {t('opd.step')} {step} / {totalSteps}
                </span>
                <span>
                  {step === 1 && t('opd.step1')}
                  {step === 2 && t('opd.step4')}
                  {step === 3 && t('opd.emergencyRelation')}
                  {step === 4 && t('opd.step2')}
                  {step === 5 && t('opd.step5')}
                  {step === 6 && t('opd.step6')}
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

            {/* STEP 1: PATIENT IDENTIFICATION */}
            {step === 1 && (
              <div className="space-y-4">
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
                    placeholder="e.g. Ramesh Kumar"
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
                      {language === 'ta' ? 'பிறந்த தேதி' : language === 'hi' ? 'जन्म तिथि' : 'Date of Birth'} ({t('common.optional')})
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('authentication.abhaId')}
                    </label>
                    <input
                      type="text"
                      value={formData.abhaId}
                      onChange={(e) => setFormData({ ...formData, abhaId: e.target.value })}
                      placeholder="e.g. 91-8492-1102-3401"
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm focus:border-[#1e40af] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      UHID / Patient ID
                    </label>
                    <input
                      type="text"
                      value={formData.uhid}
                      onChange={(e) => setFormData({ ...formData, uhid: e.target.value })}
                      placeholder="Leave blank for new registration"
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm focus:border-[#1e40af] outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ADDRESS */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xl font-black text-slate-900">{t('opd.step4')}</h3>
                  <p className="text-xs text-slate-500">{t('opd.step4Desc')}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('opd.address')}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. House No. 42, Gali 3"
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('opd.villageArea')}
                    </label>
                    <input
                      type="text"
                      value={formData.villageArea}
                      onChange={(e) => setFormData({ ...formData, villageArea: e.target.value })}
                      placeholder="e.g. Ansari Nagar"
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('opd.district')}
                    </label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      placeholder="e.g. South Delhi"
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('opd.state')}
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g. Delhi"
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('opd.pincode')}
                    </label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      placeholder="e.g. 110029"
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: EMERGENCY CONTACT */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xl font-black text-slate-900">{t('patient.emergencyDetails')}</h3>
                  <p className="text-xs text-slate-500">{t('opd.step4Desc')}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('opd.emergencyName')}
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                    placeholder="e.g. Sunita Devi"
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('opd.emergencyRelation')}
                    </label>
                    <select
                      value={formData.emergencyRelationship}
                      onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none bg-white font-bold"
                    >
                      <option value="Spouse">Spouse (கணவன் / மனைவி / पति / पत्नी)</option>
                      <option value="Parent">Parent (பெற்றோர் / माता / पिता)</option>
                      <option value="Child">Child (மகன் / மகள் / संतान)</option>
                      <option value="Sibling">Sibling (சகோதரன் / சகோதரி / भाई / बहन)</option>
                      <option value="Friend/Neighbor">Other / Friend</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('opd.emergencyPhone')}
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      placeholder="+91 98111 22334"
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: HOSPITAL VISIT DETAILS */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xl font-black text-slate-900">{t('opd.step2')}</h3>
                  <p className="text-xs text-slate-500">{t('opd.step2Desc')}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('opd.departmentSelect')}
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none bg-white font-bold"
                  >
                    <option value="General Medicine">General Medicine (பொது மருத்துவம் / सामान्य चिकित्सा)</option>
                    <option value="Cardiology">Cardiology (இதயவியல் / हृदय रोग)</option>
                    <option value="Orthopedics">Orthopedics (எலும்பியல் / अस्थि रोग)</option>
                    <option value="Pediatrics">Pediatrics (குழந்தைகள் நலம் / बाल रोग)</option>
                    <option value="AYUSH / Ayurveda">AYUSH (ஆயுஷ் / आयुष)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('opd.opdType')}
                    </label>
                    <select
                      value={formData.opdType}
                      onChange={(e) => setFormData({ ...formData, opdType: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none bg-white font-bold"
                    >
                      <option value="General OPD">{t('opd.generalOpd')}</option>
                      <option value="Specialty Clinic">{t('opd.specialOpd')}</option>
                      <option value="AYUSH">{t('opd.ayushOpd')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('opd.visitType')}
                    </label>
                    <select
                      value={formData.visitType}
                      onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none bg-white font-bold"
                    >
                      <option value="New">{t('opd.newVisit')}</option>
                      <option value="Follow-Up">{t('opd.followUp')}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: BASIC HEALTH INFORMATION */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xl font-black text-slate-900">{t('opd.step5')}</h3>
                  <p className="text-xs text-slate-500">{t('opd.step5Desc')}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('clinicalHistory.mainQuestion')} *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.reasonForVisit}
                    onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
                    placeholder={t('clinicalHistory.mainQuestionHelper')}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-base focus:border-[#1e40af] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {t('clinicalHistory.pastMedicalHistory')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Thyroid', 'Kidney Disease'].map(cond => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => handleCheckboxToggle('existingConditions', cond)}
                        className={`p-3 rounded-xl border text-xs font-bold transition text-left ${
                          formData.existingConditions.includes(cond)
                            ? 'bg-hospital-100 border-hospital-600 text-hospital-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('clinicalHistory.allergies')}
                  </label>
                  <input
                    type="text"
                    value={formData.allergies.join(', ')}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    placeholder="e.g. Penicillin, Sulfa drugs, Dust"
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm focus:border-[#1e40af] outline-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 6: CONSENT & SUBMISSION */}
            {step === 6 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xl font-black text-slate-900">{t('opd.step6')}</h3>
                  <p className="text-xs text-slate-500">{t('opd.step6Desc')}</p>
                </div>

                <div className="bg-blue-50/70 border-2 border-blue-200 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-8 h-8 text-[#1e40af] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-slate-900 text-base">
                        {t('consent.title')}
                      </h4>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                        {t('consent.body')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-blue-200 text-xs text-slate-600 space-y-2">
                    <p className="font-semibold text-slate-900">
                      {t('consent.aiNotice')}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {t('consent.legalNotice')}
                    </p>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={formData.consentGiven}
                      onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
                      className="w-5 h-5 rounded text-[#1e40af] focus:ring-[#1e40af]"
                    />
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      {t('consent.agree')}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Wizard Navigation Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-black rounded-xl hover:bg-slate-100 transition flex items-center gap-2 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('common.back')}</span>
                </button>
              ) : <div />}

              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-3.5 bg-[#1e40af] hover:bg-blue-800 text-white font-black rounded-xl transition flex items-center gap-2 text-sm shadow-md"
                >
                  <span>{t('common.continue')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading || !formData.consentGiven}
                  onClick={handleSubmit}
                  className="px-8 py-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-xl transition flex items-center gap-2 text-base shadow-lg"
                >
                  <span>{loading ? t('common.loading') : t('common.submit')}</span>
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
