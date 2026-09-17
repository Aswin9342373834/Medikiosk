'use client';

import React, { useState } from 'react';
import { Stethoscope, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

interface DoctorAssessmentFormProps {
  patientId: string;
  onConsultationCompleted: () => void;
}

export const DoctorAssessmentForm: React.FC<DoctorAssessmentFormProps> = ({
  patientId,
  onConsultationCompleted
}) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [assessment, setAssessment] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!diagnosis.trim()) {
      alert('Please enter a clinical diagnosis or assessment summary.');
      return;
    }

    setLoading(true);
    try {
      await api.completeConsultation({
        patientId,
        diagnosis,
        clinicalAssessment: assessment,
        doctorNotes,
        treatmentPlan: 'Standard OPD management prescribed',
        followUpInstructions: 'Follow-up as noted in prescription'
      });
      alert('Consultation marked completed successfully! Status transmitted to patient.');
      onConsultationCompleted();
    } catch (err: any) {
      alert(err.message || 'Failed to complete consultation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-hospital-600" />
          <span>Doctor Clinical Assessment &amp; Consultation Completion</span>
        </h3>
        <span className="text-[10px] text-slate-400 font-semibold">Physician Authority</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Clinical Diagnosis / Impression *
          </label>
          <input
            type="text"
            placeholder="e.g. Angina Pectoris / Essential Hypertension"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:border-hospital-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Clinical Assessment Summary
          </label>
          <input
            type="text"
            placeholder="e.g. Mild cardiac ischemia, hemodynamically stable"
            value={assessment}
            onChange={(e) => setAssessment(e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:border-hospital-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
          Confidential Physician Examination Notes
        </label>
        <textarea
          rows={3}
          placeholder="Enter detailed clinical findings, heart sounds, chest auscultation, or differential diagnoses..."
          value={doctorNotes}
          onChange={(e) => setDoctorNotes(e.target.value)}
          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm focus:border-hospital-500 outline-none"
        />
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={handleComplete}
        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="w-5 h-5" />
        <span>{loading ? 'Completing Consultation...' : 'Complete Consultation & Update Record'}</span>
      </button>
    </div>
  );
};
