'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '../../../components/Navbar';
import api from '../../../lib/api';
import { 
  Users, Shield, ArrowRight, RefreshCw, Search, 
  FileCheck, Clock, Building2, User
} from 'lucide-react';

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.request('/patients');
      if (res.success && Array.isArray(res.data)) {
        setPatients(res.data);
      }
    } catch (e) {
      console.warn('Could not fetch patients:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filtered = patients.filter(p => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.abhaId && p.abhaId.toLowerCase().includes(q)) ||
      (p.tokenNumber && p.tokenNumber.toLowerCase().includes(q)) ||
      (p.department && p.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar />

      <header className="bg-white border-b-2 border-slate-300 py-6 px-4 sm:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center font-bold">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Hospital Patient Directory &amp; OP Registry</h1>
              <p className="text-xs text-slate-500 font-semibold">
                Central government hospital outpatient enrollment and status registry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchPatients}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Registry</span>
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
        
        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, ABHA ID, token or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm font-medium outline-none"
          />
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-slate-900">Registered Outpatients</h3>
              <p className="text-xs text-slate-500">Total Enrolled: {patients.length}</p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-bold">
              Loading patient records...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 font-semibold">
              No matching patients found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider">
                    <th className="p-4">OP Token</th>
                    <th className="p-4">Patient Name</th>
                    <th className="p-4">ABHA ID / UHID</th>
                    <th className="p-4">Age / Gender</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filtered.map(p => (
                    <tr key={p._id} className="hover:bg-slate-50/70">
                      <td className="p-4 font-mono font-black text-[#1e40af] text-sm">
                        {p.tokenNumber || 'TKN-OPD'}
                      </td>
                      <td className="p-4 font-black text-slate-900 text-sm">
                        {p.name}
                      </td>
                      <td className="p-4 font-mono text-slate-600">
                        {p.abhaId}
                      </td>
                      <td className="p-4 text-slate-600">
                        {p.age} yrs • {p.gender}
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {p.department || 'General Medicine'}
                      </td>
                      <td className="p-4">
                        <span className="bg-blue-100 text-blue-900 text-[10px] font-black px-2 py-0.5 rounded">
                          {p.currentStatus}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
