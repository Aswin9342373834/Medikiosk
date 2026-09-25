'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import api from '../../../lib/api';
import { useTranslation } from '../../../contexts/LanguageContext';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import {
  Building2, Pill, Clock, Calendar, CheckCircle2, AlertCircle,
  RefreshCw, User, Stethoscope, Printer, FileText, MapPin,
  Navigation, ExternalLink, Phone, ShieldCheck, Search,
  SlidersHorizontal, X, Info, Check, AlertTriangle, Layers
} from 'lucide-react';

// Dynamic import for Leaflet map to ensure 100% SSR compatibility in Next.js
const PharmacyMap = dynamic(
  () => import('./components/PharmacyMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-300">
        Loading interactive map...
      </div>
    )
  }
);

export default function PatientPrescriptionsPage() {
  const { t, language } = useTranslation();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [patient, setPatient] = useState<any>(null);

  // Pharmacy Locator State
  const [locatorOpen, setLocatorOpen] = useState<boolean>(false);
  const [activeRx, setActiveRx] = useState<any | null>(null);
  const [activeSingleMed, setActiveSingleMed] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'granted' | 'denied' | 'demo'>('idle');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [pharmacyResults, setPharmacyResults] = useState<any | null>(null);
  const [pharmacyLoading, setPharmacyLoading] = useState<boolean>(false);
  const [pharmacyError, setPharmacyError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'map'>('list');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      let prof = null;
      try {
        const profRes = await api.getPatientProfile();
        if (profRes.success && profRes.data) {
          prof = profRes.data;
          setPatient(prof);
        } else {
          setPatient(null);
        }
      } catch (e) {
        setPatient(null);
      }

      if (prof?._id) {
        const res = await api.getPatientPrescriptions(prof._id);
        if (res.success && Array.isArray(res.data)) {
          setPrescriptions(res.data);
        } else {
          setPrescriptions([]);
        }
      } else {
        setPrescriptions([]);
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

  // Normalize medicine items across different prescription formats (items vs medications)
  const getPrescriptionItems = (rx: any) => {
    const rawItems = rx.items || rx.medications || [];
    return rawItems.map((item: any) => ({
      name: item.medicine || item.name || item.medicineName || 'Medicine',
      dosage: item.dosage || item.strength || 'Not specified',
      form: item.dosageForm || item.form || 'Tablet',
      frequency: item.frequency || 'Not specified',
      duration: item.duration || 'Not specified',
      route: item.route || 'Oral',
      instructions: item.instructions || 'After food'
    }));
  };

  // Perform Pharmacy Search via Backend API
  const executePharmacySearch = async (
    loc = userLocation,
    rad = radiusKm,
    rx = activeRx,
    singleMed = activeSingleMed
  ) => {
    if (!loc) return;
    setPharmacyLoading(true);
    setPharmacyError(null);
    try {
      const params: any = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        radius: rad
      };

      if (singleMed) {
        params.medicine = singleMed;
      } else if (rx?._id) {
        params.prescriptionId = rx._id;
      }

      const res = await api.getNearbyPharmacies(params);
      if (res.success) {
        setPharmacyResults(res);
      } else {
        setPharmacyError(res.message || 'Failed to search nearby pharmacies.');
      }
    } catch (err: any) {
      setPharmacyError(err.message || 'Unable to connect to pharmacy search service.');
    } finally {
      setPharmacyLoading(false);
    }
  };

  // Trigger Device Location (Explicit user request only)
  const requestDeviceLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setPharmacyError('Geolocation is not supported by your browser. Please use demo location.');
      return;
    }

    setLocationStatus('detecting');
    setPharmacyError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        };
        setUserLocation(loc);
        setLocationStatus('granted');
        executePharmacySearch(loc, radiusKm, activeRx, activeSingleMed);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocationStatus('denied');
        setPharmacyError('Location access was denied or timed out. You can use the demo location to test availability.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Trigger Demo Location (AIIMS Ansari Nagar Coordinates)
  const setDemoLocation = () => {
    const demoLoc = { latitude: 28.5672, longitude: 77.2100 };
    setUserLocation(demoLoc);
    setLocationStatus('demo');
    setPharmacyError(null);
    executePharmacySearch(demoLoc, radiusKm, activeRx, activeSingleMed);
  };

  // Open Locator Modal for Entire Prescription
  const handleFindAllNearby = (rx: any) => {
    setActiveRx(rx);
    setActiveSingleMed(null);
    setLocatorOpen(true);
    if (userLocation) {
      executePharmacySearch(userLocation, radiusKm, rx, null);
    }
  };

  // Open Locator Modal for a Single Medicine
  const handleFindSingleMedicine = (rx: any, medicineName: string) => {
    setActiveRx(rx);
    setActiveSingleMed(medicineName);
    setLocatorOpen(true);
    if (userLocation) {
      executePharmacySearch(userLocation, radiusKm, rx, medicineName);
    }
  };

  // Change Radius and Re-query
  const handleRadiusChange = (newRadius: number) => {
    setRadiusKm(newRadius);
    if (userLocation) {
      executePharmacySearch(userLocation, newRadius, activeRx, activeSingleMed);
    }
  };

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

        {/* Page Banner */}
        <div className="flex flex-wrap justify-between items-center bg-white p-6 rounded-3xl border-2 border-slate-300 shadow-sm gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{t('prescriptions.title')}</h2>
            <p className="text-xs text-slate-500 font-semibold">
              {t('prescriptions.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPrescriptions()}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              title="Refresh Prescriptions"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>{t('prescriptions.printSlip')}</span>
            </button>
          </div>
        </div>

        {/* Prescriptions List */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-bold flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span>{t('common.loading')}</span>
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
            {prescriptions.map((rx) => {
              const items = getPrescriptionItems(rx);
              const docName = rx.doctorId?.name ||
                (rx.doctorId?.firstName ? `Dr. ${rx.doctorId.firstName} ${rx.doctorId.lastName || ''}` : 'Hospital Attending Physician');

              return (
                <div key={rx._id} className="bg-white rounded-3xl border-2 border-slate-300 shadow-md p-6 sm:p-8 space-y-5">

                  {/* Card Header */}
                  <div className="flex flex-wrap justify-between items-start border-b border-slate-200 pb-4 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {rx.status || 'Active Prescription'}
                        </span>
                        {rx.digitalSignature?.documentHash && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Digitally Issued (SHA-256: {rx.digitalSignature.documentHash.slice(0, 10)}...)</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mt-1">
                        {rx.diagnosis || 'Clinical OPD Prescription'}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-700" />
                        <span>{docName}</span>
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('prescriptions.date')}</span>
                        <span className="text-xs font-bold text-slate-700">
                          {new Date(rx.date || rx.createdAt).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Primary "Find All Medicines Nearby" Button */}
                      <button
                        onClick={() => handleFindAllNearby(rx)}
                        className="px-3.5 py-2 bg-[#1e40af] hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm"
                      >
                        <MapPin className="w-4 h-4 text-amber-300" />
                        <span>{t('prescriptions.findAllNearby') || 'Find All Medicines Nearby'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Prescribed Medications Table / Cards */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-blue-600" />
                        <span>{t('prescriptions.activeMeds')} ({items.length})</span>
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {items.map((m: any, idx: number) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap justify-between items-center gap-3 hover:border-blue-300 transition">
                          <div className="space-y-1 max-w-lg">
                            <div className="flex items-center gap-2">
                              <strong className="text-sm font-black text-slate-900">{m.name}</strong>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                                {m.dosage}
                              </span>
                              <span className="text-[11px] font-medium text-slate-500">
                                ({m.form})
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                              <span><strong>Route:</strong> {m.route}</span>
                              <span><strong>Frequency:</strong> {m.frequency}</span>
                              <span><strong>Duration:</strong> {m.duration}</span>
                            </div>
                            {m.instructions && (
                              <p className="text-xs text-slate-500 italic">
                                <strong>Instructions:</strong> {m.instructions}
                              </p>
                            )}
                          </div>

                          {/* Medicine-level availability trigger */}
                          <div>
                            <button
                              onClick={() => handleFindSingleMedicine(rx, m.name)}
                              className="px-3 py-1.5 bg-white hover:bg-blue-50 text-[#1e40af] border border-blue-300 hover:border-blue-500 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span>{t('prescriptions.findNearby') || 'Check Availability'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Follow-up & Advice */}
                  {(rx.followUp || rx.generalAdvice) && (
                    <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
                      {rx.followUp && (
                        <div>
                          <strong>Follow-up:</strong> {rx.followUp}
                        </div>
                      )}
                      {rx.generalAdvice && (
                        <div>
                          <strong>Clinical Advice:</strong> {rx.generalAdvice}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* NEARBY PHARMACY LOCATOR MODAL / DRAWER */}
      {/* ========================================================================= */}
      {locatorOpen && activeRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-slate-300 overflow-hidden my-auto">

            {/* Modal Header */}
            <div className="bg-[#0b1b3d] text-white p-4 sm:p-5 flex justify-between items-center border-b border-blue-900">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-900/60 text-amber-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black leading-tight">
                    {activeSingleMed
                      ? `Availability for ${activeSingleMed}`
                      : 'Prescription Pharmacy Locator'}
                  </h3>
                  <p className="text-[11px] text-blue-200 font-medium">
                    {activeRx.diagnosis || 'Prescribed Medications'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setLocatorOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">

              {/* Demo Transparency Notice (Phase 6 Requirement) */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-950 font-medium">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">
                    {t('prescriptions.demoAvailability') || 'Demo Pharmacy Availability — simulated inventory'}
                  </strong>
                  <span>
                    Pharmacy inventory is simulated for this clinical demonstration. Distance is calculated from your location using the Haversine formula.
                  </span>
                </div>
              </div>

              {/* Geolocation Control & Radius Selector */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      {t('prescriptions.currentLocation') || 'Current Location'}:
                    </span>
                    {userLocation ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>{locationStatus === 'demo' ? 'AIIMS Campus Vicinity (Demo)' : 'Device Location Active'}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500 italic">
                        Not determined yet
                      </span>
                    )}
                  </div>

                  {/* Radius Selector (1, 3, 5, 10 km) */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500 font-bold">{t('prescriptions.searchRadius') || 'Radius'}:</span>
                    {[1, 3, 5, 10].map((rad) => (
                      <button
                        key={rad}
                        onClick={() => handleRadiusChange(rad)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                          radiusKm === rad
                            ? 'bg-[#1e40af] text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {rad} km
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200">
                  <button
                    onClick={requestDeviceLocation}
                    disabled={locationStatus === 'detecting'}
                    className="px-3.5 py-2 bg-[#1e40af] hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>
                      {locationStatus === 'detecting'
                        ? 'Locating Device...'
                        : (t('prescriptions.allowLocation') || 'Use My Device Location')}
                    </span>
                  </button>

                  <button
                    onClick={setDemoLocation}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>{t('prescriptions.useDemoLocation') || 'Use Demo Location (AIIMS Vicinity)'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  Privacy assurance: Your coordinates are used only ephemerally for this distance query and are never saved to the database.
                </p>
              </div>

              {/* Error Banner */}
              {pharmacyError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-700 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{pharmacyError}</span>
                </div>
              )}

              {/* Loading State */}
              {pharmacyLoading && (
                <div className="p-8 text-center text-xs font-bold text-slate-500 flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span>Searching nearby pharmacies and verifying stock...</span>
                </div>
              )}

              {/* Search Results Display */}
              {!pharmacyLoading && pharmacyResults && (
                <div className="space-y-4">

                  {/* Summary Breakdown for Prescription Search */}
                  {pharmacyResults.searchMode === 'PRESCRIPTION' && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <h4 className="text-xs font-black uppercase text-slate-700">
                          {t('prescriptions.summaryTitle') || 'Prescription Availability Summary'}
                        </h4>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900">
                          {pharmacyResults.availablePrescribed} of {pharmacyResults.totalPrescribed} {t('prescriptions.stockSummary') || 'medicines in stock nearby'}
                        </span>
                      </div>

                      {/* Medicine Availability Chips */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(pharmacyResults.medicinesSummary || []).map((m: any, idx: number) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border text-xs flex justify-between items-center ${
                              m.availableNearby
                                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                                : 'bg-red-50/70 border-red-200 text-red-950'
                            }`}
                          >
                            <div>
                              <strong className="font-bold">{m.medicine}</strong>
                              <span className="text-[11px] text-slate-500 ml-1.5">({m.dosage})</span>
                            </div>
                            <span className="text-[11px] font-bold flex items-center gap-1">
                              {m.availableNearby ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{m.availablePharmacyCount} nearby</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                                  <span>Out of stock</span>
                                </>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View Toggles (List View vs Map View) */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-bold text-slate-700">
                      {pharmacyResults.results?.length || 0} Pharmacies Found ({radiusKm} km radius)
                    </span>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setActiveView('list')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                          activeView === 'list'
                            ? 'bg-white text-blue-800 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {t('prescriptions.viewList') || 'List View'}
                      </button>
                      <button
                        onClick={() => setActiveView('map')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                          activeView === 'map'
                            ? 'bg-white text-blue-800 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {t('prescriptions.viewMap') || 'Map View'}
                      </button>
                    </div>
                  </div>

                  {/* Zero Results State */}
                  {pharmacyResults.results?.length === 0 && (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                      <h4 className="text-sm font-black text-slate-800">
                        {t('prescriptions.noPharmaciesFound') || 'No pharmacies found in this radius.'}
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Try expanding your search radius to 5 km or 10 km above to locate matching inventories.
                      </p>
                    </div>
                  )}

                  {/* MAP VIEW */}
                  {activeView === 'map' && userLocation && pharmacyResults.results?.length > 0 && (
                    <PharmacyMap
                      userLocation={userLocation}
                      pharmacies={pharmacyResults.results}
                      radiusKm={radiusKm}
                      selectedPharmacyId={selectedPharmacyId}
                      onSelectPharmacy={(p) => setSelectedPharmacyId(p.pharmacyId)}
                    />
                  )}

                  {/* LIST VIEW */}
                  {activeView === 'list' && pharmacyResults.results?.length > 0 && (
                    <div className="space-y-3">
                      {pharmacyResults.results.map((pharm: any) => {
                        const isAllAvailable = pharm.allAvailable;

                        return (
                          <div
                            key={pharm.pharmacyId}
                            className={`p-4 rounded-2xl border-2 transition space-y-3 ${
                              isAllAvailable
                                ? 'bg-emerald-50/20 border-emerald-300'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {/* Pharmacy Card Header */}
                            <div className="flex flex-wrap justify-between items-start gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-black text-slate-900">{pharm.name}</h4>
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                    {pharm.distanceKm} km away
                                  </span>
                                  {isAllAvailable && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>All Medicines In Stock</span>
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 font-medium">{pharm.address}</p>
                                {pharm.operatingHours && (
                                  <p className="text-[11px] text-slate-500">Hours: {pharm.operatingHours}</p>
                                )}
                              </div>

                              {/* Action Buttons: Call & Get Directions */}
                              <div className="flex items-center gap-2">
                                {pharm.phone && (
                                  <a
                                    href={`tel:${pharm.phone}`}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                                  >
                                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                                    <span>{t('prescriptions.callPharmacy') || 'Call'}</span>
                                  </a>
                                )}
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${pharm.coordinates.latitude},${pharm.coordinates.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-[#1e40af] hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
                                >
                                  <Navigation className="w-3.5 h-3.5" />
                                  <span>{t('prescriptions.getDirections') || 'Get Directions'}</span>
                                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                                </a>
                              </div>
                            </div>

                            {/* Prescribed Items Availability Checklist */}
                            {pharm.availableMedicines && (
                              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                                  Medicine Stock at this Branch:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {pharm.availableMedicines.map((am: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100/70 text-emerald-900 border border-emerald-200 flex items-center gap-1"
                                    >
                                      <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                                      <span>{am.medicine} ({am.dosage})</span>
                                    </span>
                                  ))}

                                  {pharm.unavailableMedicines?.map((um: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-800 border border-red-200 flex items-center gap-1 opacity-80"
                                    >
                                      <X className="w-3.5 h-3.5 text-red-500 font-bold" />
                                      <span>{um.medicine} ({um.dosage}) - Not Available</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Single Medicine Inventory Result */}
                            {pharm.inventoryItem && (
                              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span className="font-bold text-slate-800">
                                  {pharm.inventoryItem.medicineName} ({pharm.inventoryItem.strength}) — In Stock ({pharm.inventoryItem.dosageForm})
                                </span>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}

              {/* Initial Instructions if No Location Selected Yet */}
              {!userLocation && !pharmacyLoading && (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-2">
                  <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-black text-slate-800">
                    Location Required to Find Nearby Pharmacies
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click <strong>&quot;Use My Device Location&quot;</strong> to find pharmacies closest to your current coordinates, or select <strong>&quot;Use Demo Location&quot;</strong> to test with AIIMS vicinity.
                  </p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setLocatorOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
