'use client';

import React, { useState } from 'react';
import { Pill, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

interface DoctorPrescriptionBuilderProps {
  patientId: string;
  onPrescriptionCreated: () => void;
}

export const DoctorPrescriptionBuilder: React.FC<DoctorPrescriptionBuilderProps> = ({
  patientId,
  onPrescriptionCreated
}) => {
  const [items, setItems] = useState<any[]>([
    { medicine: '', dosage: '', frequency: 'Once daily', duration: '5 days', route: 'Oral', instructions: 'After food' }
  ]);
  const [followUp, setFollowUp] = useState('Review after 1 week');
  const [advice, setAdvice] = useState('Adequate hydration and rest');
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([...items, { medicine: '', dosage: '', frequency: 'Twice daily', duration: '5 days', route: 'Oral', instructions: 'After food' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, val: string) => {
    const updated = [...items];
    updated[index][field] = val;
    setItems(updated);
  };

  const handleSave = async () => {
    const validItems = items.filter(i => i.medicine.trim().length > 0);
    if (validItems.length === 0) {
      alert('Please enter at least one medication name');
      return;
    }

    setLoading(true);
    try {
      await api.createPrescription({
        patientId,
        items: validItems,
        followUp,
        generalAdvice: advice
      });
      alert('Prescription created and saved to patient record!');
      setItems([{ medicine: '', dosage: '', frequency: 'Once daily', duration: '5 days', route: 'Oral', instructions: 'After food' }]);
      onPrescriptionCreated();
    } catch (err: any) {
      alert(err.message || 'Failed to save prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Pill className="w-4 h-4 text-hospital-600" />
          <span>Electronic Prescription</span>
        </h3>
        <button
          type="button"
          onClick={addItem}
          className="text-xs text-hospital-600 font-bold hover:underline flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Medicine</span>
        </button>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {items.map((item, idx) => (
          <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Medicine (e.g. Paracetamol)"
                value={item.medicine}
                onChange={(e) => updateItem(idx, 'medicine', e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:border-hospital-500 outline-none"
              />
              <input
                type="text"
                placeholder="Dosage (500mg)"
                value={item.dosage}
                onChange={(e) => updateItem(idx, 'dosage', e.target.value)}
                className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:border-hospital-500 outline-none"
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <select
                value={item.frequency}
                onChange={(e) => updateItem(idx, 'frequency', e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="Once daily">Once daily (1-0-0)</option>
                <option value="Twice daily">Twice daily (1-0-1)</option>
                <option value="Thrice daily">Thrice daily (1-1-1)</option>
                <option value="SOS / As needed">SOS (As needed)</option>
              </select>

              <input
                type="text"
                placeholder="Duration (5 days)"
                value={item.duration}
                onChange={(e) => updateItem(idx, 'duration', e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              />

              <select
                value={item.instructions}
                onChange={(e) => updateItem(idx, 'instructions', e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="After food">After food</option>
                <option value="Before food">Before food</option>
                <option value="At bedtime">At bedtime</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 flex gap-2">
        <input
          type="text"
          placeholder="Follow-up advice (e.g. Review after 1 week)"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
        />
        <button
          type="button"
          disabled={loading}
          onClick={handleSave}
          className="py-1.5 px-4 bg-hospital-600 hover:bg-hospital-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{loading ? 'Saving...' : 'Issue Rx'}</span>
        </button>
      </div>
    </div>
  );
};
