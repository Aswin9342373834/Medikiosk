'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '../../../components/Navbar';
import api from '../../../lib/api';
import { 
  Stethoscope, Shield, ArrowRight, RefreshCw, CheckCircle2, 
  Clock, Building2, UserCheck, AlertCircle
} from 'lucide-react';

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([
    { name: 'Dr. Ananya Sharma', department: 'General Medicine', room: 'Room 104', status: 'Available', todaySeen: 18, activeConsultation: 'In Progress' },
    { name: 'Dr. Priya Nair', department: 'Cardiology', room: 'Room 201', status: 'Available', todaySeen: 14, activeConsultation: 'In Progress' },
    { name: 'Dr. Rajesh Varma', department: 'AYUSH / Ayurveda', room: 'Room 108', status: 'Available', todaySeen: 21, activeConsultation: 'Waiting' },
    { name: 'Dr. S. K. Mukherjee', department: 'Pulmonology', room: 'Room 112', status: 'In OPD Round', todaySeen: 9, activeConsultation: 'Idle' },
    { name: 'Dr. Kavitha Raman', department: 'Orthopedics', room: 'Room 115', status: 'Available', todaySeen: 16, activeConsultation: 'In Progress' }
  ]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar />

      <header className="bg-white border-b-2 border-slate-300 py-6 px-4 sm:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Doctor Faculty Roster &amp; OPD Duty</h1>
              <p className="text-xs text-slate-500 font-semibold">
                Clinical specialists, outpatient room allocations, and live consultation metrics
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
            <span className="text-xs font-bold text-slate-400 uppercase">On-Duty Doctors</span>
            <div className="text-3xl font-black text-slate-900">{doctors.length}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Total OPD Patients Examined Today</span>
            <div className="text-3xl font-black text-emerald-700">
              {doctors.reduce((sum, d) => sum + d.todaySeen, 0)}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Average Consult Time</span>
            <div className="text-3xl font-black text-[#1e40af]">4.2 min</div>
          </div>
        </div>

        {/* Doctor Roster Cards */}
        <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-xl font-black text-slate-900">Active OPD Consultation Roster</h3>
            <p className="text-xs text-slate-500 font-semibold">Live clinical cockpit presence &amp; capacity</p>
          </div>

          <div className="divide-y divide-slate-100">
            {doctors.map((doc, idx) => (
              <div key={idx} className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50/60">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-[#1e40af] rounded-2xl flex items-center justify-center font-bold text-base">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">{doc.name}</h4>
                    <p className="text-xs text-slate-600 font-medium">
                      {doc.department} • <strong className="text-slate-800">{doc.room}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Patients Seen</span>
                    <strong className="text-base text-slate-900">{doc.todaySeen}</strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Status</span>
                    <span className="bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full text-[11px]">
                      {doc.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
