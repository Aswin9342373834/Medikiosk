'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { getTranslation, SupportedLanguage } from '../../../lib/i18n';

interface StepAyushProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  language: SupportedLanguage;
  totalSteps: number;
  prevStep: () => void;
  nextStep: () => void;
}

export const StepAyush: React.FC<StepAyushProps> = ({
  formData,
  setFormData,
  language,
  totalSteps,
  prevStep,
  nextStep
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-bold text-hospital-600 uppercase tracking-wider">Step 7 of {totalSteps}</span>
          <h2 className="text-3xl font-black text-slate-900 mt-1">{getTranslation('ayush_mode', language)}</h2>
          <p className="text-slate-600 text-sm mt-1">Ayurvedic Dashavidha Pariksha &amp; Ahara-Vihara parameters</p>
        </div>
        <div className="px-4 py-2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full font-extrabold text-xs flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>AYUSH Protocol: {formData.department || 'Authoritative Clinical Mode'}</span>
        </div>
      </div>

      {formData.ayushMode ? (
        <div className="p-6 bg-green-50 border-2 border-green-200 rounded-3xl space-y-4">
          <h3 className="font-extrabold text-green-900 text-lg">Dashavidha Pariksha Parameters</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="font-bold text-slate-700">1. Prakriti</label>
              <input
                type="text"
                value={formData.ayushData.prakriti}
                onChange={(e) => setFormData({ ...formData, ayushData: { ...formData.ayushData, prakriti: e.target.value } })}
                className="w-full p-2.5 bg-white border rounded-xl mt-1"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">2. Vikriti</label>
              <input
                type="text"
                value={formData.ayushData.vikriti}
                onChange={(e) => setFormData({ ...formData, ayushData: { ...formData.ayushData, vikriti: e.target.value } })}
                className="w-full p-2.5 bg-white border rounded-xl mt-1"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">3. Agni (Digestive Fire)</label>
              <input
                type="text"
                value={formData.ayushData.agni || 'Manda (Low)'}
                onChange={(e) => setFormData({ ...formData, ayushData: { ...formData.ayushData, agni: e.target.value } })}
                className="w-full p-2.5 bg-white border rounded-xl mt-1"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">4. Koshtha (Bowel Habit)</label>
              <input
                type="text"
                value={formData.ayushData.koshtha || 'Madhyama'}
                onChange={(e) => setFormData({ ...formData, ayushData: { ...formData.ayushData, koshtha: e.target.value } })}
                className="w-full p-2.5 bg-white border rounded-xl mt-1"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">5. Ahara (Diet)</label>
              <input
                type="text"
                value={formData.ayushData.ahara}
                onChange={(e) => setFormData({ ...formData, ayushData: { ...formData.ayushData, ahara: e.target.value } })}
                className="w-full p-2.5 bg-white border rounded-xl mt-1"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">6. Vihara (Lifestyle)</label>
              <input
                type="text"
                value={formData.ayushData.vihara}
                onChange={(e) => setFormData({ ...formData, ayushData: { ...formData.ayushData, vihara: e.target.value } })}
                className="w-full p-2.5 bg-white border rounded-xl mt-1"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">7. Nidana (Etiological Factors)</label>
              <input
                type="text"
                value={formData.ayushData.nidana || 'Irregular diet, late sleep'}
                onChange={(e) => setFormData({ ...formData, ayushData: { ...formData.ayushData, nidana: e.target.value } })}
                className="w-full p-2.5 bg-white border rounded-xl mt-1"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">8. Samprapti (Pathogenesis)</label>
              <input
                type="text"
                value={formData.ayushData.samprapti || 'Pitta-Kapha vitiation'}
                onChange={(e) => setFormData({ ...formData, ayushData: { ...formData.ayushData, samprapti: e.target.value } })}
                className="w-full p-2.5 bg-white border rounded-xl mt-1"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed border-slate-300 rounded-3xl text-center space-y-3">
          <p className="text-base text-slate-600 font-medium">Standard Allopathic Medicine OPD Selected.</p>
          <p className="text-xs text-slate-400">If you are visiting an Ayurvedic or Homeopathic doctor, toggle AYUSH mode on above.</p>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <button type="button" onClick={prevStep} className="px-8 py-4 border-2 border-slate-300 font-bold rounded-2xl text-lg">
          {getTranslation('back', language)}
        </button>
        <button type="button" onClick={nextStep} className="flex-1 py-4 bg-hospital-600 hover:bg-hospital-700 text-white font-extrabold rounded-2xl text-xl shadow-md flex items-center justify-center gap-2">
          <span>{getTranslation('next', language)}</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
