// REUNIFY Emergency Resources Page
// Critical hotlines, shelter directories, and family guidance

import React from 'react';
import { Phone, Building2, Stethoscope, HeartHandshake, Shield, AlertTriangle, ExternalLink } from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const helplines = [
    { title: 'National Disaster Helpline', number: '1070', desc: 'Central 24x7 flood, cyclonic, and emergency distress command' },
    { title: 'District Disaster Emergency Desk', number: '1077', desc: 'District Collectorate emergency operations center' },
    { title: 'Medical Emergency & Trauma Ambulance', number: '108', desc: 'Immediate emergency medical and casualty transit dispatch' },
    { title: 'State Police Emergency', number: '100 / 112', desc: 'Law enforcement and missing persons FIR coordination' },
    { title: 'Childline National Foundation', number: '1098', desc: 'Specialized response for unaccompanied or lost minors' },
    { title: 'Women in Distress Helpline', number: '181', desc: '24x7 crisis support, protective transit, and counseling' },
  ];

  const shelters = [
    { name: 'Sellur Higher Secondary Relief Camp', district: 'Madurai', capacity: '450 beds', contact: '+91-452-2531000' },
    { name: 'Chathiram Central Transit Shelter', district: 'Tiruchirappalli', capacity: '600 beds', contact: '+91-431-2412000' },
    { name: 'Theni Government Medical Relief Post', district: 'Theni', capacity: '350 beds', contact: '+91-4546-250000' },
    { name: 'Silver Beach SDMA Camp', district: 'Cuddalore', capacity: '500 beds', contact: '+91-4142-230000' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold mb-3">
          <Phone className="w-3.5 h-3.5 text-rose-600" />
          <span>Verified Disaster Directory</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Emergency Helplines & Relief Resources
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Official contact points for immediate medical aid, boat evacuations, and relief camp coordination.
        </p>
      </div>

      {/* Hotline Numbers Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center">
          <Phone className="w-4 h-4 mr-2 text-teal-600" /> Essential Distress Hotlines (Toll-Free)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {helplines.map((h) => (
            <div key={h.number} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">{h.title}</span>
                <span className="text-2xl font-black text-teal-700 font-mono block mt-1">{h.number}</span>
                <p className="text-xs text-slate-600 mt-2">{h.desc}</p>
              </div>
              <a
                href={`tel:${h.number.split(' ')[0]}`}
                className="mt-4 inline-flex items-center justify-center px-3 py-2 rounded-xl bg-slate-50 hover:bg-teal-50 text-teal-800 text-xs font-bold border border-slate-200 transition"
              >
                Call Now
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Major Relief Camps */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center">
          <Building2 className="w-4 h-4 mr-2 text-teal-600" /> Major Active Relief Camps & Shelters
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-3">Camp Facility</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Operational Capacity</th>
                  <th className="p-3">Direct Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {shelters.map((s) => (
                  <tr key={s.name}>
                    <td className="p-3 font-semibold text-slate-900">{s.name}</td>
                    <td className="p-3 font-medium">{s.district}</td>
                    <td className="p-3 text-slate-600">{s.capacity}</td>
                    <td className="p-3 font-mono text-teal-700 font-semibold">{s.contact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Psychological First Aid Advice */}
      <div className="bg-teal-50/70 border border-teal-200 rounded-3xl p-6 sm:p-8 space-y-3">
        <h3 className="text-base font-bold text-teal-900 flex items-center">
          <HeartHandshake className="w-5 h-5 mr-2 text-teal-700" /> Immediate Advice for Searching Families
        </h3>
        <ul className="space-y-2 text-xs text-teal-950/80 leading-relaxed list-disc list-inside">
          <li><strong>Stay at a designated safe shelter post:</strong> If cell towers are down, leaving relief camps to search uncoordinated can lead to additional separations.</li>
          <li><strong>Note distinguishing anatomical markers:</strong> Scar locations, dental traits, and birthmarks reconcile much faster than clothing descriptions which may change during rescue.</li>
          <li><strong>Keep Case Tracking IDs saved:</strong> Use your REUNIFY tracking ID at any authorized desk to receive cross-network status instantly.</li>
        </ul>
      </div>
    </div>
  );
};
