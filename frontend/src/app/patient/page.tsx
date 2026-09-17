'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { useTranslation } from '../../contexts/LanguageContext';
import { getSocket } from '../../lib/socket';
import api from '../../lib/api';
import { 
  LayoutDashboard, FileText, Pill, Clock, Bell, User, CheckCircle2, 
  ShieldCheck, AlertCircle, Sparkles, Calendar, Activity, Lock,
  Building2, ArrowRight, Printer, RefreshCw, Thermometer, Weight,
  BadgeAlert, Phone, MapPin, Check, PlusCircle, Stethoscope, ChevronRight,
  ClipboardList, HeartPulse, FileCheck2
} from 'lucide-react';

type SidebarTab = 
  | 'dashboard'
  | 'visits'
  | 'history' 
  | 'documents' 
  | 'investigations' 
  | 'prescriptions' 
  | 'vitals' 
  | 'admissions' 
  | 'reminders' 
  | 'notifications' 
  | 'profile';

export default function PatientDashboardPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<SidebarTab>('dashboard');
  const [patient, setPatient] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      let prof = null;
      try {
        const profRes = await api.getPatientProfile();
        prof = profRes.data;
        setPatient(prof);
      } catch (e) {
        // Seeded fallback profile for preview/unauthenticated state
        prof = {
          name: 'Ramesh Kumar',
          abhaId: 'ABHA-9928-1102',
          uhid: 'UHID-882104',
          gender: 'Male',
          age: 52,
          bloodGroup: 'B+',
          contactNumber: '+91 98765 43210',
          currentStatus: 'Waiting for Doctor',
          tokenNumber: 'TKN-104',
          opNumber: 'OPD-2026-918231',
          department: 'General Medicine',
          hospital: 'All India Institute of Medical Sciences (AIIMS)',
          hasActiveVisit: true,
          addressDetails: {
            address: '42, Block C, Main Road',
            villageArea: 'Ansari Nagar',
            district: 'South Delhi',
            state: 'Delhi',
            pincode: '110029'
          },
          emergencyContact: {
            name: 'Sunita Devi',
            relationship: 'Spouse',
            phone: '+91 98111 22334'
          },
          governmentScheme: { 
            schemeName: 'Ayushman Bharat (PM-JAY)', 
            applicationStatus: 'Enrolled' 
          },
          vitals: {
            bp: '128/82 mmHg',
            pulse: '74 bpm',
            temp: '98.6 F',
            spo2: '99%',
            weight: '68 kg',
            height: '172 cm'
          },
          admissions: [
            {
              admissionDate: '2025-11-10',
              dischargeDate: '2025-11-14',
              ward: 'General Medical Ward 3',
              bed: 'Bed 12-A',
              reason: 'Community Acquired Pneumonia',
              status: 'Discharged'
            }
          ],
          medicationReminders: [
            { medicine: 'Atorvastatin 20mg', time: '09:00 PM', dosage: '1 tablet with water', active: true },
            { medicine: 'Metformin 500mg', time: '08:30 AM', dosage: '1 tablet after breakfast', active: true },
            { medicine: 'Telmisartan 40mg', time: '08:00 AM', dosage: '1 tablet before food', active: true }
          ]
        };
        setPatient(prof);
      }

      // 2. Fetch Released Documents
      try {
        const docRes = await api.getMyDocuments();
        if (docRes.success && Array.isArray(docRes.data)) {
          setDocuments(docRes.data);
        }
      } catch (e) {}

      // 3. Fetch Prescriptions & History
      if (prof?._id) {
        try {
          const rxRes = await api.getPatientPrescriptions(prof._id);
          if (rxRes.success) setPrescriptions(rxRes.data);
        } catch (e) {}

        try {
          const histRes = await api.getPatientClinicalHistory(prof._id);
          if (histRes.success) setHistory(histRes.data);
        } catch (e) {}
      }
    } catch (err: any) {
      console.warn('Patient data fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();

    const socket = getSocket();
    socket.on('report-released', () => fetchPatientData());
    socket.on('consultation-completed', () => fetchPatientData());

    return () => {
      socket.off('report-released');
      socket.off('consultation-completed');
    };
  }, []);

  // Determine if patient has an active ongoing OP visit
  const hasActiveOpVisit = 
    patient?.currentStatus && 
    patient.currentStatus !== 'Completed' && 
    (patient.tokenNumber || patient.opNumber);

  const sidebarItems = [
    { id: 'dashboard', label: t('navigation.dashboard'), icon: LayoutDashboard },
    { id: 'visits', label: t('navigation.opVisits'), icon: ClipboardList },
    { id: 'history', label: t('navigation.clinicalHistory'), icon: HeartPulse },
    { id: 'documents', label: `${t('navigation.documents')} (${documents.length})`, icon: FileText },
    { id: 'investigations', label: t('navigation.reports'), icon: Activity },
    { id: 'prescriptions', label: `${t('navigation.prescriptions')} (${prescriptions.length})`, icon: Pill },
    { id: 'vitals', label: t('navigation.vitals'), icon: Thermometer },
    { id: 'admissions', label: t('navigation.admissions'), icon: Building2 },
    { id: 'reminders', label: t('navigation.reminders'), icon: Clock },
    { id: 'notifications', label: t('navigation.notifications'), icon: Bell },
    { id: 'profile', label: t('navigation.profile'), icon: User }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-6 p-4 sm:p-6 lg:p-8">
        
        {/* ======================================================== */}
        {/* SIDEBAR NAVIGATION */}
        {/* ======================================================== */}
        <aside className="w-full md:w-64 bg-white rounded-3xl border-2 border-slate-300 shadow-md p-4 flex flex-col justify-between space-y-4 flex-shrink-0">
          <div className="space-y-4">
            
            {/* Patient Mini-Card */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#1e40af] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-black text-slate-900 truncate">
                  {patient?.name || 'Ramesh Kumar'}
                </h4>
                <span className="text-[10px] font-mono text-[#1e40af] font-bold block truncate">
                  {patient?.abhaId || 'ABHA-9928-1102'}
                </span>
              </div>
            </div>

            {/* Sidebar Navigation Items */}
            <nav className="space-y-1">
              {sidebarItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SidebarTab)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                      isActive 
                        ? 'bg-[#1e40af] text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-3 border-t border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              {language === 'ta' ? 'அரசு மருத்துவமனை முனையம்' : language === 'hi' ? 'सरकारी अस्पताल नोड' : 'Govt Hospital Node'}
            </span>
            <span className="text-xs font-bold text-slate-700">
              AIIMS-ND-OPD-01
            </span>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* MAIN DASHBOARD CONTENT */}
        {/* ======================================================== */}
        <main className="flex-1 space-y-6 min-w-0">
          
          {/* TAB 1: MAIN DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* 1. Welcome Message Banner */}
              <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-sm flex flex-wrap justify-between items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                      ABDM Verified
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      UHID: {patient?.uhid || 'UHID-882104'}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {t('patient.welcome')}, {patient?.name || 'Ramesh Kumar'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {patient?.hospital || 'Government Medical College & Hospital'} • {t('patient.title')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchPatientData}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs flex items-center gap-1"
                    title="Refresh Dashboard"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">{language === 'ta' ? 'புதுப்பி' : language === 'hi' ? 'रिफ्रेश' : 'Refresh'}</span>
                  </button>
                </div>
              </div>

              {/* 2. Health Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">{t('common.status')}</span>
                  <div className="text-lg font-black text-[#1e40af]">{patient?.currentStatus || 'Waiting for Doctor'}</div>
                  <span className="text-[10px] text-slate-500 block">Room 104</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">{t('navigation.prescriptions')}</span>
                  <div className="text-lg font-black text-emerald-700">{prescriptions.length} Issued</div>
                  <span className="text-[10px] text-slate-500 block">Signed by Doctor</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">{t('navigation.documents')}</span>
                  <div className="text-lg font-black text-slate-800">{documents.length} Released</div>
                  <span className="text-[10px] text-slate-500 block">Verified by Physician</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">{t('patient.governmentScheme')}</span>
                  <div className="text-sm font-black text-emerald-800 truncate">PM-JAY Ayushman</div>
                  <span className="text-[10px] text-emerald-600 font-bold block">100% Cashless OPD</span>
                </div>
              </div>

              {/* 3. KIOSK / OPD VISIT FUNCTIONALITY */}
              {hasActiveOpVisit ? (
                /* EXISTING PATIENT CARD: CURRENT OP VISIT */
                <div className="bg-white rounded-3xl border-2 border-[#1e40af] p-6 sm:p-8 shadow-lg space-y-6">
                  <div className="flex flex-wrap justify-between items-start border-b border-slate-200 pb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 text-[#1e40af] rounded-2xl flex items-center justify-center font-black">
                        <FileCheck2 className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="bg-blue-100 text-[#1e40af] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                          {t('patient.activeVisit')}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                          {t('patient.currentOpVisit')}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('patient.opNumber')}</span>
                      <span className="font-mono font-black text-sm text-[#1e40af]">{patient?.opNumber || 'OPD-2026-918231'}</span>
                    </div>
                  </div>

                  {/* Visit Telemetry Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('patient.tokenNumber')}</span>
                      <strong className="text-2xl font-black text-[#1e40af] block">{patient?.tokenNumber || 'TKN-104'}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('patient.department')}</span>
                      <strong className="text-sm font-black text-slate-900 block">{patient?.department || 'General Medicine'}</strong>
                      <span className="text-[10px] text-slate-500">Room 104</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('common.status')}</span>
                      <span className="inline-block bg-blue-100 text-[#1e40af] font-black px-2 py-0.5 rounded text-[11px] mt-1">
                        {patient?.currentStatus || 'Registered'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('documents.doctorReviewPending')}</span>
                      <span className="inline-block bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded text-[11px] mt-1">
                        Waiting for Doctor
                      </span>
                    </div>
                  </div>

                  {/* Continue Visit Button */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <p className="text-xs text-slate-600 font-medium">
                      {language === 'ta'
                        ? 'உங்கள் டோக்கன் செயலில் உள்ளது. மருத்துவ வரலாற்றுப் பதிவை மதிப்பாய்வு செய்யலாம் அல்லது தொடரலாம்.'
                        : language === 'hi'
                        ? 'आपका टोकन सक्रिय है। आप अपनी चिकित्सीय जानकारी की समीक्षा कर सकते हैं या जारी रख सकते हैं।'
                        : 'Your token is active in the physician queue. You can review or complete clinical history intake.'}
                    </p>

                    <Link
                      href="/patient/clinical-history"
                      className="px-8 py-3.5 bg-[#1e40af] hover:bg-blue-800 text-white font-black text-sm rounded-xl transition flex items-center gap-2 shadow-md"
                    >
                      <span>{t('patient.continueVisit')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                /* NEW PATIENT CARD: START A NEW OPD VISIT */
                <div className="bg-white rounded-3xl border-2 border-emerald-600 p-6 sm:p-8 shadow-lg space-y-6">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="space-y-1 max-w-xl">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {t('opd.title')}
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                        {t('patient.startNewOpdVisit')}
                      </h3>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        {t('opd.subtitle')}
                      </p>
                    </div>

                    <Link
                      href="/patient/op-registration"
                      className="px-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-base rounded-2xl transition flex items-center gap-2.5 shadow-lg hover:shadow-xl"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>{t('patient.startNewOpdVisit')}</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>

                  {/* 3 Intake Steps Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block">{t('opd.step1')}:</span>
                      <span className="text-slate-500">{t('opd.step1Desc')}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block">{t('opd.step2')}:</span>
                      <span className="text-slate-500">{t('opd.step2Desc')}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block">{t('opd.step6')}:</span>
                      <span className="text-slate-500">{t('opd.step6Desc')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Quick Action Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href="/patient/clinical-history"
                  className="p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-hospital-500 shadow-sm hover:shadow-md transition space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-hospital-700 flex items-center justify-center font-black group-hover:bg-hospital-700 group-hover:text-white transition">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{t('navigation.clinicalHistory')}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('clinicalHistory.subtitle')}
                  </p>
                </Link>

                <Link
                  href="/patient/documents"
                  className="p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-hospital-500 shadow-sm hover:shadow-md transition space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-hospital-700 flex items-center justify-center font-black group-hover:bg-hospital-700 group-hover:text-white transition">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{t('navigation.documents')}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('documents.subtitle')}
                  </p>
                </Link>

                <Link
                  href="/patient/records"
                  className="p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-hospital-500 shadow-sm hover:shadow-md transition space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-hospital-700 flex items-center justify-center font-black group-hover:bg-hospital-700 group-hover:text-white transition">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{t('records.title')}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('records.subtitle')}
                  </p>
                </Link>
              </div>

            </div>
          )}

          {/* TAB 2: OP VISITS */}
          {activeTab === 'visits' && (
            <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{t('navigation.opVisits')}</h3>
                  <p className="text-xs text-slate-500">Government OPD Consultation Token Slips</p>
                </div>
                <Link
                  href="/patient/op-registration"
                  className="px-4 py-2 bg-[#1e40af] text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition"
                >
                  {t('patient.startNewOpdVisit')}
                </Link>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap justify-between items-center gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t('patient.tokenNumber')}</span>
                  <p className="text-lg font-black text-[#1e40af]">{patient?.tokenNumber || 'TKN-104'}</p>
                  <span className="text-xs text-slate-600">{patient?.department || 'General Medicine'} • Room 104</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t('patient.opNumber')}</span>
                  <p className="text-xs font-mono font-bold text-slate-800">{patient?.opNumber || 'OPD-2026-918231'}</p>
                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-[#1e40af] rounded text-[10px] font-bold mt-1">
                    {patient?.currentStatus || 'Waiting for Doctor'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLINICAL HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{t('navigation.clinicalHistory')}</h3>
                  <p className="text-xs text-slate-500">{t('clinicalHistory.subtitle')}</p>
                </div>
                <Link
                  href="/patient/clinical-history"
                  className="px-4 py-2 bg-[#1e40af] text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition"
                >
                  {t('common.edit')}
                </Link>
              </div>

              {history ? (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-700 block uppercase tracking-wider">{t('ai.chiefComplaint')}</span>
                    <p className="text-sm font-semibold text-slate-900">{history.presentingComplaint || 'General Checkup'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 font-bold block">{t('clinicalHistory.onsetQuestion')}</span>
                      <span className="font-bold text-slate-800">{history.onset || '1-3 days'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 font-bold block">{t('clinicalHistory.severityQuestion')}</span>
                      <span className="font-bold text-slate-800">{history.severity || 'Moderate'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <HeartPulse className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">{t('clinicalHistory.subtitle')}</p>
                  <Link
                    href="/patient/clinical-history"
                    className="inline-flex px-4 py-2 bg-[#1e40af] text-white text-xs font-bold rounded-xl"
                  >
                    {t('clinicalHistory.title')}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MEDICAL DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{t('navigation.documents')}</h3>
                  <p className="text-xs text-slate-500">{t('documents.subtitle')}</p>
                </div>
                <Link
                  href="/patient/documents"
                  className="px-4 py-2 bg-[#1e40af] text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition"
                >
                  {t('documents.uploadReport')}
                </Link>
              </div>

              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc: any) => (
                    <div key={doc._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{doc.originalName}</h4>
                        <span className="text-[10px] text-slate-400">{doc.documentType} • {new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        doc.visibility === 'Released' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {doc.visibility === 'Released' ? t('documents.releasedBadge') : t('documents.privateBadge')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">{t('documents.noDocuments')}</p>
                  <Link
                    href="/patient/documents"
                    className="inline-flex px-4 py-2 bg-[#1e40af] text-white text-xs font-bold rounded-xl"
                  >
                    {t('documents.uploadReport')}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: INVESTIGATION REPORTS */}
          {activeTab === 'investigations' && (
            <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900">{t('navigation.reports')}</h3>
              <p className="text-xs text-slate-500">Diagnostic lab reports released by your attending physician.</p>
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <Activity className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">{t('documents.doctorReviewPending')}</p>
                <p className="text-[11px] text-slate-400">{t('documents.privateNotice')}</p>
              </div>
            </div>
          )}

          {/* TAB 6: PRESCRIPTIONS */}
          {activeTab === 'prescriptions' && (
            <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{t('navigation.prescriptions')}</h3>
                  <p className="text-xs text-slate-500">{t('prescriptions.subtitle')}</p>
                </div>
                <Link
                  href="/patient/prescriptions"
                  className="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition"
                >
                  {t('prescriptions.printSlip')}
                </Link>
              </div>

              {prescriptions.length > 0 ? (
                <div className="space-y-3">
                  {prescriptions.map((rx: any) => (
                    <div key={rx._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 text-xs">{rx.diagnosis || 'Clinical Consultation'}</span>
                        <span className="text-[10px] text-slate-400">{new Date(rx.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="space-y-1">
                        {rx.medications?.map((m: any, idx: number) => (
                          <div key={idx} className="text-xs text-slate-700 flex justify-between border-t border-slate-200/60 pt-1">
                            <span className="font-semibold">{m.name} ({m.dosage})</span>
                            <span className="text-slate-500">{m.frequency} • {m.duration}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                  <Pill className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">{t('prescriptions.noPrescriptions')}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: VITALS */}
          {activeTab === 'vitals' && (
            <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900">{t('navigation.vitals')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('opd.bp')}</span>
                  <span className="text-lg font-black text-slate-900">{patient?.vitals?.bp || '128/82 mmHg'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('opd.pulse')}</span>
                  <span className="text-lg font-black text-slate-900">{patient?.vitals?.pulse || '74 bpm'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('opd.spo2')}</span>
                  <span className="text-lg font-black text-slate-900">{patient?.vitals?.spo2 || '99%'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('opd.temp')}</span>
                  <span className="text-lg font-black text-slate-900">{patient?.vitals?.temp || '98.6 F'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('opd.weight')}</span>
                  <span className="text-lg font-black text-slate-900">{patient?.vitals?.weight || '68 kg'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('opd.height')}</span>
                  <span className="text-lg font-black text-slate-900">{patient?.vitals?.height || '172 cm'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ADMISSIONS */}
          {activeTab === 'admissions' && (
            <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900">{t('navigation.admissions')}</h3>
              {patient?.admissions?.length > 0 ? (
                <div className="space-y-3">
                  {patient.admissions.map((adm: any, idx: number) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{adm.ward} • {adm.bed}</span>
                        <span className="text-emerald-700">{adm.status}</span>
                      </div>
                      <p className="text-slate-600">{adm.reason}</p>
                      <span className="text-[10px] text-slate-400">{adm.admissionDate} to {adm.dischargeDate}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No past hospital inpatient admissions on record.</p>
              )}
            </div>
          )}

          {/* TAB 9: MEDICATION REMINDERS */}
          {activeTab === 'reminders' && (
            <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900">{t('navigation.reminders')}</h3>
              {patient?.medicationReminders?.length > 0 ? (
                <div className="space-y-3">
                  {patient.medicationReminders.map((rem: any, idx: number) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-slate-900 font-bold block">{rem.medicine}</strong>
                        <span className="text-slate-500">{rem.dosage}</span>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-[#1e40af] font-bold rounded-lg">{rem.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No active medication schedules configured.</p>
              )}
            </div>
          )}

          {/* TAB 10: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900">{t('notifications.title')}</h3>
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
                  <Bell className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-blue-900 font-bold block">OPD Token Generated</strong>
                    <p className="text-blue-800">Token {patient?.tokenNumber || 'TKN-104'} issued for General Medicine OPD Room 104.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900">{t('navigation.profile')}</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <span className="text-slate-400 font-bold uppercase block">{t('opd.fullName')}</span>
                  <span className="font-bold text-slate-900">{patient?.name || 'Ramesh Kumar'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <span className="text-slate-400 font-bold uppercase block">{t('authentication.abhaId')}</span>
                  <span className="font-mono font-bold text-slate-900">{patient?.abhaId || 'ABHA-9928-1102'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <span className="text-slate-400 font-bold uppercase block">{t('patient.bloodGroup')}</span>
                  <span className="font-bold text-slate-900">{patient?.bloodGroup || 'B+'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <span className="text-slate-400 font-bold uppercase block">{t('patient.preferredLanguage')}</span>
                  <span className="font-bold text-slate-900">
                    {language === 'ta' ? 'தமிழ் (Tamil)' : language === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
                  </span>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
