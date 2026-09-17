'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { DoctorDocumentReview } from './components/DoctorDocumentReview';
import { DoctorAISummaryReview } from './components/DoctorAISummaryReview';
import { DoctorPrescriptionBuilder } from './components/DoctorPrescriptionBuilder';
import { DoctorPatientTimeline } from './components/DoctorPatientTimeline';
import { DoctorAssessmentForm } from './components/DoctorAssessmentForm';
import { getSocket } from '../../lib/socket';
import api from '../../lib/api';
import { 
  Users, Stethoscope, AlertTriangle, Clock, RefreshCw, UserCheck, ShieldAlert
} from 'lucide-react';

export default function DoctorPortalPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // 1. Fetch Waiting Queue
  const fetchQueue = async () => {
    try {
      const res = await api.getDoctorQueue();
      if (res.success && Array.isArray(res.data)) {
        setQueue(res.data);
        if (res.data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(res.data[0].patientId);
        }
      }
    } catch (err: any) {
      console.warn('Queue fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Full Patient Clinical Dossier
  const fetchPatientDetails = async (patientId: string) => {
    setLoadingDetails(true);
    try {
      const res = await api.getDoctorPatientDetails(patientId);
      if (res.success) {
        setPatientDetails(res.data);
      }
    } catch (err: any) {
      console.warn('Patient details error:', err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    // Socket.IO Real-time Subscriptions
    const socket = getSocket();

    socket.on('new-patient', (patientData) => {
      console.log('[Socket] New patient in queue:', patientData);
      fetchQueue();
    });

    socket.on('red-flag-alert', (alertData) => {
      console.warn('[Socket] RED FLAG ALERT:', alertData);
      fetchQueue();
    });

    socket.on('consultation-completed', () => {
      fetchQueue();
    });

    return () => {
      socket.off('new-patient');
      socket.off('red-flag-alert');
      socket.off('consultation-completed');
    };
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientDetails(selectedPatientId);
    }
  }, [selectedPatientId]);

  const urgentCount = queue.filter(p => p.priority === 'URGENT').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar />

      {/* Doctor Header Bar */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 text-hospital-600 rounded-2xl flex items-center justify-center font-bold">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">Physician Clinical Cockpit</h1>
                <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Active OPD Room 104
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Dr. Ananya Sharma � Consultant Physician � General Medicine</p>
            </div>
          </div>

          {/* Real-time KPI Stats */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Waiting Patients</span>
              <span className="text-lg font-black text-slate-800">{queue.length}</span>
            </div>

            <div className={`px-4 py-1.5 rounded-xl text-center border ${
              urgentCount > 0 ? 'bg-red-50 border-red-200 text-red-700 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <span className="text-[10px] font-bold uppercase block">Red Flag Alerts</span>
              <span className="text-lg font-black">{urgentCount}</span>
            </div>

            <button
              onClick={fetchQueue}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
              title="Refresh Queue"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main 3-Column Clinical Cockpit */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMN 1: PATIENT QUEUE & TIMELINE (3 cols) */}
        <section className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-hospital-600" />
                <span>Patient Queue ({queue.length})</span>
              </span>
              <span className="text-[10px] bg-hospital-100 text-hospital-700 font-bold px-2 py-0.5 rounded-full">
                Live
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading Queue...</div>
              ) : queue.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">No patients in queue.</div>
              ) : (
                queue.map((item) => {
                  const isSelected = selectedPatientId === item.patientId;
                  const isUrgent = item.priority === 'URGENT';
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedPatientId(item.patientId)}
                      className={`p-3.5 cursor-pointer transition flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-blue-50/80 border-l-4 border-hospital-600 shadow-sm'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold text-sm text-slate-900">{item.name}</span>
                        {isUrgent && (
                          <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase animate-pulse">
                            Urgent
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 font-medium line-clamp-1">
                        {item.complaint}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                        <span>ABHA: {item.abhaId}</span>
                        <span className="text-hospital-600">{item.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chronological Timeline */}
          {patientDetails?.timeline && (
            <DoctorPatientTimeline timeline={patientDetails.timeline} />
          )}
        </section>

        {/* COLUMN 2: CLINICAL HISTORY, AI DRAFT, & ASSESSMENT (5 cols) */}
        <section className="lg:col-span-5 space-y-6">
          {loadingDetails ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-sm">
              Loading Patient Dossier...
            </div>
          ) : !patientDetails?.patient ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-sm">
              Select a patient from the queue to start consultation.
            </div>
          ) : (
            <>
              {/* Patient Banner */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">{patientDetails.patient.name}</h2>
                    <p className="text-xs text-slate-500 font-medium">
                      ABHA: {patientDetails.patient.abhaId} � {patientDetails.patient.gender} � Age: {patientDetails.patient.age || 45} � Blood: {patientDetails.patient.bloodGroup || 'B+'}
                    </p>
                  </div>
                  <span className="bg-blue-50 text-hospital-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200">
                    {patientDetails.patient.currentStatus}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="font-bold text-slate-500">Chief Complaint: </span>
                    <span className="font-semibold text-slate-900">{patientDetails.history?.presentingComplaint || 'General OPD'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Government Scheme: </span>
                    <span className="font-semibold text-green-700">{patientDetails.patient.governmentScheme?.schemeName || 'PM-JAY'}</span>
                  </div>
                </div>
              </div>

              {/* AI-Assisted Clinical Summary Review (Accept, Edit, Reject) */}
              <DoctorAISummaryReview
                history={patientDetails.history}
                onReviewSubmitted={() => fetchPatientDetails(selectedPatientId!)}
              />

              {/* AYUSH Details Card if Mode Active */}
              {patientDetails.history?.ayushMode && patientDetails.history?.ayushData && (
                <div className="bg-green-50/70 border border-green-200 rounded-2xl p-5 space-y-2 text-xs text-slate-800">
                  <h4 className="font-black text-green-900 uppercase tracking-wide">AYUSH Dashavidha Pariksha Findings</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Prakriti: <strong>{patientDetails.history.ayushData.prakriti}</strong></div>
                    <div>Vikriti: <strong>{patientDetails.history.ayushData.vikriti}</strong></div>
                    <div>Ahara Shakti: <strong>{patientDetails.history.ayushData.aharaShakti}</strong></div>
                    <div>Vyayama: <strong>{patientDetails.history.ayushData.vyayamaShakti}</strong></div>
                  </div>
                </div>
              )}

              {/* Doctor Clinical Assessment & Consultation Complete Form */}
              <DoctorAssessmentForm
                patientId={patientDetails.patient._id}
                onConsultationCompleted={() => {
                  fetchQueue();
                  fetchPatientDetails(selectedPatientId!);
                }}
              />
            </>
          )}
        </section>

        {/* COLUMN 3: MEDICAL DOCUMENTS & PRESCRIPTION BUILDER (4 cols) */}
        <section className="lg:col-span-4 space-y-6">
          {selectedPatientId && (
            <>
              {/* Doctor Document Review with Visibility Toggle */}
              <DoctorDocumentReview
                documents={patientDetails?.documents || []}
                onDocumentUpdated={() => fetchPatientDetails(selectedPatientId)}
              />

              {/* Electronic Prescription Writer */}
              <DoctorPrescriptionBuilder
                patientId={selectedPatientId}
                onPrescriptionCreated={() => fetchPatientDetails(selectedPatientId)}
              />
            </>
          )}
        </section>

      </main>
    </div>
  );
}
