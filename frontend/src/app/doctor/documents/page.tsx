'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '../../../components/Navbar';
import api, { API_BASE_URL } from '../../../lib/api';
import { 
  FileText, ShieldCheck, Lock, Eye, RefreshCw, CheckCircle2, 
  AlertCircle, Stethoscope, ArrowRight, ExternalLink
} from 'lucide-react';

export default function DoctorDocumentsReviewPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const fetchDocuments = async (patientId: string) => {
    setLoading(true);
    try {
      // Doctor can view both Private and Released documents
      const res = await api.getPatientDocuments(patientId);
      if (res.success && Array.isArray(res.data)) {
        setDocuments(res.data);
      }
    } catch (e) {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchDocuments(selectedPatientId);
    }
  }, [selectedPatientId]);

  const handleToggleVisibility = async (docId: string, currentVis: string) => {
    const targetVis = currentVis === 'Released' ? 'Private' : 'Released';
    setUpdatingId(docId);
    try {
      const res = await api.updateDocumentVisibility(docId, targetVis as any);
      if (res.success) {
        setDocuments(prev => prev.map(d => d._id === docId ? { ...d, visibility: targetVis, reviewStatus: 'Reviewed' } : d));
      }
    } catch (err: any) {
      alert(err.message || 'Visibility update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar />

      <header className="bg-white border-b-2 border-slate-300 py-6 px-4 sm:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 text-[#1e40af] rounded-2xl flex items-center justify-center font-bold">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Doctor Report Visibility &amp; OCR Manager</h1>
              <p className="text-xs text-slate-500 font-semibold">
                Authorize patient visibility: KEEP PRIVATE vs MAKE VISIBLE TO PATIENT
              </p>
            </div>
          </div>

          <Link
            href="/doctor"
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <span>Doctor Cockpit</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex-1 w-full space-y-6">
        
        {/* Patient Selector */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              Select Patient to Review Records
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

          <div className="text-right text-xs">
            <span className="text-slate-400 font-bold block uppercase">Security Guardrail</span>
            <span className="text-emerald-700 font-black">All records default to PRIVATE</span>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-xl font-black text-slate-900">Ingested Reports &amp; OCR Extractions</h3>
            <p className="text-xs text-slate-500 font-semibold">
              Compare digitized OCR extracts with scanned uploads and set release status
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-bold">
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 font-semibold">
              No documents uploaded for this patient.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <div key={doc._id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/60">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                        {doc.documentType}
                      </span>
                      <h4 className="text-base font-black text-slate-900">{doc.filename}</h4>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                        doc.visibility === 'Released' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {doc.visibility === 'Released' ? 'VISIBLE TO PATIENT' : 'PRIVATE'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      OCR Engine: <strong className="text-slate-800">{doc.ocrProvider}</strong> • OCR Status: <strong className="text-slate-800">{doc.ocrStatus}</strong>
                    </p>

                    {doc.ocrText && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono line-clamp-2">
                        {doc.ocrText}
                      </p>
                    )}
                  </div>

                  {/* Doctor Visibility Toggle */}
                  <div className="flex items-center gap-3">
                    <a
                      href={`${API_BASE_URL}/documents/${doc._id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View File</span>
                    </a>

                    <button
                      type="button"
                      disabled={updatingId === doc._id}
                      onClick={() => handleToggleVisibility(doc._id, doc.visibility)}
                      className={`px-4 py-2 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 ${
                        doc.visibility === 'Released'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-emerald-700 hover:bg-emerald-800'
                      }`}
                    >
                      {doc.visibility === 'Released' ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>KEEP PRIVATE</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>MAKE VISIBLE TO PATIENT</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
