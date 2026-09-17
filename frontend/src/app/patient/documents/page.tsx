'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api, { API_BASE_URL } from '../../../lib/api';
import { useTranslation } from '../../../contexts/LanguageContext';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { 
  Building2, Upload, FileText, Lock, CheckCircle2, AlertCircle, 
  Eye, RefreshCw, Shield, Sparkles, AlertTriangle, ArrowRight, Clock
} from 'lucide-react';

export default function PatientDocumentsPage() {
  const { t, language } = useTranslation();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('Lab Report');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchMyDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.getMyDocuments();
      if (res.success && Array.isArray(res.data)) {
        setDocuments(res.data);
      }
    } catch (err: any) {
      console.warn('Could not fetch released documents:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyDocuments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError(t('documents.fileTypes'));
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError(t('validation.required'));
      return;
    }

    setUploading(true);
    setError('');
    setUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', documentType);

      const res = await api.uploadDocument(formData);
      if (res.success) {
        setUploadMessage(
          language === 'ta'
            ? 'ஆவணம் வெற்றிகரமாக பதிவேற்றப்பட்டது! இது இயல்பாகவே தனிப்பட்டது (Private) என குறிக்கப்பட்டுள்ளது. மருத்துவர் சரிபார்த்த பின் வெளியிடப்படும்.'
            : language === 'hi'
            ? 'दस्तावेज़ सफलतापूर्वक अपलोड किया गया! डिफ़ॉल्ट रूप से यह निजी (Private) है। डॉक्टर द्वारा समीक्षा के बाद जारी किया जाएगा।'
            : 'Document uploaded securely! Status is set to PRIVATE by default. It will be reviewed by your consulting physician before release.'
        );
        setSelectedFile(null);
        fetchMyDocuments();
      } else {
        throw new Error(res.message || t('errors.generic'));
      }
    } catch (err: any) {
      setError(err.message || t('errors.networkError'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      
      {/* Top Header */}
      <div className="bg-[#0b1b3d] text-white py-2.5 px-3 sm:px-8 border-b border-blue-900">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center text-xs gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span className="font-bold">{t('documents.title')}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="select" className="bg-[#152a57] border-blue-800 text-white" />
            <Link href="/patient" className="text-blue-300 hover:text-white font-bold transition">
              &larr; {t('navigation.dashboard')}
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Privacy Notice Banner */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 flex items-start gap-4">
          <Shield className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
          <div className="space-y-1 text-xs sm:text-sm">
            <h3 className="font-black text-amber-950 text-base">
              {language === 'ta' ? 'மருத்துவ ஆவண ரகசியத்தன்மை பாதுகாப்பு' : language === 'hi' ? 'चिकित्सा दस्तावेज़ गोपनीयता सुरक्षा' : 'Medical Report Privacy & Safety Standard'}
            </h3>
            <p className="text-amber-800 font-medium">
              {language === 'ta'
                ? 'அனைத்து புதிய ஆவணங்களும் முதலில் "தனிப்பட்டது" (Private) நிலையில் வைக்கப்படும். இந்த ஆவணம் உங்கள் மருத்துவருக்கு மட்டும் கிடைக்கும்.'
                : language === 'hi'
                ? 'सभी नए अपलोड पहले "निजी" (Private) स्थिति में होते हैं। यह दस्तावेज़ केवल आपके डॉक्टर के लिए उपलब्ध है।'
                : 'All new uploads are marked PRIVATE by default. Available only to your doctor until verified and released.'}
            </p>
          </div>
        </div>

        {/* Upload Form Card */}
        <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {t('documents.uploadReport')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('documents.subtitle')}
            </p>
          </div>

          {uploadMessage && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{uploadMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-300 text-red-700 text-xs sm:text-sm font-bold rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('documents.documentType')}
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm font-bold bg-white outline-none"
              >
                <option value="Lab Report">{t('documents.labReport')}</option>
                <option value="Prescription">{t('documents.prescriptionSlip')}</option>
                <option value="Radiology">{t('documents.radiology')}</option>
                <option value="Discharge Summary">{t('documents.dischargeSummary')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('documents.dropFiles')}
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="w-full p-4 border-2 border-dashed border-slate-300 rounded-2xl text-xs text-slate-600 cursor-pointer bg-slate-50 hover:bg-slate-100"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                {t('documents.fileTypes')}
              </span>
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-8 py-3.5 bg-[#1e40af] hover:bg-blue-800 disabled:opacity-50 text-white font-black rounded-xl transition flex items-center gap-2 text-sm shadow-md"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? t('documents.uploading') : t('documents.uploadReport')}</span>
            </button>
          </form>
        </div>

        {/* Released Documents List */}
        <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {t('navigation.documents')} ({documents.length})
              </h3>
              <p className="text-xs text-slate-500">
                {t('documents.releasedNotice')}
              </p>
            </div>
            <button
              type="button"
              onClick={fetchMyDocuments}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <p className="text-xs text-slate-500">{t('common.loading')}</p>
          ) : documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap justify-between items-center gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1e40af] flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{doc.originalName}</h4>
                      <p className="text-[11px] text-slate-500">
                        {doc.documentType} • {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                      {t('documents.releasedBadge')}
                    </span>
                    <a
                      href={`${API_BASE_URL}/documents/${doc._id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('documents.viewFile')}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">{t('documents.noDocuments')}</p>
              <p className="text-[11px] text-slate-400">{t('documents.privateNotice')}</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
