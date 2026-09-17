'use client';

import React, { useState } from 'react';
import { Sparkles, Check, Edit3, X, AlertTriangle, Globe } from 'lucide-react';
import api from '@/lib/api';

interface DoctorAISummaryReviewProps {
  history: any;
  onReviewSubmitted: () => void;
}

export const DoctorAISummaryReview: React.FC<DoctorAISummaryReviewProps> = ({
  history,
  onReviewSubmitted
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(history?.aiSummary || history?.historyOfPresentIllness || '');
  const [doctorNotes, setDoctorNotes] = useState(history?.doctorNotes || '');
  const [loading, setLoading] = useState(false);

  const submitReview = async (status: 'Accepted' | 'Edited' | 'Rejected') => {
    if (!history?._id) return;
    setLoading(true);
    try {
      await api.reviewAISummary(history._id, {
        doctorReviewStatus: status,
        doctorNotes,
        editedSummary: status === 'Edited' ? editedText : history.aiSummary
      });
      setIsEditing(false);
      onReviewSubmitted();
    } catch (e: any) {
      alert(e.message || 'Failed to update review status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
      <div className="flex flex-wrap justify-between items-start gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
              AI-Assisted Clinical Summary
            </h3>
            <span className="bg-blue-100 text-hospital-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-hospital-600" />
              Ollama / DeepSeek Local
            </span>
          </div>
          <p className="text-[11px] font-bold text-amber-700 mt-1 uppercase tracking-wide">
            Draft Summary • Requires Doctor Review &amp; Verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          {history?.patientLanguage && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
              <Globe className="w-3 h-3 text-blue-600" />
              <span>Preferred Language: {history.patientLanguage}</span>
            </span>
          )}

          <span
            className={`text-xs font-black px-2.5 py-1 rounded-full uppercase ${
              history?.doctorReviewStatus === 'Accepted'
                ? 'bg-green-100 text-green-800'
                : history?.doctorReviewStatus === 'Edited'
                ? 'bg-blue-100 text-blue-800'
                : history?.doctorReviewStatus === 'Rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {history?.doctorReviewStatus || 'Pending Review'}
          </span>
        </div>
      </div>

      {/* Original Captured Patient Text (Preserved Separately) */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          Original Patient Captured Statement:
        </span>
        <p className="text-xs font-semibold text-slate-900 italic">
          "{history?.presentingComplaint || history?.chiefComplaint || 'Clinical evaluation requested.'}"
        </p>
      </div>

      {/* Red Flag Attention Alerts */}
      {history?.redFlags && history.redFlags.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-black text-red-700 uppercase">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Potential Clinical Attention Item</span>
          </div>
          <p className="text-xs text-red-800 font-semibold">
            {history.redFlags.join(' • ')}
          </p>
        </div>
      )}

      {/* Summary Content */}
      {isEditing ? (
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          rows={4}
          className="w-full p-3 border-2 border-hospital-500 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-hospital-200"
        />
      ) : (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed italic">
          "{history?.aiSummary || history?.historyOfPresentIllness || 'Clinical intake collected.'}"
        </div>
      )}

      {/* Doctor Action Buttons: Accept / Edit / Reject */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => submitReview('Accepted')}
          className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Check className="w-4 h-4" />
          <span>Accept AI Draft</span>
        </button>

        {isEditing ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => submitReview('Edited')}
            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Save Edited Draft</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Edit3 className="w-4 h-4 text-slate-600" />
            <span>Edit Summary</span>
          </button>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={() => submitReview('Rejected')}
          className="py-2 px-3 border border-red-300 hover:bg-red-50 text-red-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          <span>Reject</span>
        </button>
      </div>
    </div>
  );
};
