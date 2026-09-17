'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../../../components/Navbar';
import { 
  FileText, Shield, ArrowRight, Download, Printer, 
  Calendar, CheckCircle2, TrendingUp, BarChart2
} from 'lucide-react';

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('daily-opd');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar />

      <header className="bg-white border-b-2 border-slate-300 py-6 px-4 sm:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center font-bold">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Hospital Operational Reports</h1>
              <p className="text-xs text-slate-500 font-semibold">
                Daily outpatient throughput, PM-JAY scheme statistics, and document digitization summaries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Reports</span>
            </button>
            <Link
              href="/admin"
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <span>Admin Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex-1 w-full space-y-6">
        
        {/* Reports Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'daily-opd', title: 'Daily OPD Summary', desc: 'Total registrations, walk-ins, and consults' },
            { id: 'pmjay', title: 'PM-JAY Scheme Report', desc: 'Ayushman Bharat cashless coverage' },
            { id: 'red-flags', title: 'Clinical Attention Log', desc: 'Emergency red-flag symptom alerts' },
            { id: 'ocr-perf', title: 'Document Digitization', desc: 'Scanned paper reports and OCR stats' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setReportType(r.id)}
              className={`p-5 rounded-2xl border-2 text-left transition ${
                reportType === r.id
                  ? 'border-[#1e40af] bg-white shadow-md ring-2 ring-blue-200'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <FileText className={`w-6 h-6 mb-2 ${reportType === r.id ? 'text-[#1e40af]' : 'text-slate-400'}`} />
              <h4 className="text-sm font-black text-slate-900">{r.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
            </button>
          ))}
        </div>

        {/* Report Preview Document */}
        <div className="bg-white rounded-3xl border-2 border-slate-300 p-8 shadow-xl space-y-6">
          <div className="border-b-2 border-slate-200 pb-4 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black text-[#1e40af] uppercase tracking-wider block">
                Official Government Health Report
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                All India Institute of Medical Sciences (AIIMS)
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Report Type: <strong>{reportType.toUpperCase()}</strong> • Date: <strong>{new Date().toLocaleDateString()}</strong>
              </p>
            </div>

            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full uppercase">
              Verified Official Data
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Total OP Registrations</span>
              <strong className="text-2xl font-black text-slate-900">142</strong>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Kiosk Self-Service</span>
              <strong className="text-2xl font-black text-[#1e40af]">89 (62.6%)</strong>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Consultations Completed</span>
              <strong className="text-2xl font-black text-emerald-700">118</strong>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Attention Flags Triaged</span>
              <strong className="text-2xl font-black text-red-700">6 (100% Attended)</strong>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Summary: The hospital clinical intake platform operated with 99.9% uptime today. Average patient history completion 
            via touchscreen and voice was 3.8 minutes, reducing physician history-taking burden by an estimated 65%.
          </p>
        </div>

      </main>
    </div>
  );
}
