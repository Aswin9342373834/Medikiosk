'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../lib/api';
import { useTranslation } from '../contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Shield, Stethoscope, User, Monitor, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, []);

  const handleLogout = () => {
    api.logout();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex justify-between items-center gap-2">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-hospital-700 text-white flex items-center justify-center font-black text-xl shadow-xs group-hover:bg-hospital-800 transition">
            +
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">MediKiosk</span>
              <span className="bg-blue-100 text-hospital-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase">Govt OPD</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:block">
              AI Clinical History &amp; Medical Document Intake Platform
            </p>
          </div>
        </Link>

        {/* Portals Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link
            href="/kiosk"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-hospital-700 transition"
          >
            <Monitor className="w-4 h-4 text-hospital-600" />
            <span>{t('navigation.kiosk')}</span>
          </Link>

          <Link
            href="/patient"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-hospital-700 transition"
          >
            <User className="w-4 h-4 text-green-600" />
            <span>{t('patient.title')}</span>
          </Link>

          <Link
            href="/doctor"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-hospital-700 transition"
          >
            <Stethoscope className="w-4 h-4 text-blue-600" />
            <span>{t('navigation.doctor')}</span>
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-hospital-700 transition"
          >
            <Shield className="w-4 h-4 text-amber-600" />
            <span>{t('navigation.admin')}</span>
          </Link>
        </nav>

        {/* Language Switcher & User Account / Login */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher variant="compact" />

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-slate-900">{user.firstName} {user.lastName}</p>
                <p className="text-[10px] uppercase font-bold text-hospital-600 bg-hospital-50 px-2 py-0.5 rounded-full inline-block">
                  {user.role}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title={t('navigation.logout')}
                aria-label={t('navigation.logout')}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-hospital-700 hover:bg-hospital-50 rounded-lg transition"
              >
                {t('authentication.login')}
              </Link>
              <Link
                href="/kiosk"
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold bg-hospital-700 text-white rounded-lg hover:bg-hospital-800 shadow-xs transition hidden sm:inline-flex"
              >
                {t('navigation.kiosk')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
