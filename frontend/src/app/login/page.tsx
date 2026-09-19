'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { Navbar } from '../../components/Navbar';
import { useTranslation } from '../../contexts/LanguageContext';
import { Lock, Mail, ArrowRight, UserCheck, Stethoscope, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.login({ email: loginEmail.trim(), password: loginPass });
      if (res.success && res.user) {
        if (res.user.role === 'DOCTOR') {
          router.push('/doctor');
        } else if (res.user.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/patient');
        }
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Network') || msg.includes('Failed to fetch') || msg.includes('ECONNREFUSED') || msg.includes('timeout')) {
        setError(
          language === 'ta'
            ? 'சேவையகத்தை இணைக்க முடியவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
            : language === 'hi'
            ? 'प्रमाणीकरण सर्वर से कनेक्ट करने में असमर्थ। कृपया पुनः प्रयास करें।'
            : 'Unable to connect to the authentication server. Please try again.'
        );
      } else if (msg.includes('Email or password is incorrect') || msg.includes('Invalid email or password')) {
        setError(
          language === 'ta'
            ? 'மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது.'
            : language === 'hi'
            ? 'ईमेल या पासवर्ड गलत है।'
            : 'Email or password is incorrect.'
        );
      } else {
        setError(msg || t('errors.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError(
        language === 'ta'
          ? 'மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடவும்.'
          : language === 'hi'
          ? 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें।'
          : 'Please enter both email address and password.'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError(t('validation.invalidEmail') || 'Please enter a valid email address.');
      return;
    }

    executeLogin(cleanEmail, password);
  };

  const handleQuickLogin = (role: 'patient' | 'doctor' | 'admin') => {
    const creds = {
      patient: { email: 'patient@hospital.gov.in', pass: 'Password123!' },
      doctor: { email: 'doctor@hospital.gov.in', pass: 'Password123!' },
      admin: { email: 'admin@hospital.gov.in', pass: 'Password123!' }
    };
    setEmail(creds[role].email);
    setPassword(creds[role].pass);
    executeLogin(creds[role].email, creds[role].pass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-hospital-50 text-hospital-700 mb-1">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">{t('authentication.signIn')}</h1>
            <p className="text-xs text-slate-500">{t('authentication.govLoginDesc')}</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('authentication.email')}
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@hospital.gov.in"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('authentication.password')}
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-hospital-700 hover:bg-hospital-800 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? t('common.loading') : t('authentication.login')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demonstration Quick Login Buttons */}
          <div className="border-t border-slate-100 pt-5 space-y-2">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              {language === 'ta' ? 'விரைவு சோதனை உள்நுழைவு' : language === 'hi' ? 'त्वरित डेमो लॉगिन' : 'One-Click Demo Access'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('patient')}
                className="p-2 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition flex flex-col items-center gap-1"
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Patient</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('doctor')}
                className="p-2 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition flex flex-col items-center gap-1"
              >
                <Stethoscope className="w-4 h-4 text-green-600" />
                <span>Doctor</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition flex flex-col items-center gap-1"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500">
            <span>{t('authentication.noAccount')} </span>
            <Link href="/register" className="font-bold text-hospital-700 hover:underline">
              {t('authentication.register')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
