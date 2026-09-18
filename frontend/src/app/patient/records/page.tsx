'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '../../../components/Navbar';
import { getSocket } from '../../../lib/socket';
import api, { API_BASE_URL } from '../../../lib/api';
import { 
  HeartPulse, FileText, Pill, Clock, Bell, User, CheckCircle2, 
  ShieldCheck, AlertCircle, Sparkles, Calendar, Activity, Lock,
  Building2, ArrowRight, Printer, RefreshCw, Thermometer, Weight,
  BadgeAlert, Phone, MapPin, Check, Download
} from 'lucide-react';

import { useTranslation } from '../../../contexts/LanguageContext';

export default function PatientRecordsPage() {
  const { t, language } = useTranslation();
  const [patient, setPatient] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 10 Mandatory Sections
  type ActiveSection = 
    | 'overview' 
    | 'history' 
    | 'documents' 
    | 'investigations' 
    | 'prescriptions' 
    | 'vitals' 
    | 'admissions' 
    | 'reminders' 
    | 'notifications' 
    | 'profile';

  const [activeTab, setActiveTab] = useState<ActiveSection>('overview');
  const [activeVisit, setActiveVisit] = useState<any>(null);
  const [exportingFhir, setExportingFhir] = useState(false);

  const handleExportFhir = async () => {
    if (!patient?._id) return;
    setExportingFhir(true);
    try {
      const res = await api.getPatientFhirBundle(patient._id);
      if (res.success && res.data) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `fhir_r4_opconsult_${patient.opNumber || patient._id}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
    } catch (err: any) {
      alert('Failed to export FHIR bundle: ' + err.message);
    } finally {
      setExportingFhir(false);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      // 1. Get profile
      let prof = null;
      try {
        const profRes = await api.getPatientProfile();
        if (profRes.success && profRes.data) {
          prof = profRes.data;
          setPatient(prof);
        } else {
          setPatient(null);
        }
      } catch (e) {
        setPatient(null);
      }

      // Fetch active OPD visit
      try {
        const visitRes = await api.getActiveOpdVisit();
        if (visitRes.success && visitRes.data) {
          setActiveVisit(visitRes.data);
        } else {
          setActiveVisit(null);
        }
      } catch (e) {
        setActiveVisit(null);
      }

      // 2. Get Released Documents ONLY (Privacy-enforced)
      try {
        const docRes = await api.getMyDocuments();
        if (docRes.success && Array.isArray(docRes.data)) {
          setDocuments(docRes.data);
        } else {
          setDocuments([]);
        }
      } catch (e) {
        setDocuments([]);
      }

      // 3. Get Prescriptions & History
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
      console.warn('Records fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();

    const socket = getSocket();
    socket.on('report-released', (data) => {
      alert(`Doctor Notification: A medical report ("${data.filename}") has been verified and released to your portal.`);
      fetchRecords();
    });

    socket.on('consultation-completed', () => {
      alert('Consultation Completed: Your clinical assessment and treatment plan are updated.');
      fetchRecords();
    });

    return () => {
      socket.off('report-released');
      socket.off('consultation-completed');
    };
  }, []);

  const investigationsList = [
    { test: 'Complete Blood Count (CBC)', date: '2026-09-12', result: 'Hb: 13.8 g/dL, TLC: 7,400 /mcL, Platelets: 2.2 Lakhs', status: 'Completed', lab: 'Central Hospital Hematology Lab' },
    { test: 'Serum Lipid Profile', date: '2026-09-10', result: 'Total Chol: 188 mg/dL, Triglycerides: 142 mg/dL, HDL: 44 mg/dL', status: 'Completed', lab: 'Clinical Biochemistry Lab' },
    { test: '12-Lead Electrocardiogram (ECG)', date: '2026-09-08', result: 'Normal sinus rhythm, HR 72 bpm, no acute ST-T changes', status: 'Verified', lab: 'OPD Cardiology Room 102' }
  ];

  const notificationsList = [
    { title: 'Prescription Ready', time: 'Today', desc: 'Physician signed your active outpatient e-prescription. Please visit the pharmacy window.' },
    { title: 'OPD Queue Active', time: 'Today', desc: `Your token ${patient?.tokenNumber || 'TKN-104'} is currently active in the waiting queue.` },
    { title: 'ABDM Health Record Synced', time: 'Yesterday', desc: 'Your Ayushman Bharat Health Account has been verified for paperless health exchange.' }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar />

      {/* Top Government Official Patient Header */}
      <header className="bg-white border-b-2 border-slate-300 py-6 px-4 sm:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#1e40af] text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">
                  {patient?.name || (loading ? t('common.loading') : 'Guest Patient')}
                </h1>
                {patient && (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                    ABHA Linked
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                ABHA ID: <span className="font-mono font-bold text-[#1e40af]">{patient?.abhaId || (patient ? 'Verified' : 'Not Linked')}</span> • {patient?.gender || 'N/A'} • Age: {patient?.age || 'N/A'} • Blood Group: {patient?.bloodGroup || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-right">
              <span className="text-[10px] text-slate-500 font-black uppercase block">OP Registration No.</span>
              <span className="text-sm font-mono font-black text-[#1e40af]">{activeVisit?.opNumber || patient?.opNumber || 'No Active OP'}</span>
            </div>

            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-right">
              <span className="text-[10px] text-slate-500 font-black uppercase block">Current Token</span>
              <span className="text-sm font-black text-emerald-700">{activeVisit?.tokenNumber || patient?.tokenNumber || 'No Token'}</span>
            </div>

            <button
              onClick={handleExportFhir}
              disabled={exportingFhir || !patient}
              className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-black rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
              title="Download NRCES / ABDM compliant FHIR R4 Outpatient Consultation Record"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              {exportingFhir ? 'Exporting...' : 'FHIR R4 JSON'}
            </button>
          </div>
        </div>

        {/* 10 Navigation Tabs */}
        <div className="max-w-6xl mx-auto flex flex-wrap gap-2 pt-6 border-t border-slate-200 mt-6">
          {[
            { id: 'overview', label: t('patient.healthOverview') },
            { id: 'history', label: t('navigation.clinicalHistory') },
            { id: 'documents', label: `${t('navigation.documents')} (${documents.length})` },
            { id: 'investigations', label: t('navigation.reports') },
            { id: 'prescriptions', label: `${t('navigation.prescriptions')} (${prescriptions.length})` },
            { id: 'vitals', label: t('navigation.vitals') },
            { id: 'admissions', label: t('navigation.admissions') },
            { id: 'reminders', label: t('navigation.reminders') },
            { id: 'notifications', label: t('navigation.notifications') },
            { id: 'profile', label: t('navigation.profile') }
          ].map(tTab => (
            <button
              key={tTab.id}
              onClick={() => setActiveTab(tTab.id as ActiveSection)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition ${
                activeTab === tTab.id
                  ? 'bg-[#1e40af] text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tTab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content View Container */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex-1 w-full">
        
        {/* 1. HEALTH OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Consultation Department</span>
                <h3 className="text-xl font-black text-slate-900">{patient?.department || 'General Medicine'}</h3>
                <p className="text-xs text-slate-500">Room 104 • OPD Senior Consultant</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Government Scheme Status</span>
                <h3 className="text-xl font-black text-emerald-700">Ayushman Bharat (PM-JAY)</h3>
                <p className="text-xs text-slate-500">Enrolled • 100% Cashless OPD Coverage</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Current OPD Status</span>
                <h3 className="text-xl font-black text-[#1e40af]">{patient?.currentStatus || 'Waiting for Doctor'}</h3>
                <p className="text-xs text-slate-500">Token {patient?.tokenNumber || 'TKN-104'} in queue</p>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Need to record more symptoms or upload fresh reports?</h3>
                <p className="text-xs text-slate-500">Add information directly into your physician's clinical intake stream</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/patient/clinical-history"
                  className="px-4 py-2.5 bg-[#1e40af] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Clinical History Wizard
                </Link>
                <Link
                  href="/patient/documents"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Upload Reports
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 2. CLINICAL HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900">Recorded Clinical History</h3>
                <p className="text-xs text-slate-500">Structured narrative history prepared for treating physician</p>
              </div>
              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full uppercase">
                Requires Doctor Review
              </span>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Chief Complaint</span>
                <p className="text-base font-black text-slate-900 mt-1">
                  {history?.presentingComplaint || patient?.basicHealth?.reasonForVisit || 'Acute chest discomfort and breathlessness for 2 days'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">History of Present Illness</span>
                  <p className="text-slate-800 mt-1">
                    {history?.historyOfPresentIllness || 'Patient reported sudden onset retrosternal discomfort on exertion with mild dyspnea.'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Past Medical History</span>
                  <p className="text-slate-800 mt-1">
                    {Array.isArray(history?.pastMedicalHistory) && history.pastMedicalHistory.length > 0 
                      ? history.pastMedicalHistory.join(', ')
                      : (patient?.basicHealth?.existingConditions?.join(', ') || 'Hypertension (3 years), Type-2 Diabetes Mellitus')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. MEDICAL DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">Released Medical Documents</h3>
                <p className="text-xs text-slate-500">Only physician-verified and released reports are displayed</p>
              </div>
              <Link
                href="/patient/documents"
                className="px-4 py-2 bg-[#1e40af] text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition"
              >
                Upload New
              </Link>
            </div>

            {documents.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                <Lock className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No Released Documents</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  New uploads default to <strong>PRIVATE</strong> until verified by your doctor.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.map((d: any) => (
                  <div key={d._id} className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{d.filename}</h4>
                      <p className="text-[10px] text-slate-500">{d.documentType} • Released</p>
                    </div>
                    <a
                      href={`${API_BASE_URL}/documents/${d._id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-emerald-700 text-white rounded text-xs font-bold"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. INVESTIGATION REPORTS TAB */}
        {activeTab === 'investigations' && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-xl font-black text-slate-900">Hospital Investigation Reports</h3>
              <p className="text-xs text-slate-500">Pathology, Biochemistry &amp; Diagnostic Radiology tests</p>
            </div>

            <div className="divide-y divide-slate-100">
              {investigationsList.map((inv, i) => (
                <div key={i} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">{inv.test}</h4>
                      <span className="bg-blue-100 text-[#1e40af] text-[10px] font-black px-2 py-0.5 rounded">
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-semibold">{inv.result}</p>
                    <span className="text-[10px] text-slate-400 block">{inv.lab} • {inv.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. PRESCRIPTIONS TAB */}
        {activeTab === 'prescriptions' && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">Digital Outpatient Prescriptions</h3>
                <p className="text-xs text-slate-500">Government OPD e-prescriptions and medication course</p>
              </div>
              <Link
                href="/patient/prescriptions"
                className="text-xs font-bold text-[#1e40af] hover:underline"
              >
                View Full Rx Slips &rarr;
              </Link>
            </div>

            {prescriptions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-semibold">
                No active prescriptions found. Consulting doctor will issue prescription upon examination.
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((rx: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-black text-[#1e40af]">Prescription #{rx._id.slice(-6).toUpperCase()}</span>
                    <div className="text-xs text-slate-700">
                      {rx.items.map((it: any, j: number) => (
                        <div key={j} className="py-1">
                          • <strong>{it.medicine}</strong> ({it.dosage}) — {it.frequency} for {it.duration}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. VITALS TAB */}
        {activeTab === 'vitals' && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-xl font-black text-slate-900">Patient Physiological Vitals</h3>
              <p className="text-xs text-slate-500">Recorded at hospital triage nursing station</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Blood Pressure</span>
                <strong className="text-2xl font-black text-[#1e40af]">{patient?.vitals?.bp || '128/82 mmHg'}</strong>
              </div>

              <div className="p-4 bg-red-50/60 rounded-xl border border-red-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Pulse / Heart Rate</span>
                <strong className="text-2xl font-black text-red-700">{patient?.vitals?.pulse || '74 bpm'}</strong>
              </div>

              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Body Temperature</span>
                <strong className="text-2xl font-black text-amber-700">{patient?.vitals?.temp || '98.6 F'}</strong>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">SpO2 (Oxygen Saturation)</span>
                <strong className="text-2xl font-black text-emerald-700">{patient?.vitals?.spo2 || '99%'}</strong>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Weight</span>
                <strong className="text-2xl font-black text-slate-800">{patient?.vitals?.weight || '68 kg'}</strong>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Height</span>
                <strong className="text-2xl font-black text-slate-800">{patient?.vitals?.height || '172 cm'}</strong>
              </div>
            </div>
          </div>
        )}

        {/* 7. ADMISSIONS TAB */}
        {activeTab === 'admissions' && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-xl font-black text-slate-900">Hospital Inpatient Admissions</h3>
              <p className="text-xs text-slate-500">Historical ward admissions, bed allocations &amp; discharge summaries</p>
            </div>

            <div className="space-y-4">
              {(patient?.admissions || []).map((adm: any, i: number) => (
                <div key={i} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{adm.ward}</h4>
                      <p className="text-xs text-slate-500">Bed: <strong>{adm.bed}</strong> • Reason: <strong>{adm.reason}</strong></p>
                    </div>
                    <span className="bg-slate-200 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded">
                      {adm.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Admitted: {new Date(adm.admissionDate).toLocaleDateString()} • Discharged: {adm.dischargeDate ? new Date(adm.dischargeDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. MEDICATION REMINDER TAB */}
        {activeTab === 'reminders' && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-xl font-black text-slate-900">Medication Timetable &amp; Reminders</h3>
              <p className="text-xs text-slate-500">Scheduled dosages to ensure treatment compliance</p>
            </div>

            <div className="divide-y divide-slate-100">
              {(patient?.medicationReminders || []).map((rem: any, i: number) => (
                <div key={i} className="py-4 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-black text-slate-900">{rem.medicine}</h4>
                    <p className="text-xs text-slate-600">{rem.dosage}</p>
                    <span className="text-[10px] text-[#1e40af] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{rem.time}</span>
                    </span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Active Alert</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-xl font-black text-slate-900">Hospital Notifications</h3>
              <p className="text-xs text-slate-500">Queue calls, report releases, and doctor advisories</p>
            </div>

            <div className="space-y-3">
              {notificationsList.map((notif, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <Bell className="w-5 h-5 text-[#1e40af] flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900">{notif.title}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">{notif.time}</span>
                    </div>
                    <p className="text-xs text-slate-600">{notif.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-xl font-black text-slate-900">Patient Official Profile</h3>
              <p className="text-xs text-slate-500">Demographic registry linked to National Health Authority (ABDM)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block">FULL NAME</span>
                <strong className="text-sm text-slate-900">{patient?.name}</strong>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block">ABHA NUMBER</span>
                <strong className="text-sm font-mono text-[#1e40af]">{patient?.abhaId}</strong>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block">PHONE CONTACT</span>
                <strong className="text-sm text-slate-900">{patient?.contactNumber || '+91 98765 43210'}</strong>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block">DOMICILE ADDRESS</span>
                <strong className="text-sm text-slate-900">
                  {patient?.addressDetails?.address ? `${patient.addressDetails.address}, ${patient.addressDetails.villageArea}, ${patient.addressDetails.district}, ${patient.addressDetails.state} - ${patient.addressDetails.pincode}` : '42, Block C, Ansari Nagar, South Delhi, Delhi - 110029'}
                </strong>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block">EMERGENCY CONTACT</span>
                <strong className="text-sm text-slate-900">
                  {patient?.emergencyContact?.name} ({patient?.emergencyContact?.relationship}) • {patient?.emergencyContact?.phone}
                </strong>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block">REGISTERED HOSPITAL</span>
                <strong className="text-sm text-slate-900">{patient?.hospital || 'All India Institute of Medical Sciences (AIIMS)'}</strong>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
