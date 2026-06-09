/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Search, Building2, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { Company, FormRef } from '../types';
import { FORMS } from '../data/forms';

interface GlobalSearchProps {
  companies: Company[];
  pendingItems: {
    c: Company;
    ci: number;
    fyL: string;
    r: {
      form: string;
      desc: string;
      dueDate: Date;
      isCustom?: boolean;
    };
    diff: number;
    key: string;
  }[];
  onSelectCompany: (idx: number) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenFormDetails: (formName: string) => void;
}

export default function GlobalSearch({
  companies,
  pendingItems,
  onSelectCompany,
  onNavigateToTab,
  onOpenFormDetails,
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Trigger search result filtering
  const trimmed = query.trim().toLowerCase();

  // 1. Match Companies
  const matchedCompanies = trimmed
    ? companies.map((c, originalIdx) => ({ c, idx: originalIdx }))
        .filter(item => 
          item.c.name.toLowerCase().includes(trimmed) || 
          item.c.cin.toLowerCase().includes(trimmed) ||
          item.c.type.toLowerCase().includes(trimmed)
        )
        .slice(0, 4)
    : [];

  // 2. Match Form Knowledge (from static FORMS array)
  const matchedForms = trimmed
    ? FORMS.filter((f: FormRef) => 
        f.form.toLowerCase().includes(trimmed) || 
        f.desc.toLowerCase().includes(trimmed) ||
        f.sec.toLowerCase().includes(trimmed) ||
        f.entity.toLowerCase().includes(trimmed)
      ).slice(0, 4)
    : [];

  // 3. Match Deadlines
  const matchedDeadlines = trimmed
    ? pendingItems.filter(item => 
        item.r.form.toLowerCase().includes(trimmed) ||
        item.r.desc.toLowerCase().includes(trimmed) ||
        item.c.name.toLowerCase().includes(trimmed) ||
        item.fyL.toLowerCase().includes(trimmed)
      ).slice(0, 4)
    : [];

  const hasResults = query && (matchedCompanies.length > 0 || matchedForms.length > 0 || matchedDeadlines.length > 0);

  const handleSelectCompanyResult = (idx: number) => {
    onSelectCompany(idx);
    onNavigateToTab('tracker');
    setQuery('');
    setIsOpen(false);
  };

  const handleSelectFormResult = (form: string) => {
    onOpenFormDetails(form);
    setQuery('');
    setIsOpen(false);
  };

  const handleSelectDeadlineResult = (companyIdx: number) => {
    onSelectCompany(companyIdx);
    onNavigateToTab('tracker');
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm md:max-w-md z-45">
      {/* Search Bar Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search companies, forms, or deadlines... (Ctrl+K)"
          className="w-full bg-gray-50/70 hover:bg-gray-100/50 dark:bg-neutral-950 dark:hover:bg-neutral-900 border border-gray-200 focus:border-blue-500 dark:border-neutral-800/75 dark:focus:border-neutral-700 py-1.5 pl-9 pr-12 rounded-lg text-xs font-semibold outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-100"
        />
        {/* Hotkey Tag */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-200 dark:bg-neutral-800 text-[9px] font-bold text-gray-500 dark:text-gray-400 rounded-sm">
          <span>⌘</span>
          <span>K</span>
        </div>
      </div>

      {/* Floating Results Panel */}
      {isOpen && query && (
        <div className="absolute top-11 left-0 right-0 max-h-[420px] overflow-y-auto bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-2xl p-2.5 flex flex-col gap-3">
          {!hasResults ? (
            <div className="py-8 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center gap-1.5">
              <Search className="w-8 h-8 opacity-40 animate-pulse" />
              <p className="text-xs font-medium">No matches found for "{query}"</p>
              <p className="text-[10px] opacity-75">Try searching "AOC-4", "TATA", or specific LLPINs</p>
            </div>
          ) : (
            <>
              {/* Companies Category */}
              {matchedCompanies.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 block mb-1">
                    Verified Profiles ({matchedCompanies.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchedCompanies.map(({ c, idx }) => (
                      <button
                        key={`search_co_${c.cin || c.name}`}
                        onClick={() => handleSelectCompanyResult(idx)}
                        className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-850 border border-transparent hover:border-gray-100 dark:hover:border-neutral-800 flex items-center gap-2.5 transition-all group cursor-pointer"
                      >
                        <div className="p-1.5 rounded-md bg-blue-50 dark:bg-neutral-800 text-blue-500 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {c.name}
                          </p>
                          <p className="text-[10px] font-mono text-gray-400 truncate mt-0.5 uppercase">
                            {c.cin} &middot; <span className="text-blue-500 font-bold font-sans">{c.type.toUpperCase()}</span>
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Deadlines Category */}
              {matchedDeadlines.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 block mb-1">
                    Pending Deadlines ({matchedDeadlines.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchedDeadlines.map(item => {
                      const isOverdue = item.diff < 0;
                      return (
                        <button
                          key={`search_dl_${item.key}`}
                          onClick={() => handleSelectDeadlineResult(item.ci)}
                          className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-850 border border-transparent hover:border-gray-100 dark:hover:border-neutral-800 flex items-center gap-2.5 transition-all group cursor-pointer"
                        >
                          <div className={`p-1.5 rounded-md flex items-center justify-center shrink-0 ${
                            isOverdue ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/20' : 'bg-amber-50 text-amber-500 dark:bg-amber-950/20'
                          }`}>
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center gap-1">
                              <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {item.r.form}
                              </span>
                              <span className={`text-[10px] font-bold shrink-0 ${
                                isOverdue ? 'text-rose-500' : 'text-amber-500'
                              }`}>
                                {isOverdue ? 'Overdue!' : `Due in ${item.diff}d`}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">
                              {item.c.name} &middot; <span className="font-mono">{item.fyL}</span>
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form Knowledge Category */}
              {matchedForms.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 block mb-1">
                    Form Knowledge Articles ({matchedForms.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchedForms.map(f => (
                      <button
                        key={`search_form_${f.form}`}
                        onClick={() => handleSelectFormResult(f.form)}
                        className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-850 border border-transparent hover:border-gray-100 dark:hover:border-neutral-800 flex items-center gap-2.5 transition-all group cursor-pointer"
                      >
                        <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                            {f.form}
                            <span className="px-1.5 py-0.2 bg-gray-100 dark:bg-neutral-800 text-[8px] rounded font-medium text-gray-400">
                              {f.sec}
                            </span>
                          </p>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
                            {f.desc} &middot; {f.entity}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
