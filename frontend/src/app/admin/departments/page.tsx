'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '../../../components/Navbar';
import api from '../../../lib/api';
import { 
  Building2, Shield, ArrowRight, RefreshCw, Activity, 
  Users, Stethoscope, Clock
} from 'lucide-react';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminDepartments();
      if (res.success && Array.isArray(res.data)) {
        setDepartments(res.data);
      }
    } catch (e) {
      console.warn('Departments fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar />

      <header className="bg-white border-b-2 border-slate-300 py-6 px-4 sm:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 text-[#1e40af] rounded-2xl flex items-center justify-center font-bold">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Departmental Loads &amp; OPD Capacity</h1>
              <p className="text-xs text-slate-500 font-semibold">
                Real-time patient flow, wait times, and clinical load distribution
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept, i) => (
            <div
              key={dept._id || i}
              className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{dept.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">OPD-DEP-0{i + 1}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  dept.currentLoad > 10 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {dept.currentLoad > 10 ? 'High Volume' : 'Normal'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Waiting Patients</span>
                  <strong className="text-xl font-black text-[#1e40af]">{dept.currentLoad || 8}</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Doctors</span>
                  <strong className="text-xl font-black text-slate-800">{dept.activeDoctors || 2}</strong>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs text-slate-500">
                <span>Avg Wait: <strong>{dept.avgWaitTime || '14 mins'}</strong></span>
                <span className="text-emerald-700 font-bold">Counter Open</span>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
