'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '../../../components/Navbar';
import { 
  BarChart2, Shield, ArrowRight, TrendingUp, Clock, 
  Users, Activity, Building2
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const hourlyFlow = [
    { hour: '08:00', patients: 24 },
    { hour: '09:00', patients: 48 },
    { hour: '10:00', patients: 62 },
    { hour: '11:00', patients: 55 },
    { hour: '12:00', patients: 38 },
    { hour: '13:00', patients: 21 },
    { hour: '14:00', patients: 12 }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar />

      <header className="bg-white border-b-2 border-slate-300 py-6 px-4 sm:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center font-bold">
              <BarChart2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Outpatient Intake Analytics &amp; Flow</h1>
              <p className="text-xs text-slate-500 font-semibold">
                Hourly patient volume, bottleneck detection, and OPD wait-time distribution
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
        
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Peak OPD Hour</span>
            <div className="text-3xl font-black text-[#1e40af]">10:00 AM</div>
            <p className="text-xs text-slate-500 mt-1">62 registrations / hour</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Average Wait Before Doctor</span>
            <div className="text-3xl font-black text-emerald-700">11.4 min</div>
            <p className="text-xs text-slate-500 mt-1">Reduced from 38 mins baseline</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">AI Pre-Intake Completion</span>
            <div className="text-3xl font-black text-slate-900">88.2%</div>
            <p className="text-xs text-slate-500 mt-1">Patients completed history before consult</p>
          </div>
        </div>

        {/* Hourly Flow Chart */}
        <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-slate-900">Today's Hourly Patient Intake Flow</h3>
              <p className="text-xs text-slate-500">Live telemetry across all OPD registration counters &amp; kiosks</p>
            </div>
          </div>

          <div className="flex items-end justify-between h-48 pt-6 border-b border-slate-200 gap-2">
            {hourlyFlow.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[11px] font-black text-slate-700">{h.patients}</span>
                <div 
                  className="w-full bg-[#1e40af] hover:bg-blue-800 rounded-t-xl transition-all"
                  style={{ height: `${(h.patients / 65) * 100}%` }}
                />
                <span className="text-[10px] font-bold text-slate-400">{h.hour}</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
