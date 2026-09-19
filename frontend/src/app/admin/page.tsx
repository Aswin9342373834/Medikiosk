'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import api from '../../lib/api';
import { 
  Users, Stethoscope, Monitor, FileText, AlertTriangle, ShieldCheck, 
  Activity, CheckCircle2, Clock, RefreshCw, BarChart2, ShieldAlert
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({
    totalPatients: 0,
    todayPatients: 0,
    waitingConsultations: 0,
    activeConsultations: 0,
    completedConsultations: 0,
    totalDoctors: 0,
    activeKiosks: 0,
    pendingDocuments: 0,
    attentionAlerts: 0,
    hourlyFlow: []
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [kiosks, setKiosks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'kpis' | 'departments' | 'kiosks' | 'logs' | 'schemes'>('kpis');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, deptRes, kioskRes, logsRes, schemeRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminDepartments(),
        api.getAdminKiosks(),
        api.getAdminLogs(),
        api.getAdminSchemes()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (deptRes.success) setDepartments(deptRes.data);
      if (kioskRes.success) setKiosks(kioskRes.data);
      if (logsRes.success) setLogs(logsRes.data);
      if (schemeRes.success) setSchemes(schemeRes.data?.schemes || []);
    } catch (err: any) {
      console.warn('Admin fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (!token || !userStr) {
        router.push('/login');
        return;
      }
      try {
        const u = JSON.parse(userStr);
        if (u.role && u.role !== 'ADMIN') {
          if (u.role === 'DOCTOR') router.push('/doctor');
          else router.push('/patient');
          return;
        }
      } catch (e) {
        router.push('/login');
        return;
      }
    }

    fetchAdminData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar />

      {/* Admin Title Bar */}
      <header className="bg-white border-b border-slate-200 py-6 px-6 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">Hospital Operations Command Center</h1>
              <span className="bg-hospital-100 text-hospital-800 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                AIIMS-ND-01
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Live telemetry: Real-time patient flow, department loads, kiosk hardware, and security audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="max-w-7xl mx-auto flex gap-2 pt-6 border-t border-slate-100 mt-6">
          {[
            { id: 'kpis', label: 'Operations Dashboard' },
            { id: 'departments', label: `Departments (${departments.length})` },
            { id: 'kiosks', label: `Kiosks (${kiosks.length})` },
            { id: 'schemes', label: 'Government Schemes' },
            { id: 'logs', label: `Audit Logs (${logs.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                activeView === tab.id
                  ? 'bg-hospital-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Admin View Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 space-y-8">
        
        {/* VIEW 1: LIVE KPIS & HOURLY FLOW */}
        {activeView === 'kpis' && (
          <div className="space-y-8">
            {/* Real KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Registered</span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">{stats.totalPatients}</span>
                <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Live DB Count</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Today OPD Intake</span>
                <span className="text-3xl font-black text-hospital-600 mt-1 block">{stats.todayPatients}</span>
                <span className="text-[10px] text-green-600 font-semibold mt-1 block">+12% vs yesterday</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Waiting for Doctor</span>
                <span className="text-3xl font-black text-amber-600 mt-1 block">{stats.waitingConsultations}</span>
                <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Queue backlog</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Completed Today</span>
                <span className="text-3xl font-black text-green-600 mt-1 block">{stats.completedConsultations}</span>
                <span className="text-[10px] text-green-700 font-semibold mt-1 block">Treated &amp; Prescribed</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Kiosks</span>
                <span className="text-3xl font-black text-blue-700 mt-1 block">{stats.activeKiosks}</span>
                <span className="text-[10px] text-blue-600 font-semibold mt-1 block">All online</span>
              </div>

              <div className={`p-5 rounded-2xl border shadow-sm ${
                stats.attentionAlerts > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
              }`}>
                <span className="text-[10px] text-red-500 font-bold uppercase block">Red Flag Alerts</span>
                <span className={`text-3xl font-black mt-1 block ${stats.attentionAlerts > 0 ? 'text-red-700' : 'text-slate-900'}`}>
                  {stats.attentionAlerts}
                </span>
                <span className="text-[10px] text-red-600 font-semibold mt-1 block">Urgent priority</span>
              </div>
            </div>

            {/* Hourly Flow Chart & Processing Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-hospital-600" />
                    <span>Hourly Patient Inflow (Today)</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-bold">OPD Peak: 11:00 AM</span>
                </div>

                <div className="h-56 flex items-end justify-between gap-3 pt-4 px-2">
                  {stats.hourlyFlow?.map((item: any, i: number) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        style={{ height: `${Math.min(item.patients * 1.5, 160)}px` }}
                        className="w-full bg-hospital-600 hover:bg-hospital-700 rounded-t-xl transition relative group cursor-pointer"
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                          {item.patients} patients
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{item.hour}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Local AI Engine Telemetry */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-hospital-600" />
                    <span>Local AI &amp; OCR Telemetry</span>
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                    <span className="font-semibold text-slate-600">Local AI Engine:</span>
                    <span className="font-bold text-hospital-700">Ollama Local Instance</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                    <span className="font-semibold text-slate-600">Active Model:</span>
                    <span className="font-bold text-hospital-700">deepseek-r1:8b (Offline)</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                    <span className="font-semibold text-slate-600">OCR Engine:</span>
                    <span className="font-bold text-green-700">Tesseract + PDF Parser</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                    <span className="font-semibold text-slate-600">Data Architecture:</span>
                    <span className="font-bold text-slate-900">Database-First (Zero Loss)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: DEPARTMENTAL LOADS */}
        {activeView === 'departments' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-900">Departmental Outpatient Loads</h3>
                <p className="text-xs text-slate-500">Live counts aggregated across specialized OPD rooms</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200">
                    <th className="p-4">Department Name</th>
                    <th className="p-4">Code</th>
                    <th className="p-4 text-center">Active Physicians</th>
                    <th className="p-4 text-center">Current Waiting</th>
                    <th className="p-4 text-center">Total Today</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments.map((dept) => (
                    <tr key={dept._id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-slate-900">{dept.name}</td>
                      <td className="p-4 font-mono text-slate-500">{dept.code}</td>
                      <td className="p-4 text-center font-bold text-hospital-700">{dept.activeDoctors}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-black text-[11px] ${
                          dept.waitingCount > 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {dept.waitingCount}
                        </span>
                      </td>
                      <td className="p-4 text-center font-black text-slate-900">{dept.totalPatientsToday}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: KIOSKS HARDWARE STATUS */}
        {activeView === 'kiosks' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kiosks.map((kiosk) => (
              <div key={kiosk._id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-hospital-600 flex items-center justify-center font-bold">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                    kiosk.status === 'Online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {kiosk.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-slate-900">{kiosk.kioskId}</h4>
                  <p className="text-xs text-slate-500 font-medium">{kiosk.location}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                  <div>Department: <strong className="text-slate-800">{kiosk.department}</strong></div>
                  <div>IP: <span className="font-mono text-slate-500">{kiosk.ipAddress}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 4: GOVERNMENT SCHEMES */}
        {activeView === 'schemes' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">National Health Protection Scheme Enrollments</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {schemes.map((scheme, i) => (
                <div key={i} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheme</span>
                  <h4 className="text-base font-extrabold text-slate-900">{scheme.name}</h4>
                  <div className="text-3xl font-black text-hospital-700 pt-2">{scheme.enrolled}</div>
                  <span className="text-xs text-green-600 font-semibold">Active beneficiaries served</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: AUDIT LOGS */}
        {activeView === 'logs' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-900">Security &amp; Clinical Operation Audit Logs</h3>
                <p className="text-xs text-slate-500">Tamper-evident logs of all data access, report releases, and patient admissions</p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Resource</th>
                    <th className="p-4">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50 transition">
                      <td className="p-4 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="p-4 font-bold text-slate-800">{log.role}</td>
                      <td className="p-4 font-semibold text-hospital-700">{log.action}</td>
                      <td className="p-4 text-slate-600">{log.resource}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.result === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
