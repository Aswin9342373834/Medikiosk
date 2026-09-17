'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '../../../components/Navbar';
import api from '../../../lib/api';
import { 
  ShieldCheck, ShieldAlert, ArrowRight, RefreshCw, 
  Search, Lock, CheckCircle2, AlertTriangle, Clock
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminLogs();
      if (res.success && Array.isArray(res.data)) {
        setLogs(res.data);
      }
    } catch (e) {
      console.warn('Audit logs fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(l => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (l.action && l.action.toLowerCase().includes(q)) ||
      (l.role && l.role.toLowerCase().includes(q)) ||
      (l.resource && l.resource.toLowerCase().includes(q)) ||
      (l.result && l.result.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar />

      <header className="bg-white border-b-2 border-slate-300 py-6 px-4 sm:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center font-bold">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">ABDM Security &amp; Clinical Audit Logs</h1>
              <p className="text-xs text-slate-500 font-semibold">
                Tamper-evident logs tracking all document visibility decisions, authentication, and clinical data access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Logs</span>
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
        
        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs by action, role, resource, or result..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm font-medium outline-none"
          />
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-slate-900">Cryptographic Security Events</h3>
              <p className="text-xs text-slate-500">Total Log Entries: {logs.length}</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
              ABDM Compliant
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-bold">
              Loading security audit stream...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 font-semibold">
              No matching audit logs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Resource Target</th>
                    <th className="p-4">Result</th>
                    <th className="p-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium font-mono">
                  {filtered.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/70">
                      <td className="p-4 text-slate-500 text-[11px]">
                        {new Date(log.createdAt || log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {log.role}
                      </td>
                      <td className="p-4 font-black text-[#1e40af]">
                        {log.action}
                      </td>
                      <td className="p-4 text-slate-700">
                        {log.resource}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          log.result === 'Success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.result}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate text-slate-500 font-sans text-xs">
                        {log.details || '—'}
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
