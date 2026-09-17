'use client';

import React from 'react';
import { Upload, FileText, ArrowRight } from 'lucide-react';
import { getTranslation, SupportedLanguage } from '../../../lib/i18n';

interface StepDocumentUploadProps {
  formData: any;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  language: SupportedLanguage;
  totalSteps: number;
  prevStep: () => void;
  nextStep: () => void;
}

export const StepDocumentUpload: React.FC<StepDocumentUploadProps> = ({
  formData,
  handleFileUpload,
  language,
  totalSteps,
  prevStep,
  nextStep
}) => {
  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold text-hospital-600 uppercase tracking-wider">Step 8 of {totalSteps}</span>
        <h2 className="text-3xl font-black text-slate-900 mt-1">{getTranslation('document_upload', language)}</h2>
        <p className="text-slate-600 text-sm mt-1">{getTranslation('upload_instructions', language)}</p>
      </div>

      <div className="border-4 border-dashed border-slate-300 rounded-3xl p-10 text-center space-y-4 hover:border-hospital-500 hover:bg-slate-50 transition cursor-pointer relative">
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,application/pdf"
          onChange={handleFileUpload}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div className="w-16 h-16 mx-auto bg-blue-50 text-hospital-600 rounded-2xl flex items-center justify-center">
          <Upload className="w-8 h-8" />
        </div>
        <div>
          <p className="text-xl font-bold text-slate-900">Scan or Upload Medical Reports</p>
          <p className="text-xs text-slate-500 mt-1">Supports PDF, JPG, PNG (Max 15MB)</p>
        </div>
      </div>

      {formData.documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Queued Documents ({formData.documents.length}):</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {formData.documents.map((file: File, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-5 h-5 text-hospital-600 flex-shrink-0" />
                  <span className="text-xs font-semibold truncate">{file.name}</span>
                </div>
                <span className="text-[10px] bg-blue-100 text-hospital-700 font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                  Ready for OCR
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <button type="button" onClick={prevStep} className="px-8 py-4 border-2 border-slate-300 font-bold rounded-2xl text-lg">
          {getTranslation('back', language)}
        </button>
        <button type="button" onClick={nextStep} className="flex-1 py-4 bg-hospital-600 hover:bg-hospital-700 text-white font-extrabold rounded-2xl text-xl shadow-md flex items-center justify-center gap-2">
          <span>Review Summary</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
