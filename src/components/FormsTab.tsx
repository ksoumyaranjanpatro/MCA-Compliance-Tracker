/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Search, Filter, ZoomIn, HelpCircle } from 'lucide-react';
import { FormRef, AppLanguage } from '../types';
import { TRANSLATIONS } from '../i18n';

interface FormsTabProps {
  formsList: FormRef[];
  lang: AppLanguage;
  onSelectForm: (formName: string) => void;
}

export default function FormsTab({ formsList, lang, onSelectForm }: FormsTabProps) {
  const t = TRANSLATIONS[lang];
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveFilter] = useState<string>('all');

  // Filter Categories
  const categories = [
    { id: 'all', label: 'All forms' },
    { id: 'annual', label: t.tagAnnual || 'Annual Filing' },
    { id: 'event', label: 'Event-Based' },
    { id: 'llp', label: 'LLP Forms' },
    { id: 'opc', label: t.calcEntityOPC || 'OPC Forms' },
    { id: 'ccfs', label: 'CCFS-2026 Eligible' }
  ];

  const filteredForms = formsList.filter(f => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      f.form.toLowerCase().includes(q) ||
      f.desc.toLowerCase().includes(q) ||
      (f.sec || '').toLowerCase().includes(q) ||
      f.entity.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeCategory === 'annual') return f.type === 'annual';
    if (activeCategory === 'event') return f.type === 'event';
    if (activeCategory === 'llp') return f.isLLP === true;
    if (activeCategory === 'opc') return f.isOPC === true || f.entity.includes('OPC');
    if (activeCategory === 'ccfs') return f.ccfs === 'ccfs2026';

    return true;
  });

  return (
    <div className="space-y-4 text-left leading-relaxed">
      {/* Search and Filters panel */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-4 shadow-2xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by form number, statutory section, or keyword..."
            className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-850 rounded-lg py-3 pl-11 pr-4 text-xs text-gray-750 dark:text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Categories toggling */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Quick Categories Filters
          </span>
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white dark:bg-neutral-905 text-gray-600 border-gray-200 hover:bg-gray-50 dark:text-gray-400 dark:border-neutral-800 dark:hover:bg-neutral-800/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table grid listing */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-3 bg-gray-50 dark:bg-neutral-905 border-b border-gray-150 dark:border-neutral-800 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-blue-500" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none block">
            Click any form row below to view full legal sections and step-by-step filing guide
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs text-left min-w-[700px]">
            <thead className="bg-gray-50 dark:bg-neutral-850 text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-gray-150 dark:border-neutral-800 sticky top-0 z-10 shadow-3xs">
              <tr>
                <th className="p-3">Form Details</th>
                <th className="p-3">Deliverable Description</th>
                <th className="p-3">Category</th>
                <th className="p-3">Due Date Trigger</th>
                <th className="p-3">Late Penalty Basis</th>
                <th className="p-3 text-center">CCFS-2026</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-850">
              {filteredForms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-gray-400 italic">
                    No compliance forms match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredForms.map((f, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onSelectForm(f.form)}
                    className="hover:bg-gray-50/15 dark:hover:bg-neutral-800/10 cursor-pointer transition-colors group"
                  >
                    <td className="p-3 font-semibold text-gray-901 dark:text-white shrink-0 group-hover:text-blue-500">
                      <div className="flex items-center gap-1.5">
                        <ZoomIn className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        <span className="font-mono bg-blue-50 text-blue-700 dark:bg-blue-950/25 dark:text-blue-400 px-2 py-0.5 rounded font-extrabold text-[10px]">
                          {f.form}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 font-medium text-gray-700 dark:text-gray-250">
                      {f.desc}
                      <span className="text-[10.5px] font-mono text-gray-400 block mt-0.5">
                        {f.sec} (Scope: {f.entity})
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-[9.5px] font-bold py-0.5 px-2 rounded-full ${
                        f.type === 'annual'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        {f.type === 'annual' ? 'Annual' : 'Event'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-650 dark:text-gray-300 font-medium">
                      {f.dueInfo}
                    </td>
                    <td className="p-3 font-mono font-bold text-gray-600 dark:text-gray-450 leading-relaxed text-[10.5px]">
                      {f.lateBasis}
                    </td>
                    <td className="p-3 text-center shrink-0">
                      {f.ccfs === 'ccfs2026' ? (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                          Eligible ✓
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-gray-50 text-gray-400 dark:bg-neutral-800 dark:text-neutral-500 px-2 py-0.5 rounded-full">
                          Excluded
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
