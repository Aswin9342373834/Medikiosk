'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { Navbar } from '../../components/Navbar';
import { useTranslation } from '../../contexts/LanguageContext';
import { UserPlus, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    abhaId: '',
    role: 'PATIENT',
    department: 'General Medicine'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanFirstName = formData.firstName.trim();
    const cleanLastName = formData.lastName.trim();
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = formData.password;

    if (!cleanFirstName || !cleanLastName) {
      setError(language === 'ta' ? 'முதல் மற்றும் கடைசி பெயரை உள்ளிடவும்.' : language === 'hi' ? 'कृपया पहला और अंतिम नाम दर्ज करें।' : 'Please enter both your first and last name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError(language === 'ta' ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : language === 'hi' ? 'कृपया एक मान्य ईमेल पता दर्ज करें।' : 'Please enter a valid email address.');
      return;
    }

    if (cleanPassword.length < 6) {
      setError(language === 'ta' ? 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.' : language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: cleanEmail,
        password: cleanPassword,
        phone: formData.phone.trim() || undefined,
        abhaId: formData.abhaId.trim() || undefined,
        role: 'PATIENT',
        department: 'General Medicine'
      };

      const res = await api.register(payload);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (err: any) {
      if (err.status === 409 || err.code === 'DUPLICATE_EMAIL') {
        setError(
          language === 'ta'
            ? 'இந்த மின்னஞ்சல் முகவரி ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது. உள்நுழையவும்.'
            : language === 'hi'
            ? 'इस ईमेल के साथ पहले से ही एक खाता मौजूद है। कृपया साइन इन करें।'
            : 'An account with this email already exists. Please sign in or use another email.'
        );
      } else if (err.status === 400 || err.code === 'VALIDATION_ERROR') {
        setError(err.message || 'Please check your registration details.');
      } else if (err.isNetworkError || err.message?.includes('Network Error') || err.code === 'NETWORK_ERROR') {
        setError(
          language === 'ta'
            ? 'சேவையகத்தை இணைக்க முடியவில்லை. இணைய இணைப்பை சரிபார்க்கவும் அல்லது பின்னர் முயற்சிக்கவும்.'
            : language === 'hi'
            ? 'सर्वर से कनेक्ट करने में असमर्थ। कृपया नेटवर्क कनेक्शन जांचें या बाद में प्रयास करें।'
            : 'Unable to connect to the MediKiosk server. Please check your internet connection or verify that the backend is online.'
        );
      } else {
        setError(err.message || t('errors.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-hospital-50 text-hospital-700 mb-1">
              <UserPlus className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">{t('authentication.createAccount')}</h1>
            <p className="text-xs text-slate-500">{t('authentication.govLoginDesc')}</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-xl">
              {language === 'ta'
                ? 'கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது! உள்நுழைவு பக்கத்திற்கு மாற்றப்படுகிறீர்கள்...'
                : language === 'hi'
                ? 'खाता सफलतापूर्वक बनाया गया! साइन इन पृष्ठ पर पुनर्निर्देशित किया जा रहा है...'
                : 'Account created successfully! Redirecting to Sign In...'}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ta' ? 'முதல் பெயர்' : language === 'hi' ? 'पहला नाम' : 'First Name'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First Name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ta' ? 'கடைசி பெயர்' : language === 'hi' ? 'அंतिम नाम' : 'Last Name'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Last Name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('authentication.email')}
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="patient@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('opd.phone')}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('authentication.password')}
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('authentication.abhaId')} ({t('common.optional')})
              </label>
              <input
                type="text"
                value={formData.abhaId}
                onChange={(e) => setFormData({ ...formData, abhaId: e.target.value })}
                placeholder="Auto-generated if empty"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 outline-none font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {language === 'ta'
                  ? 'பொது பதிவு நோயாளிகளுக்கு மட்டுமே. மருத்துவ ஊழியர் கணக்குகள் மருத்துவமனை நிர்வாகத்தால் வழங்கப்படுகின்றன.'
                  : language === 'hi'
                  ? 'सार्वजनिक पंजीकरण केवल मरीजों के लिए है। कर्मचारी खाते अस्पताल द्वारा प्रदान किए जाते हैं।'
                  : 'Public registration is for patients only. Clinical staff and admin accounts are hospital-provisioned.'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-hospital-700 hover:bg-hospital-800 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <span>{loading ? t('common.loading') : t('authentication.register')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            {t('authentication.haveAccount')}{' '}
            <Link href="/login" className="text-hospital-700 font-bold hover:underline">
              {t('authentication.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
