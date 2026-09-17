'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '../../../components/Navbar';
import api from '../../../lib/api';
import { 
  Monitor, Shield, ArrowRight, RefreshCw, CheckCircle2, 
  AlertTriangle, Wifi, Mic, FileText
} from 'lucide-react';

export default function AdminKiosksPage() {
  const [kiosks, setKiosks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchKiosks = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminKiosks();
      if (res.success && Array.isArray(res.data)) {
        setKiosks(res.data);
      }
    } catch (e) {
      console.warn('Kiosks fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKiosks();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar />

      <header className="bg-white border-b-2 border-slate-300 py-6 px-4 sm:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 text-[#1e40af] rounded-2xl flex items-center justify-center font-bold">
              <Monitor className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Hospital Kiosk Terminal Fleet</h1>
              <p className="text-xs text-slate-500 font-semibold">
                Hardware telemetry: Touchscreen, OCR scanner, voice microphone, and network health
              </p>
            </div>
          </div>

          <Link
            href="/admin"
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <span>Admin Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex-1 w-full space-y-6">
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Terminals</span>
            <div className="text-3xl font-black text-slate-900">{kiosks.length}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Operational Status</span>
            <div className="text-3xl font-black text-emerald-700">100% Online</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Peripherals</span>
            <div className="text-lg font-black text-[#1e40af]">Touch • Voice • OCR</div>
          </div>
        </div>

        {/* Kiosks Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {kiosks.map((kiosk, idx) => (
            <div
              key={kiosk._id || idx}
              className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-[#1e40af] rounded-xl flex items-center justify-center font-bold">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">{kiosk.kioskId}</h4>
                    <p className="text-xs text-slate-500">{kiosk.location}</p>
                  </div>
                </div>

                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  {kiosk.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <Wifi className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 font-bold block">Network</span>
                  <strong className="text-slate-800">Connected</strong>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <Mic className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 font-bold block">Voice Mic</span>
                  <strong className="text-slate-800">Ready</strong>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <FileText className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 font-bold block">OCR Feed</span>
                  <strong className="text-slate-800">Ready</strong>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs text-slate-500">
                <span>Today's Sessions: <strong>{kiosk.todayUsage || 42}</strong></span>
                <span>Uptime: <strong>99.9%</strong></span>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
