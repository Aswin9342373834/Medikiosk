'use client';

import React from 'react';
import { Calendar, FileText, Pill, Stethoscope, Clock } from 'lucide-react';

interface DoctorPatientTimelineProps {
  timeline: any[];
}

export const DoctorPatientTimeline: React.FC<DoctorPatientTimelineProps> = ({ timeline }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-hospital-600" />
          <span>Chronological Medical Timeline</span>
        </h3>
        <span className="text-[10px] text-slate-400 font-semibold">{timeline.length} Events</span>
      </div>

      {timeline.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-4 text-center">No previous events found.</p>
      ) : (
        <div className="relative border-l-2 border-slate-200 pl-4 space-y-4 max-h-[300px] overflow-y-auto">
          {timeline.map((event, idx) => (
            <div key={idx} className="relative group">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-hospital-600 ring-4 ring-white"></div>
              <div className="text-[10px] text-slate-400 font-semibold">
                {new Date(event.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-hospital-600 transition">
                {event.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                  {event.department || 'OPD'}
                </span>
                <span className="text-[10px] text-hospital-600 font-semibold">
                  {event.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
