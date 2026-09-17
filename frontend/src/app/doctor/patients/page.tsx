'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/Navbar';
import { getSocket } from '../../../lib/socket';
import api from '../../../lib/api';
import { 
  Users, Stethoscope, AlertTriangle, Clock, RefreshCw, 
  ArrowRight, ShieldAlert, CheckCircle2, Search, Filter
} from 'lucide-react';

export default function DoctorPatientsQueuePage() {
  const router = useRouter();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getDoctorQueue();
      if (res.success && Array.isArray(res.data)) {
        setQueue(res.data);
      }
    } catch (err: any) {
      console.warn('Queue fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    const socket = getSocket();
    socket.on('new-patient', () => fetchQueue());
    socket.on('red-flag-alert', () => fetchQueue());
    socket.on('consultation-completed', () => fetchQueue());

    return () => {
      socket.off('new-patient');
      socket.off('red-flag-alert');
      socket.off('consultation-completed');
    };
  }, []);

  const filteredQueue = queue.filter(item => {
    if (filterPriority !== 'ALL' && item.priority !== filterPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.patientName.toLowerCase().includes(q) ||
        item.token.toLowerCase().includes(q) ||
        item.complaint.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const urgentCount = queue.filter(p => p.priority === 'URGENT').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar />

      {/* Doctor Header */}
      <header className="bg-white border-b-2 border-slate-300 py-6 px-4 sm:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Doctor OPD Patient Queue</h1>
              <p className="text-xs text-slate-500 font-semibold">
                Real-time outpatient triage with Red-Flag priority alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchQueue}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Queue</span>
            </button>

            <Link
              href="/doctor"
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <span>Doctor Cockpit</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex-1 w-full space-y-6">
        
        {/* KPI Alert Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Total Waiting</span>
              <div className="text-3xl font-black text-slate-900">{queue.length}</div>
            </div>
            <Users className="w-8 h-8 text-[#1e40af]" />
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-red-200 shadow-sm flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-red-500 uppercase">Attention Alerts</span>
              <div className="text-3xl font-black text-red-700">{urgentCount}</div>
            </div>
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Department</span>
              <div className="text-lg font-black text-slate-900">General Medicine</div>
            </div>
            <Stethoscope className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 px-3 py-2 border border-slate-300 rounded-xl">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, token or complaint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs w-full outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-slate-400">Priority:</span>
            {['ALL', 'URGENT', 'NORMAL'].map(p => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filterPriority === p 
                    ? (p === 'URGENT' ? 'bg-red-700 text-white' : 'bg-[#1e40af] text-white')
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Patients Queue Table */}
        <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-xl font-black text-slate-900">Outpatient Intake Stream</h3>
            <p className="text-xs text-slate-500 font-semibold">Patients submitted from touchscreen kiosks &amp; OP registration desks</p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-bold">
              Loading real-time queue...
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 font-semibold">
              No patients currently waiting in this filter category.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider">
                    <th className="p-4">Token</th>
                    <th className="p-4">Patient Name</th>
                    <th className="p-4">Age / Gender</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Presenting Complaint</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredQueue.map((pt) => (
                    <tr key={pt.id || pt.patientId} className="hover:bg-slate-50/70">
                      <td className="p-4 font-mono font-black text-[#1e40af] text-sm">
                        {pt.token || 'TKN-OPD'}
                      </td>
                      <td className="p-4 font-black text-slate-900 text-sm">
                        {pt.patientName}
                      </td>
                      <td className="p-4 text-slate-600">
                        {pt.age ? `${pt.age} yrs` : '52 yrs'} • {pt.gender || 'Male'}
                      </td>
                      <td className="p-4 text-slate-800 font-semibold">
                        {pt.department || 'General Medicine'}
                      </td>
                      <td className="p-4 max-w-xs truncate text-slate-700">
                        {pt.complaint}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          pt.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {pt.priority}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">
                          {pt.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/doctor?patientId=${pt.patientId}`}
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs transition inline-flex items-center gap-1"
                        >
                          <span>Examine</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
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
