'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { useTranslation } from '../../../contexts/LanguageContext';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { 
  Building2, ClipboardList, PlusCircle, ArrowRight, ArrowLeft, 
  Stethoscope, HeartPulse, Clock, Calendar, CheckCircle2, ShieldCheck,
  RefreshCw, FileText
} from 'lucide-react';

export default function PatientOpVisitsPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await api.getOpdVisits();
      if (res.success && Array.isArray(res.data)) {
        setVisits(res.data);
      } else {
        setVisits([]);
      }
    } catch (err: any) {
      console.warn('Failed to load visits:', err.message);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Top Government Header */}
      <header className="bg-[#0b1b3d] text-white py-3 px-4 sm:px-8 border-b border-blue-900 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center text-xs gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span className="font-bold tracking-wide">AIIMS Outpatient Medical Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="select" className="bg-[#152a57] border-blue-800 text-white" />
            <Link href="/patient" className="text-blue-300 hover:text-white font-bold transition flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              <span>{t('navigation.dashboard')}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner with Primary Action */}
        <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-sm flex flex-wrap justify-between items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-[#1e40af] text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {t('navigation.opVisits')}
              </span>
              <span className="text-xs text-slate-500 font-semibold">Encounter History</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {language === 'ta' ? 'வெளிநோயாளர் வருகை வரலாறு' : language === 'hi' ? 'ओपीडी विज़िट इतिहास' : 'Outpatient (OPD) Visits History'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Official outpatient encounter logs, department clinical modes, and physician queue tokens.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={fetchVisits} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link href="/patient/op-registration" className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl transition flex items-center gap-2 shadow-md hover:shadow-lg">
              <PlusCircle className="w-5 h-5" />
              <span>{t('patient.startNewOpdVisit')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Visits Content */}
        {loading ? (
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-12 text-center text-slate-400 text-sm">
            Loading your outpatient visits...
          </div>
        ) : visits.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">No OPD Visits on Record</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You do not have any registered outpatient visits yet. Start a new consultation to obtain an OP token and select your department.
            </p>
            <Link href="/patient/op-registration" className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl shadow-md transition">
              <PlusCircle className="w-5 h-5" />
              <span>{t('patient.startNewOpdVisit')}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => {
              const isAyush = visit.clinicalMode === 'AYUSH';
              const visitDate = visit.createdAt ? new Date(visit.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Today';
              return (
                <div key={visit._id} className="bg-white rounded-2xl border-2 border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition space-y-4">
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${isAyush ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-[#1e40af]"}`}>
                        {isAyush ? <HeartPulse className="w-6 h-6" /> : <Stethoscope className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-lg text-slate-900">{visit.departmentName || visit.departmentId?.name || "Department OPD"}</h4>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${isAyush ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-blue-50 text-blue-900 border-blue-300"}`}>
                            Clinical Mode: {visit.clinicalMode || "MEDICAL"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mt-0.5">
                          <span>Date: {visitDate}</span>
                          <span>•</span>
                          <span>{visit.opdType || (isAyush ? "AYUSH OPD" : "General OPD")}</span>
                        </div>
                      </div>
                    </div>
                    <span className="bg-slate-100 text-slate-800 text-xs font-black px-3 py-1 rounded-full uppercase">{visit.status || "REGISTERED"}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{t("patient.opNumber")}</span>
                      <strong className="font-mono text-slate-900 text-sm">{visit.opNumber || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{t("patient.tokenNumber")}</span>
                      <strong className="font-mono text-[#1e40af] text-sm">{visit.tokenNumber || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{t("patient.department")}</span>
                      <strong className="text-slate-900">{visit.departmentName || visit.departmentId?.name || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{t("common.clinicalMode")}</span>
                      <strong className={`font-black uppercase ${isAyush ? "text-emerald-700" : "text-[#1e40af]"}`}>{visit.clinicalMode || "MEDICAL"}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-3 pt-1 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>ABDM Protected Patient Record</span>
                    </div>
                    <Link href="/patient/clinical-history" className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#1e40af] font-black rounded-lg transition">
                      Clinical History &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}