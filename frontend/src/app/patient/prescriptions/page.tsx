'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import { useTranslation } from '../../../contexts/LanguageContext';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { 
  Building2, Pill, Clock, Calendar, CheckCircle2, AlertCircle, 
  RefreshCw, User, Stethoscope, Printer, FileText
} from 'lucide-react';

export default function PatientPrescriptionsPage() {
  const { t, language } = useTranslation();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [patient, setPatient] = useState<any>(null);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      let prof = null;
      try {
        const profRes = await api.getPatientProfile();
        if (profRes.success) {
          prof = profRes.data;
          setPatient(prof);
        }
      } catch (e) {
        prof = {
          name: 'Ramesh Kumar',
          abhaId: 'ABHA-9928-1102',
          gender: 'Male',
          age: 52
        };
        setPatient(prof);
      }

      if (prof?._id) {
        const res = await api.getPatientPrescriptions(prof._id);
        if (res.success && Array.isArray(res.data)) {
          setPrescriptions(res.data);
        }
      }
    } catch (err: any) {
      console.warn('Prescriptions fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      
      {/* Top Header */}
      <div className="bg-[#0b1b3d] text-white py-2.5 px-3 sm:px-8 border-b border-blue-900">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center text-xs gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span className="font-bold">{t('prescriptions.title')}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="select" className="bg-[#152a57] border-blue-800 text-white" />
            <Link href="/patient" className="text-blue-300 hover:text-white font-bold transition">
              &larr; {t('navigation.dashboard')}
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        <div className="flex flex-wrap justify-between items-center bg-white p-6 rounded-3xl border-2 border-slate-300 shadow-sm gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{t('prescriptions.title')}</h2>
            <p className="text-xs text-slate-500 font-semibold">
              {t('prescriptions.subtitle')}
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>{t('prescriptions.printSlip')}</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-bold">
            {t('common.loading')}
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-12 text-center space-y-3">
            <Pill className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-lg font-black text-slate-800">{t('prescriptions.noPrescriptions')}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {language === 'ta'
                ? 'மருத்துவர் பரிசோதனை முடித்தவுடன் உங்கள் மருந்துச் சீட்டு இங்கே காண்பிக்கப்படும்.'
                : language === 'hi'
                ? 'डॉक्टर द्वारा नैदानिक जांच पूरी करने के बाद आपका डिजिटल प्रिस्क्रिप्शन यहाँ दिखाई देगा।'
                : 'Once your physician finishes examination, your digital prescription will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {prescriptions.map((rx) => (
              <div key={rx._id} className="bg-white rounded-3xl border-2 border-slate-300 shadow-md p-6 sm:p-8 space-y-4">
                <div className="flex flex-wrap justify-between items-start border-b border-slate-200 pb-3 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('ai.chiefComplaint')}</span>
                    <h3 className="text-lg font-black text-slate-900">{rx.diagnosis || 'General OPD Consultation'}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('prescriptions.date')}</span>
                    <span className="text-xs font-bold text-slate-700">{new Date(rx.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t('prescriptions.activeMeds')}
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {rx.medications?.map((m: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-2">
                        <div>
                          <strong className="text-sm font-bold text-slate-900">{m.name}</strong>
                          <span className="text-xs text-slate-500 ml-2">({m.dosage})</span>
                          {m.instructions && (
                            <p className="text-xs text-slate-600 mt-0.5 font-medium">{m.instructions}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 bg-blue-100 text-[#1e40af] text-xs font-bold rounded-lg">
                            {m.frequency} • {m.duration}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {rx.notes && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <strong>{t('prescriptions.instructions')}:</strong> {rx.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
