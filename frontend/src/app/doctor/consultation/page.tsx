'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/Navbar';
import api from '../../../lib/api';
import { 
  Stethoscope, User, Pill, FileText, CheckCircle2, Clock, 
  ArrowRight, ShieldCheck, AlertTriangle, Sparkles, Plus, Trash2, RefreshCw
} from 'lucide-react';

export default function DoctorConsultationPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Assessment Form
  const [diagnosis, setDiagnosis] = useState<string>('Acute Bronchitis (ICD-10 J20)');
  const [clinicalAssessment, setClinicalAssessment] = useState<string>('Patient presents with 3-day history of dry cough and low grade fever. Lungs clear to auscultation, throat mildly congested.');
  const [doctorNotes, setDoctorNotes] = useState<string>('Advised warm saline gargles, adequate hydration, and symptomatic medication.');
  const [followUp, setFollowUp] = useState<string>('Review after 5 days if fever persists');

  // Prescription Items
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([
    { medicine: 'Paracetamol 650mg', dosage: '650mg', frequency: '1-0-1 (Twice daily)', duration: '3 days', instructions: 'After food' },
    { medicine: 'Levocetirizine 5mg', dosage: '5mg', frequency: '0-0-1 (Once at night)', duration: '5 days', instructions: 'After food' }
  ]);

  const [newMed, setNewMed] = useState({ medicine: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After food' });

  const fetchPatients = async () => {
    try {
      const res = await api.request('/patients');
      if (res.success && Array.isArray(res.data)) {
        setPatients(res.data);
        if (res.data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(res.data[0]._id);
        }
      }
    } catch (e) {}
  };

  const fetchDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.getDoctorPatientDetails(id);
      if (res.success) {
        setPatientDetails(res.data);
      }
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchDetails(selectedPatientId);
    }
  }, [selectedPatientId]);

  const handleAddMed = () => {
    if (!newMed.medicine.trim()) return;
    setPrescriptionItems(prev => [...prev, newMed]);
    setNewMed({ medicine: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After food' });
  };

  const handleRemoveMed = (idx: number) => {
    setPrescriptionItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCompleteConsultation = async () => {
    if (!selectedPatientId) return;
    setSubmitting(true);
    setSuccessMsg('');
    try {
      // 1. Create prescription if items exist
      if (prescriptionItems.length > 0) {
        await api.createPrescription({
          patientId: selectedPatientId,
          items: prescriptionItems,
          followUp,
          generalAdvice: doctorNotes
        });
      }

      // 2. Complete consultation
      await api.completeConsultation({
        patientId: selectedPatientId,
        clinicalAssessment,
        diagnosis,
        doctorNotes,
        followUpInstructions: followUp
      });

      setSuccessMsg('Consultation completed successfully! Prescription issued and patient status updated.');
      fetchPatients();
    } catch (err: any) {
      alert(err.message || 'Failed to complete consultation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar />

      <header className="bg-white border-b-2 border-slate-300 py-6 px-4 sm:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Consultation Room &amp; E-Prescription</h1>
              <p className="text-xs text-slate-500 font-semibold">
                Clinical assessment, ICD-10 diagnosis, physician notes, and prescription builder
              </p>
            </div>
          </div>

          <Link
            href="/doctor"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <span>Doctor Cockpit</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex-1 w-full space-y-6">
        
        {/* Patient Selection Banner */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">
              Active Patient in Consultation
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="px-4 py-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold bg-white outline-none focus:border-[#1e40af]"
            >
              {patients.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.abhaId}) • {p.currentStatus}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span>Status: <strong className="text-emerald-700 font-black">{patientDetails?.patient?.currentStatus || 'In Consultation'}</strong></span>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-sm font-black rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT: Clinical Assessment & Diagnosis */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-2">
              Clinical Assessment &amp; Diagnosis
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Definitive Diagnosis (ICD-10) *
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Essential Hypertension (I10)"
                className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Clinical Assessment
              </label>
              <textarea
                rows={3}
                value={clinicalAssessment}
                onChange={(e) => setClinicalAssessment(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Doctor Examination Notes
              </label>
              <textarea
                rows={2}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Follow-up Instructions
              </label>
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* RIGHT: Prescription Builder */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-2">
              Prescription Builder (Rx)
            </h3>

            {/* Prescribed Items Table */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {prescriptionItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <strong className="text-slate-900 block">{item.medicine}</strong>
                    <span className="text-slate-500">{item.dosage} • {item.frequency} • {item.duration} ({item.instructions})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMed(i)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Medicine Mini-Form */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
              <span className="text-[10px] font-black uppercase text-[#1e40af] block">Add Medication</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Medicine name"
                  value={newMed.medicine}
                  onChange={(e) => setNewMed({ ...newMed, medicine: e.target.value })}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g. 500mg)"
                  value={newMed.dosage}
                  onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Freq (e.g. 1-0-1)"
                  value={newMed.frequency}
                  onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddMed}
                  className="px-4 py-1.5 bg-[#1e40af] text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={submitting || !selectedPatientId}
              onClick={handleCompleteConsultation}
              className={`w-full py-4 text-white font-black rounded-xl text-base shadow-xl transition flex items-center justify-center gap-2 ${
                !submitting ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Finalizing Consultation...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Complete Consultation &amp; Issue Rx</span>
                </>
              )}
            </button>
          </div>

        </div>

      </main>
    </div>
  );
}
