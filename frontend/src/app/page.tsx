'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../contexts/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { 
  User, Stethoscope, Shield, HelpCircle, 
  ArrowRight, Building2, PhoneCall, X, Monitor
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [showHelp, setShowHelp] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 select-none">
      
      {/* 1. National Official Header / MoHFW Ribbon */}
      <div className="bg-[#0b1b3d] text-white border-b border-blue-900 py-2 px-3 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center text-xs gap-3 font-semibold">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[11px] tracking-wider uppercase">
              GOVT OF INDIA
            </span>
            <span className="text-slate-200 hidden sm:inline">
              Ministry of Health &amp; Family Welfare • National Health Authority (ABDM)
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-1.5 text-blue-200">
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('navigation.helpline')}</span>
            </div>

            {/* Language & Help Quick Actions */}
            <div className="flex items-center gap-2">
              <LanguageSwitcher variant="select" className="bg-[#152a57] border-blue-800 text-white" />

              <button
                type="button"
                onClick={() => setShowHelp(true)}
                className="flex items-center gap-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-lg text-xs transition"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'உதவி' : language === 'hi' ? 'सहायता' : 'Help'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Official Hospital Facility Header */}
      <header className="bg-white border-b-2 border-hospital-600 shadow-sm py-5 sm:py-6 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#1e40af] text-white rounded-xl flex items-center justify-center font-black shadow-md border-2 border-blue-700 flex-shrink-0">
              <Building2 className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-4xl font-black text-[#0f172a] tracking-tight">
                  MediKiosk
                </h1>
                <span className="bg-[#1e40af] text-white text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  GOVT OPD
                </span>
              </div>
              <p className="text-sm sm:text-lg font-extrabold text-[#1e40af] mt-0.5">
                {language === 'ta'
                  ? 'அரசு மருத்துவமனை டிஜிட்டல் வெளிநோயாளர் பதிவு தளம்'
                  : language === 'hi'
                  ? 'सरकारी अस्पताल डिजिटल नैदानिक इनटेक प्लेटफॉर्म'
                  : 'Government Hospital Digital Clinical Intake Platform'}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-semibold">
                Centralized Health Information Exchange • Ayushman Bharat Digital Mission (ABDM)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <div>
              <span className="font-extrabold text-slate-900 block">{t('navigation.portalActive')}</span>
              <span className="text-slate-600">Hours: 08:00 AM — 02:00 PM</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Simple Role Selection Gateway */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center space-y-6 sm:space-y-8">
        
        <div className="text-center space-y-2">
          <span className="text-xs font-black tracking-wider uppercase text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
            {language === 'ta' ? 'அங்கீகரிக்கப்பட்ட சுகாதார அணுகல்' : language === 'hi' ? 'अधिकृत स्वास्थ्य सेवा पहुँच' : 'Authorized Healthcare Access'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('authentication.selectRole')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto">
            {language === 'ta'
              ? 'வெளிநோயாளர் சேவைகள், மருத்துவக் கட்டுப்பாடு அல்லது நிர்வாகப் பணிகளை அணுக உங்கள் பங்கைத் தேர்ந்தெடுக்கவும்.'
              : language === 'hi'
              ? 'ओपीडी सेवाओं, नैदानिक कॉकपिट या प्रशासनिक कार्यों तक पहुँचने के लिए अपनी भूमिका चुनें।'
              : 'Select your role to access outpatient services, clinical cockpit, or administrative operations.'}
          </p>
        </div>

        {/* 3 Large Role Cards: [ PATIENT ] [ DOCTOR ] [ ADMIN ] */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* PORTAL 1: PATIENT */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 hover:border-[#1e40af] p-6 sm:p-8 shadow-md hover:shadow-xl transition flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-[#1e40af] flex items-center justify-center font-black border border-blue-200">
                <User className="w-9 h-9" />
              </div>
              <div>
                <span className="text-[11px] font-black tracking-wider uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {language === 'ta' ? 'பொது / குடிமக்கள்' : language === 'hi' ? 'नागरिक / मरीज़' : 'Public / Citizen'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {language === 'ta' ? 'நோயாளி (PATIENT)' : language === 'hi' ? 'मरीज़ (PATIENT)' : 'PATIENT'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {language === 'ta'
                  ? 'புதிய OP வருகையைத் தொடங்க, டோக்கன் நிலையை அறிய, மருத்துவ வரலாறு மற்றும் அறிக்கைகளைப் பார்க்க நோயாளி தளத்தைப் பயன்படுத்தவும்.'
                  : language === 'hi'
                  ? 'नई ओपीडी विज़िट शुरू करने, कतार टोकन देखने, चिकित्सीय इतिहास और पर्चे देखने के लिए मरीज़ पोर्टल में प्रवेश करें।'
                  : 'Access your Patient Dashboard to start a new OPD visit, view active queue tokens, review clinical history, documents, and prescriptions.'}
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <Link
                href="/login?role=patient"
                className="w-full py-3.5 bg-[#1e40af] hover:bg-blue-800 text-white font-black text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md"
              >
                <span>{language === 'ta' ? 'நோயாளி தளம் உள்நுழைக' : language === 'hi' ? 'मरीज़ पोर्टल में प्रवेश करें' : 'Enter Patient Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register?role=patient"
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <span>{language === 'ta' ? 'புதிய நோயாளி பதிவு' : language === 'hi' ? 'नया मरीज़ पंजीकरण' : 'New Patient Sign Up'}</span>
              </Link>
            </div>
          </div>

          {/* PORTAL 2: DOCTOR */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 hover:border-emerald-600 p-6 sm:p-8 shadow-md hover:shadow-xl transition flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black border border-emerald-200">
                <Stethoscope className="w-9 h-9" />
              </div>
              <div>
                <span className="text-[11px] font-black tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {language === 'ta' ? 'மருத்துவக் குழு' : language === 'hi' ? 'चिकित्सक संकाय' : 'Clinical Faculty'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {language === 'ta' ? 'மருத்துவர் (DOCTOR)' : language === 'hi' ? 'डॉक्टर (DOCTOR)' : 'DOCTOR'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {language === 'ta'
                  ? 'காத்திருக்கும் நோயாளிகளைப் பார்க்க, AI சுருக்கங்களை சரிபார்க்க, ஆவணங்களை ஆய்வு செய்து மருந்துச் சீட்டு வழங்க மருத்துவர் தளத்தைப் பயன்படுத்தவும்.'
                  : language === 'hi'
                  ? 'प्रतीक्षारत मरीज़ों की जांच, AI नैदानिक ड्राफ्ट सत्यापन, चिकित्सा दस्तावेज़ समीक्षा और ई-प्रिस्क्रिप्शन के लिए डॉक्टर कॉकपिट में प्रवेश करें।'
                  : 'Enter Doctor Cockpit to examine real-time waiting patients, verify AI clinical drafts, review OCR medical documents, and issue e-prescriptions.'}
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <Link
                href="/login?role=doctor"
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md"
              >
                <Stethoscope className="w-4 h-4" />
                <span>{language === 'ta' ? 'மருத்துவர் தளம் நுழைக' : language === 'hi' ? 'डॉक्टर कॉकपिट में प्रवेश करें' : 'Enter Doctor Cockpit'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/doctor/patients"
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <span>{language === 'ta' ? 'காத்திருப்பு வரிசை' : language === 'hi' ? 'प्रतीक्षा सूची देखें' : 'View Waiting Queue'}</span>
              </Link>
            </div>
          </div>

          {/* PORTAL 3: ADMIN */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 hover:border-amber-600 p-6 sm:p-8 shadow-md hover:shadow-xl transition flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black border border-amber-200">
                <Shield className="w-9 h-9" />
              </div>
              <div>
                <span className="text-[11px] font-black tracking-wider uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                  {language === 'ta' ? 'நிர்வாகப் பிரிவு' : language === 'hi' ? 'अस्पताल संचालन' : 'Hospital Operations'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {language === 'ta' ? 'நிர்வாகம் (ADMIN)' : language === 'hi' ? 'प्रशासन (ADMIN)' : 'ADMIN'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {language === 'ta'
                  ? 'மருத்துவமனைப் பிரிவுகள், மருத்துவர்கள் வருகை, கியோஸ்க் முனையங்கள் மற்றும் பாதுகாப்பு தணிக்கை பதிவுகளை கண்காணிக்கவும்.'
                  : language === 'hi'
                  ? 'अस्पताल प्रबंधन, विभागीय लोड, चिकित्सा कर्मचारियों की उपलब्धता और सुरक्षा ऑडिट लॉग की निगरानी करें।'
                  : 'Oversee hospital throughput, departmental loads, medical staff availability, PM-JAY statistics, and ABDM security audit logs.'}
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <Link
                href="/login?role=admin"
                className="w-full py-3.5 bg-amber-700 hover:bg-amber-800 text-white font-black text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md"
              >
                <Shield className="w-4 h-4" />
                <span>{language === 'ta' ? 'நிர்வாக செயல்பாடுகள்' : language === 'hi' ? 'प्रशासनिक संचालन' : 'Admin Operations'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/admin/audit-logs"
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <span>{language === 'ta' ? 'பாதுகாப்பு பதிவுகள்' : language === 'hi' ? 'सुरक्षा लॉग देखें' : 'View Security Logs'}</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Discrete Hospital Touchscreen Terminal Link */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-300 shadow-sm flex flex-wrap justify-between items-center text-xs gap-3">
          <div className="flex items-center gap-2 text-slate-600">
            <Monitor className="w-4 h-4 text-[#1e40af]" />
            <span>{language === 'ta' ? 'மருத்துவமனை தொடுதிரை கியோஸ்க் முனையம்:' : language === 'hi' ? 'अस्पताल टचस्क्रीन कियोस्क टर्मिनल:' : 'Dedicated Hospital Touchscreen Terminal Deployment:'}</span>
            <Link href="/kiosk" className="text-[#1e40af] font-black hover:underline">
              {language === 'ta' ? 'கியோஸ்க் தொடங்க (/kiosk)' : language === 'hi' ? 'कियोस्क शुरू करें (/kiosk)' : 'Launch Kiosk Route (/kiosk)'}
            </Link>
          </div>

          <div className="flex items-center gap-4 text-slate-500 font-semibold">
            <Link href="/login" className="hover:text-slate-900 transition">{t('authentication.login')}</Link>
            <span>•</span>
            <Link href="/register" className="hover:text-slate-900 transition">{t('authentication.register')}</Link>
          </div>
        </div>

      </main>

      {/* Official Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <p className="font-semibold">
          MediKiosk © 2026 • Government Hospital Digital Clinical Intake Platform
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          National Health Authority • Ayushman Bharat Digital Mission (ABDM) • Ministry of Health &amp; Family Welfare
        </p>
      </footer>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-hospital-600" />
                <span>{language === 'ta' ? 'உதவி மையம் & வழிகாட்டுதல்' : language === 'hi' ? 'सहायता केंद्र एवं दिशा-निर्देश' : 'Help & Clinical Assistance'}</span>
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p className="font-bold text-slate-900 text-sm">
                {language === 'ta' ? 'அடிக்கடி கேட்கப்படும் கேள்விகள்' : language === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
              </p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <p className="font-extrabold text-slate-900">
                  {language === 'ta' ? '1. நோயாளிகள் எவ்வாறு பதிவு செய்வது?' : language === 'hi' ? '1. मरीज़ कैसे पंजीकरण करें?' : '1. How do patients register?'}
                </p>
                <p className="text-slate-600">
                  {language === 'ta'
                    ? 'நோயாளி தளத்தை தேர்ந்தெடுத்து உங்கள் ஆபா (ABHA) எண் அல்லது கைபேசி எண் மூலம் பதிவு செய்யலாம்.'
                    : language === 'hi'
                    ? 'मरीज़ पोर्टल चुनें और अपनी आभा (ABHA) आईडी या मोबाइल नंबर का उपयोग करके पंजीकरण करें।'
                    : 'Click PATIENT to register using your ABHA ID or mobile number for instant outpatient OPD tokens.'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <p className="font-extrabold text-slate-900">
                  {language === 'ta' ? '2. ஆவணங்களின் ரகசியத்தன்மை எவ்வாறு பாதுகாக்கப்படுகிறது?' : language === 'hi' ? '2. दस्तावेज़ की गोपनीयता कैसे सुरक्षित है?' : '2. How is medical report privacy protected?'}
                </p>
                <p className="text-slate-600">
                  {language === 'ta'
                    ? 'பதிவேற்றப்படும் ஆவணங்கள் உங்கள் மருத்துவருக்கு மட்டுமே தெரியும். மருத்துவர் சரிபார்த்து அனுமதித்த பின்னரே மற்றவர்கள் பார்க்க முடியும்.'
                    : language === 'hi'
                    ? 'अपलोड किए गए दस्तावेज़ डिफ़ॉल्ट रूप से निजी होते हैं और केवल आपके डॉक्टर को दिखाई देते हैं।'
                    : 'All uploaded medical files are marked Private by default and can only be viewed by your treating doctor.'}
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-blue-900 space-y-1">
                <p className="font-extrabold">
                  {language === 'ta' ? 'அவசர உதவி எண்கள்' : language === 'hi' ? 'आपातकालीन सहायता नंबर' : 'Emergency & Helpline Contacts'}
                </p>
                <p>• {t('navigation.helpline')}</p>
                <p>• Police &amp; General Emergency: <strong>112</strong></p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
