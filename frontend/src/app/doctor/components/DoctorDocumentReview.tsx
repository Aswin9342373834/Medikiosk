'use client';

import React, { useState } from 'react';
import { FileText, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface DoctorDocumentReviewProps {
  documents: any[];
  onDocumentUpdated: () => void;
}

export const DoctorDocumentReview: React.FC<DoctorDocumentReviewProps> = ({
  documents,
  onDocumentUpdated
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
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
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-mono line-clamp-3">
                  {doc.ocrText}
                </div>
              )}

              {/* Doctor Report Visibility Toggle Buttons */}
              <div className="flex gap-2 pt-1">
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
    </div>
  );
};
