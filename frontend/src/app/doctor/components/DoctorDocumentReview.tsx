'use client';

import React, { useState } from 'react';
import {
  FileText, Eye, EyeOff, Check, AlertCircle, Edit3, X,
  ExternalLink, CheckCircle2, ShieldCheck, Sparkles, RefreshCw, Layers
} from 'lucide-react';
import api, { API_BASE_URL } from '@/lib/api';

interface DoctorDocumentReviewProps {
  documents: any[];
  onDocumentUpdated: () => void;
}

export const DoctorDocumentReview: React.FC<DoctorDocumentReviewProps> = ({
  documents,
  onDocumentUpdated
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [verifyingDoc, setVerifyingDoc] = useState<any | null>(null);
  const [savingVerification, setSavingVerification] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState('');

  // Editable modal state
  const [editDocType, setEditDocType] = useState<string>('Other');
  const [editOcrText, setEditOcrText] = useState<string>('');
  const [editTestName, setEditTestName] = useState<string>('');
  const [editTestValue, setEditTestValue] = useState<string>('');
  const [editTestUnit, setEditTestUnit] = useState<string>('');
  const [editRefRange, setEditRefRange] = useState<string>('');
  const [editDiagnosis, setEditDiagnosis] = useState<string>('');

  const openVerifyModal = (doc: any) => {
    setVerifyingDoc(doc);
    setEditDocType(doc.documentType || 'Other');
    setEditOcrText(doc.ocrText || '');

    // Extract first investigation or initialize
    const firstInv = doc.extractedData?.investigations?.[0] || {};
    setEditTestName(firstInv.test || '');
    setEditTestValue(firstInv.value || firstInv.result || '');
    setEditTestUnit(firstInv.unit || '');
    setEditRefRange(firstInv.referenceRange || '');
    setEditDiagnosis(doc.extractedData?.diagnoses?.[0] || '');
    setVerifySuccess('');
  };

  const closeVerifyModal = () => {
    setVerifyingDoc(null);
    setVerifySuccess('');
  };

  const handleSaveVerification = async () => {
    if (!verifyingDoc) return;
    setSavingVerification(true);
    setVerifySuccess('');

    try {
      const updatedExtractedData = {
        ...(verifyingDoc.extractedData || {}),
        diagnoses: editDiagnosis.trim() ? [editDiagnosis.trim()] : verifyingDoc.extractedData?.diagnoses || [],
        investigations: editTestName.trim() ? [
          {
            test: editTestName.trim(),
            value: editTestValue.trim(),
            result: editTestValue.trim(),
            unit: editTestUnit.trim(),
            referenceRange: editRefRange.trim(),
            date: new Date()
          }
        ] : verifyingDoc.extractedData?.investigations || []
      };

      await api.updateExtractedData(verifyingDoc._id, {
        documentType: editDocType,
        ocrText: editOcrText,
        extractedData: updatedExtractedData
      });

      setVerifySuccess('OCR verification saved successfully. Original archive preserved.');
      setTimeout(() => {
        closeVerifyModal();
        onDocumentUpdated();
      }, 1000);
    } catch (err: any) {
      alert(`Verification failed to save: ${err.message || 'Please try again.'}`);
    } finally {
      setSavingVerification(false);
    }
  };

  const handleVisibilityChange = async (docId: string, visibility: 'Released' | 'Private') => {
    setUpdatingId(docId);
    try {
      await api.updateDocumentVisibility(docId, visibility);
      onDocumentUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to update visibility');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-hospital-600" />
          <span>Uploaded Reports &amp; OCR ({documents.length})</span>
        </h3>
        <span className="text-[10px] text-slate-400 font-semibold">Doctor Visibility Control</span>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs italic">
          No physical documents uploaded for this patient visit.
        </div>
      ) : (
        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className={`p-4 rounded-xl border-2 transition space-y-3 ${
                doc.visibility === 'Released'
                  ? 'border-green-300 bg-green-50/40'
                  : 'border-amber-200 bg-amber-50/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 truncate max-w-[200px]" title={doc.filename}>
                    {doc.filename}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                      {doc.documentType}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      OCR: {doc.ocrProvider || 'Active'}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                    doc.visibility === 'Released'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {doc.visibility === 'Released' ? 'Visible to Patient' : 'Private (Doctor Only)'}
                </span>
              </div>

              {/* OCR Extracted Text Preview */}
              {doc.ocrText && (
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-mono line-clamp-2">
                  {doc.ocrText}
                </div>
              )}

              {/* Action Buttons: Verify & Compare + Visibility */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openVerifyModal(doc)}
                  className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                  <span>Verify &amp; Compare OCR</span>
                </button>

                <button
                  type="button"
                  disabled={updatingId === doc._id || doc.visibility === 'Released'}
                  onClick={() => handleVisibilityChange(doc._id, 'Released')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    doc.visibility === 'Released'
                      ? 'bg-green-600 text-white shadow-sm cursor-default'
                      : 'bg-white border border-green-600 text-green-700 hover:bg-green-50'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Make Visible</span>
                </button>

                <button
                  type="button"
                  disabled={updatingId === doc._id || doc.visibility === 'Private'}
                  onClick={() => handleVisibilityChange(doc._id, 'Private')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    doc.visibility === 'Private'
                      ? 'bg-amber-600 text-white shadow-sm cursor-default'
                      : 'bg-white border border-amber-600 text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Keep Private</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SIDE-BY-SIDE OCR VERIFICATION MODAL */}
      {verifyingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="bg-[#0b1b3d] text-white p-4 sm:p-5 flex justify-between items-center border-b border-blue-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black tracking-tight">
                      Side-by-Side OCR Verification &amp; Entity Review
                    </h3>
                    <span className="bg-blue-500/30 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/30 uppercase tracking-wider">
                      Audit Logged
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 font-medium">
                    {verifyingDoc.filename} • {verifyingDoc.documentType}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeVerifyModal}
                className="p-2 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Two Column Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-200">

              {/* LEFT COLUMN: Original Document File View */}
              <div className="p-5 sm:p-6 space-y-4 bg-slate-50/50 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                        Source Archival View
                      </span>
                      <h4 className="text-sm font-black text-slate-900">
                        Original Medical File (Immutable)
                      </h4>
                    </div>

                    <a
                      href={`${API_BASE_URL}/documents/${verifyingDoc._id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Open Full Screen</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Document Preview Frame */}
                  <div className="rounded-2xl border-2 border-slate-300 bg-slate-200 overflow-hidden min-h-[420px] max-h-[500px] flex items-center justify-center">
                    {verifyingDoc.filename?.toLowerCase().endsWith('.pdf') ? (
                      <iframe
                        src={`${API_BASE_URL}/documents/${verifyingDoc._id}/file`}
                        title="Original Document Preview"
                        className="w-full h-[480px] bg-white"
                      />
                    ) : (
                      <img
                        src={`${API_BASE_URL}/documents/${verifyingDoc._id}/file`}
                        alt="Document Preview"
                        className="max-h-[480px] w-full object-contain p-2 bg-slate-900"
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2 mt-3">
                  <ShieldCheck className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>ABDM Archival Policy:</strong> The original document upload is preserved immutably. Correcting extracted values does not alter or overwrite the source medical binary.
                  </span>
                </div>
              </div>

              {/* RIGHT COLUMN: Editable OCR & Clinical Entities */}
              <div className="p-5 sm:p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#1e40af] block">
                      Physician Correction Layer
                    </span>
                    <h4 className="text-sm font-black text-slate-900">
                      Editable Clinical Entities &amp; OCR Text
                    </h4>
                  </div>

                  {/* Doctor Review Banner */}
                  <div className="p-3.5 bg-amber-50 border-2 border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Requires Doctor Review:</strong> Review and adjust OCR misreadings, decimal points, and laboratory measurement units before confirming.
                    </span>
                  </div>

                  {/* Document Type Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Document Type
                    </label>
                    <select
                      value={editDocType}
                      onChange={(e) => setEditDocType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-[#1e40af]"
                    >
                      <option value="Prescription">Prescription</option>
                      <option value="Lab Report">Lab Report</option>
                      <option value="Discharge Summary">Discharge Summary</option>
                      <option value="Imaging Report">Imaging Report</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Structured Investigation Extraction */}
                  <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                      Key Clinical Measurement / Test Entity
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Test / Investigation Name
                        </label>
                        <input
                          type="text"
                          value={editTestName}
                          onChange={(e) => setEditTestName(e.target.value)}
                          placeholder="e.g. Hemoglobin / Serum Creatinine"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-[#1e40af]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Measured Value
                        </label>
                        <input
                          type="text"
                          value={editTestValue}
                          onChange={(e) => setEditTestValue(e.target.value)}
                          placeholder="e.g. 13.8 / 1.1"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold outline-none focus:border-[#1e40af]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={editTestUnit}
                          onChange={(e) => setEditTestUnit(e.target.value)}
                          placeholder="e.g. g/dL, mg/dL, /mcL"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-[#1e40af]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Reference Range
                        </label>
                        <input
                          type="text"
                          value={editRefRange}
                          onChange={(e) => setEditRefRange(e.target.value)}
                          placeholder="e.g. 12.0 - 16.0 g/dL"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-[#1e40af]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Diagnosis / Clinical Impression
                      </label>
                      <input
                        type="text"
                        value={editDiagnosis}
                        onChange={(e) => setEditDiagnosis(e.target.value)}
                        placeholder="e.g. Microcytic anemia, Normal sinus rhythm"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-[#1e40af]"
                      />
                    </div>
                  </div>

                  {/* Raw OCR Text Box */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Raw OCR Extracted Content
                    </label>
                    <textarea
                      rows={5}
                      value={editOcrText}
                      onChange={(e) => setEditOcrText(e.target.value)}
                      placeholder="Extracted OCR text characters..."
                      className="w-full p-3 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono text-xs text-slate-800 outline-none focus:border-[#1e40af]"
                    />
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  {verifySuccess && (
                    <div className="p-3 bg-green-50 border border-green-300 text-green-800 text-xs font-bold rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>{verifySuccess}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeVerifyModal}
                      className="px-5 py-2.5 border-2 border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={savingVerification}
                      onClick={handleSaveVerification}
                      className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs transition flex items-center gap-2 shadow"
                    >
                      <Check className="w-4 h-4" />
                      <span>{savingVerification ? 'Saving Verification...' : 'Save Verified OCR'}</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
