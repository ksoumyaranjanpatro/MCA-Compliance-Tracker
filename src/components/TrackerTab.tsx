/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { Plus, Trash2, Edit2, Search, CheckSquare, Calendar, ShieldAlert, BadgeInfo, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Company, EntityType, CustomForm, AppLanguage, ComplianceRow } from '../types';
import { TRANSLATIONS } from '../i18n';
import { getAllFYs, getFYLabel, generateComplianceRows } from '../utils/dateRules';

interface TrackerTabProps {
  companies: Company[];
  selectedCompanyIdx: number | null;
  onSaveCompany: (c: Company, editIdx: number | null) => void;
  onDeleteCompany: (idx: number) => void;
  onSelectCompany: (idx: number) => void;
  lang: AppLanguage;
  pendingItems: any[];
}

export default function TrackerTab({
  companies,
  selectedCompanyIdx,
  onSaveCompany,
  onDeleteCompany,
  onSelectCompany,
  lang,
  pendingItems
}: TrackerTabProps) {
  const t = TRANSLATIONS[lang];

  // Tracker Form Fields State
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [name, setName] = useState<string>('');
  const [cin, setCin] = useState<string>('');
  const [type, setType] = useState<EntityType>('pvt');
  const [capital, setCapital] = useState<number>(100000);
  const [isSmall, setIsSmall] = useState<boolean>(false);
  const [incorp, setIncorp] = useState<string>('');
  const [lastAGMDate, setLastAGMDate] = useState<string>('');
  const [opcLastFY, setOpcLastFY] = useState<string>('');
  const [llpLastForm11Date, setLlpLastForm11Date] = useState<string>('');
  const [llpLastForm8Date, setLlpLastForm8Date] = useState<string>('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFYIdx, setSelectedFYIdx] = useState<number>(0);

  // Custom Event Form State
  const [isCFInputVisible, setIsCFInputVisible] = useState<boolean>(false);
  const [cfFormNum, setCfFormNum] = useState<string>('');
  const [cfDesc, setCfDesc] = useState<string>('');
  const [cfEventDate, setCfEventDate] = useState<string>('');
  const [cfDays, setCfDays] = useState<number>(30);
  const [cfCalcDueDate, setCfCalcDueDate] = useState<string>('');

  // Form Field Validation Hints
  const [firstFYSummary, setFirstFYSummary] = useState<string>('');

  // LLP Audit Threshold warning
  const LLP_AUDIT_LIMIT = 2500000; // ₹25L
  const isLlpAuditMandatory = type === 'llp' && capital > LLP_AUDIT_LIMIT;

  // Sync edit mode to selected index when edit triggers
  const handleEditClick = (idx: number) => {
    const c = companies[idx];
    setEditIdx(idx);
    setName(c.name);
    setCin(c.cin || '');
    setType(c.type);
    setCapital(c.capital || 0);
    setIsSmall(c.isSmall || false);
    setIncorp(c.incorp);
    setLastAGMDate(c.lastAGMDate || '');
    setOpcLastFY(c.opcLastFY || '');
    setLlpLastForm11Date(c.llpLastForm11Date || '');
    setLlpLastForm8Date(c.llpLastForm8Date || '');
    onSelectCompany(idx);
    setSelectedFYIdx(0);
  };

  const handleClearForm = () => {
    setEditIdx(null);
    setName('');
    setCin('');
    setType('pvt');
    setCapital(100000);
    setIsSmall(false);
    setIncorp('');
    setLastAGMDate('');
    setOpcLastFY('');
    setLlpLastForm11Date('');
    setLlpLastForm8Date('');
    setFirstFYSummary('');
  };

  // Pre calculate first financial year end
  useEffect(() => {
    if (!incorp) {
      setFirstFYSummary('');
      return;
    }
    const d = new Date(incorp);
    const yr = d.getFullYear();
    // Indian financial year ends on March 31 of following year
    const fyEnd = new Date(yr + 1, 2, 31);
    const label = `FY ${yr}–${String(yr + 1).slice(2)}`;
    setFirstFYSummary(`First Financial Year is computed from incorporation date ${new Date(incorp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} to ${fyEnd.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} (${label}).`);
  }, [incorp]);

  // Handle custom forms due date
  useEffect(() => {
    if (cfEventDate && cfDays > 0) {
      const d = new Date(cfEventDate);
      d.setDate(d.getDate() + cfDays);
      setCfCalcDueDate(d.toISOString().split('T')[0]);
    } else {
      setCfCalcDueDate('');
    }
  }, [cfEventDate, cfDays]);

  const handleSaveCompanySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !incorp) {
      alert("Name and Incorporation Date are mandatory!");
      return;
    }

    const compiledFiledStatus = editIdx !== null ? (companies[editIdx].filedStatus || {}) : {};

    // Auto mark LLP filings as Completed if initial filing dates are passed
    if (type === 'llp') {
      const allFYs = getAllFYs(incorp);
      if (llpLastForm11Date) {
        const fyEnd11 = getFYofLLPFiling(llpLastForm11Date);
        allFYs.forEach(fy => {
          if (fy.getTime() <= fyEnd11.getTime()) {
            const key = `${cin || name}_${getFYLabel(fy)}_LLP Form 11`;
            compiledFiledStatus[key] = true;
          }
        });
      }
      if (llpLastForm8Date) {
        const fyEnd8 = getFYofLLPFiling(llpLastForm8Date);
        allFYs.forEach(fy => {
          if (fy.getTime() <= fyEnd8.getTime()) {
            const key = `${cin || name}_${getFYLabel(fy)}_LLP Form 8`;
            compiledFiledStatus[key] = true;
          }
        });
      }
    }

    // Auto-mark completed FYs if Last AGM Held Date or OPC Last FY is assigned
    if (type === 'opc' && opcLastFY) {
      const allFYs = getAllFYs(incorp);
      const parts = opcLastFY.split('-');
      if (parts.length === 2) {
        const endYr = 2000 + parseInt(parts[1]);
        allFYs.forEach(fy => {
          if (fy.getFullYear() <= endYr) {
            const key1 = `${cin || name}_${getFYLabel(fy)}_AOC-4`;
            const key2 = `${cin || name}_${getFYLabel(fy)}_MGT-7A`;
            compiledFiledStatus[key1] = true;
            compiledFiledStatus[key2] = true;
          }
        });
      }
    } else if (lastAGMDate && type !== 'llp' && type !== 'opc') {
      // AGM maps to FY
      const agmFYEnd = getFYofAGM(lastAGMDate);
      const allFYs = getAllFYs(incorp);

      const tempCompany: Company = {
        name,
        cin: cin.toUpperCase(),
        type,
        incorp,
        capital,
        isSmall: type !== 'opc' && type !== 'llp' && isSmall,
        lastAGMDate,
        opcLastFY: '',
        llpLastForm11Date: '',
        llpLastForm8Date: '',
        filedStatus: {},
        customForms: [],
        savedAt: new Date().toISOString()
      };

      allFYs.forEach(fy => {
        if (fy.getTime() <= agmFYEnd.getTime()) {
          const rowsForFY = generateComplianceRows(tempCompany, fy);
          rowsForFY.forEach(r => {
            const key = `${cin || name}_${getFYLabel(fy)}_${r.form}${r.isPostIncorp ? '_postincorp' : ''}`;
            compiledFiledStatus[key] = true;
          });
        }
      });
    }

    const payload: Company = {
      name,
      cin: cin.toUpperCase(),
      type,
      incorp,
      capital,
      isSmall: type !== 'opc' && type !== 'llp' && isSmall,
      lastAGMDate: type !== 'opc' && type !== 'llp' ? lastAGMDate : '',
      opcLastFY: type === 'opc' ? opcLastFY : '',
      llpLastForm11Date: type === 'llp' ? llpLastForm11Date : '',
      llpLastForm8Date: type === 'llp' ? llpLastForm8Date : '',
      filedStatus: compiledFiledStatus,
      customForms: editIdx !== null ? (companies[editIdx].customForms || []) : [],
      savedAt: new Date().toISOString()
    };

    onSaveCompany(payload, editIdx);
    handleClearForm();
  };

  const handleAddCustomFormSubmit = () => {
    if (selectedCompanyIdx === null || !cfFormNum || !cfCalcDueDate) return;
    const c = companies[selectedCompanyIdx];
    const newForm: CustomForm = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      form: cfFormNum.toUpperCase(),
      desc: cfDesc || cfFormNum,
      eventDate: cfEventDate,
      days: cfDays,
      dueDate: cfCalcDueDate
    };

    const updatedCustomList = [...(c.customForms || []), newForm];
    const updatedCompany: Company = {
      ...c,
      customForms: updatedCustomList
    };

    onSaveCompany(updatedCompany, selectedCompanyIdx);
    setCfFormNum('');
    setCfDesc('');
    setCfEventDate('');
    setCfDays(30);
    setIsCFInputVisible(false);
  };

  const handleDeleteCustomForm = (cfId: string) => {
    if (selectedCompanyIdx === null) return;
    const c = companies[selectedCompanyIdx];
    const filtered = (c.customForms || []).filter(f => f.id !== cfId);
    const updatedCompany: Company = {
      ...c,
      customForms: filtered
    };
    onSaveCompany(updatedCompany, selectedCompanyIdx);
  };

  const activeCompany = selectedCompanyIdx !== null ? companies[selectedCompanyIdx] : null;

  // Filtered companies registry list
  const filteredCompanies = companies.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || (c.cin || '').toLowerCase().includes(q);
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 leading-relaxed items-start text-left">
      {/* Registry Panel: Left */}
      <div className="xl:col-span-5 space-y-6">
        {/* Form Container */}
        <form
          onSubmit={handleSaveCompanySubmit}
          className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-850 pb-3">
            <h3 className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 matches-left-border">
              <Sparkles className="w-4 h-4 shrink-0 text-blue-500" />
              {t.trackAddEditHeader}
            </h3>
            {editIdx !== null && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/35">
                Edit Mode
              </span>
            )}
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {t.trackNameLabel} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.trackNamePlaceholder}
                className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-850 rounded-lg p-2.5 text-gray-750 dark:text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* CIN */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {t.trackCINLabel}
              </label>
              <input
                type="text"
                maxLength={21}
                value={cin}
                onChange={(e) => setCin(e.target.value.toUpperCase())}
                placeholder={t.trackCINPlaceholder}
                className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-850 rounded-lg p-2.5 text-gray-750 dark:text-gray-200 focus:border-blue-500 uppercase font-mono"
              />
              <span className="text-[10px] text-gray-400">
                {t.trackCINHint}
              </span>
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {t.calcEntityType} *
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const nt = e.target.value as EntityType;
                  setType(nt);
                  if (nt === 'llp' || nt === 'opc') setIsSmall(false);
                }}
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5 text-gray-750 dark:text-gray-205 focus:border-blue-500 shadow-3xs"
              >
                <option value="pvt" className="bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100">Private Limited Company</option>
                <option value="pub" className="bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100">Public Limited Company</option>
                <option value="opc" className="bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100">{t.calcEntityOPC}</option>
                <option value="sec8" className="bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100">Section 8 Company</option>
                <option value="llp" className="bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100">LLP</option>
              </select>
            </div>

            {/* Small company toggle */}
            {type !== 'opc' && type !== 'llp' && (
              <div
                onClick={() => setIsSmall(!isSmall)}
                className={`flex items-start gap-3.5 p-3.5 border rounded-xl cursor-pointer select-none transition-all duration-250 hover-scale hover-glow ${
                  isSmall
                    ? 'bg-blue-50/10 border-blue-500/50 dark:bg-blue-950/20 dark:border-blue-500/40'
                    : 'bg-gray-50 dark:bg-neutral-800 border-gray-150 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={isSmall}
                    onChange={() => {}} // handled by click parent
                    className="mt-0.5 h-4.5 w-4.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 shrink-0 cursor-pointer"
                  />
                </div>
                <div>
                  <span className={`text-xs font-bold block transition-colors ${isSmall ? 'text-blue-600 dark:text-blue-400' : 'text-gray-750 dark:text-gray-200'}`}>
                    {t.trackSmallCompany}
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-normal">
                    {t.trackSmallCompanyHint}
                  </p>
                </div>
              </div>
            )}

            {/* Contribution/Capital */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {type === 'llp' ? t.trackContributionLabel : t.trackCapitalLabel}
              </label>
              <input
                type="number"
                min={0}
                value={capital}
                onChange={(e) => setCapital(parseInt(e.target.value) || 0)}
                placeholder={type === 'llp' ? t.trackContributionPlaceholder : t.trackCapitalPlaceholder}
                className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-850 rounded-lg p-2.5 text-gray-750 dark:text-gray-200 focus:border-blue-500"
              />
              {type === 'llp' && (
                <span className="text-[10px] text-gray-400 leading-snug">
                  {t.trackContributionHint}
                </span>
              )}
            </div>

            {/* Incorporation date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {t.calcIncorpDate} *
              </label>
              <input
                type="date"
                required
                value={incorp}
                onChange={(e) => setIncorp(e.target.value)}
                className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-850 rounded-lg p-2.5 text-gray-750 dark:text-gray-200 focus:border-blue-500"
              />
              {firstFYSummary && (
                <div className="p-2.5 bg-blue-50/40 border border-blue-150/30 rounded-lg dark:bg-blue-950/10 dark:border-blue-900/35 flex items-start gap-1.5">
                  <BadgeInfo className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-500 leading-snug">{firstFYSummary}</p>
                </div>
              )}
            </div>

            {/* Slabs / Historical filings */}
            {type !== 'opc' && type !== 'llp' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {t.trackLastAGMLabel}
                </label>
                <input
                  type="date"
                  value={lastAGMDate}
                  onChange={(e) => setLastAGMDate(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-850 rounded-lg p-2.5 text-gray-750 dark:text-gray-200 focus:border-blue-500"
                />
                <span className="text-[10px] text-gray-400">
                  {t.trackLastAGMHint}
                </span>
              </div>
            )}

            {type === 'opc' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {t.trackOpcLastFY}
                </label>
                <select
                  value={opcLastFY}
                  onChange={(e) => setOpcLastFY(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5 text-gray-750 dark:text-gray-205 focus:border-blue-500 shadow-3xs"
                >
                  <option value="" className="bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100">-- Not yet filed any FY --</option>
                  <option value="2020-21" className="bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100">FY 2020-21</option>
                  <option value="2021-22" className="bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100">FY 2021-22</option>
                  <option value="2022-23" className="bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100">FY 2022-23</option>
                  <option value="2023-24" className="bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100">FY 2023-24</option>
                  <option value="2024-25" className="bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100">FY 2024-25</option>
                </select>
              </div>
            )}

            {type === 'llp' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {t.trackLlpForm11}
                  </label>
                  <input
                    type="date"
                    value={llpLastForm11Date}
                    onChange={(e) => setLlpLastForm11Date(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-850 rounded-lg p-2.5 text-gray-750 dark:text-gray-200 focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {t.trackLlpForm8}
                  </label>
                  <input
                    type="date"
                    value={llpLastForm8Date}
                    onChange={(e) => setLlpLastForm8Date(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-850 rounded-lg p-2.5 text-gray-750 dark:text-gray-200 focus:border-blue-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* LLP audit alert badge */}
          {isLlpAuditMandatory && (
            <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg dark:bg-purple-950/20 dark:border-purple-900/30 flex items-start gap-2 text-xs text-purple-800 dark:text-purple-400 leading-normal">
              <ShieldAlert className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <p>
                <strong>Statutory Audit Required:</strong> Total contribution exceeds the limits defined in Rule 24(8) of LLP Rules 2009. Audit is statutory mandatory before Form 8 reporting.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 text-xs">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              {editIdx !== null ? "Update Company Profile" : t.trackSaveButton}
            </button>
            <button
              type="button"
              onClick={handleClearForm}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-gray-750 dark:text-gray-300 font-bold rounded-lg cursor-pointer transition-colors"
            >
              {t.trackClearButton}
            </button>
          </div>
        </form>

        {/* Saved Profiles Search Box Listing Column */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
          <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
            {t.trackSavedCompaniesList} ({companies.length})
          </h4>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.trackSearchPlaceholder}
              className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-850 rounded-lg py-2 pl-9 pr-3 text-xs text-gray-750 dark:text-gray-200 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
            {filteredCompanies.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-6">
                {t.trackNoCompaniesSaved}
              </p>
            ) : (
              filteredCompanies.map((c) => {
                const globalIdx = companies.findIndex(x => x.cin === c.cin && x.name === c.name);
                const isSelected = selectedCompanyIdx === globalIdx;

                return (
                  <div
                    key={globalIdx}
                    onClick={() => {
                      onSelectCompany(globalIdx);
                      setSelectedFYIdx(0);
                    }}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-4 cursor-pointer transition-all hover:bg-gray-50/15 dark:hover:bg-neutral-800/10 ${
                      isSelected
                        ? 'bg-blue-50/5 border-blue-500 ring-1 ring-blue-500/20 dark:bg-blue-950/10'
                        : 'bg-white dark:bg-neutral-900 border-gray-150 dark:border-neutral-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-gray-901 dark:text-white block truncate">
                        {c.name}
                      </span>
                      <span className="text-[10px] text-gray-405 dark:text-gray-500 font-mono tracking-wide truncate block mt-0.5">
                        {c.cin || '(No Registration Number)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleEditClick(globalIdx)}
                        className="p-1.5 border border-gray-200 dark:border-neutral-800 text-gray-500 rounded-md hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
                        title="Edit profile parameters"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteCompany(globalIdx)}
                        className="p-1.5 border border-gray-250 dark:border-neutral-800 text-gray-500 rounded-md hover:text-rose-500 dark:text-gray-450 dark:hover:text-rose-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
                        title="Delete profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Compliance dashboard checklist & custom event forms constructor: Right */}
      <div className="xl:col-span-7 space-y-6">
        {activeCompany ? (
          <>
            {/* Custom Forms Creator block */}
            <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                  📁 {t.cfHeader}
                </h4>
                {!isCFInputVisible && (
                  <button
                    onClick={() => setIsCFInputVisible(true)}
                    className="p-1.5 border border-blue-500 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase rounded-lg hover:bg-blue-50 dark:hover:bg-neutral-800 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add custom event form
                  </button>
                )}
              </div>

              {isCFInputVisible && (
                <div className="bg-gray-50/20 dark:bg-neutral-905 p-4 rounded-xl border border-gray-150 dark:border-neutral-800/80 space-y-3 animate-fade-in text-xs">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {t.cfFormNum}
                      </label>
                      <input
                        type="text"
                        value={cfFormNum}
                        onChange={(e) => setCfFormNum(e.target.value)}
                        placeholder={t.cfFormPlaceholder}
                        className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-2 text-xs focus:border-blue-500 uppercase font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {t.cfDescLabel}
                      </label>
                      <input
                        type="text"
                        value={cfDesc}
                        onChange={(e) => setCfDesc(e.target.value)}
                        placeholder={t.cfDescPlaceholder}
                        className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-2 text-xs focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {t.calcEventDate}
                      </label>
                      <input
                        type="date"
                        value={cfEventDate}
                        onChange={(e) => setCfEventDate(e.target.value)}
                        className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-1.5 text-xs focus:border-blue-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {t.cfDueWithin}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={cfDays}
                        onChange={(e) => setCfDays(parseInt(e.target.value) || 30)}
                        className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-1.5 text-xs focus:border-blue-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {t.cfCalcDueDate}
                      </label>
                      <input
                        type="date"
                        readOnly
                        value={cfCalcDueDate}
                        className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-800 rounded-lg p-1.5 text-xs font-semibold focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={handleAddCustomFormSubmit}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors shrink-0 cursor-pointer"
                    >
                      {t.cfAddButton}
                    </button>
                    <button
                      onClick={() => setIsCFInputVisible(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 rounded-lg font-bold text-xs cursor-pointer"
                    >
                      {t.cfCancelButton}
                    </button>
                  </div>
                </div>
              )}

              {/* List of custom event forms belonging to this company */}
              <div className="space-y-2">
                {!activeCompany.customForms || activeCompany.customForms.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    No custom-registered event-based filings mapped. Click the add button above to construct DIR-12, CHG-1 or other event schedules.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {activeCompany.customForms.map(f => {
                      const triggerKey = `${activeCompany.cin || activeCompany.name}_custom_${f.id}`;
                      const isFiled = !!(activeCompany.filedStatus && activeCompany.filedStatus[triggerKey]);

                      return (
                        <div
                          key={f.id}
                          className={`p-3 border rounded-lg flex items-center justify-between gap-3 text-xs leading-snug relative ${
                            isFiled
                              ? 'bg-emerald-50/5 border-emerald-100/40 opacity-70 dark:bg-neutral-850/10'
                              : 'bg-white dark:bg-neutral-905 border-gray-150 dark:border-neutral-800 shadow-2xs'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                {f.form}
                              </span>
                              <span className="font-semibold text-gray-700 dark:text-gray-100 truncate block">
                                {f.desc}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">
                              Event: {new Date(f.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} &bull; Due: <strong>{new Date(f.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isFiled}
                              onChange={(e) => {
                                const compiled = { ...(activeCompany.filedStatus || {}) };
                                if (e.target.checked) compiled[triggerKey] = true;
                                else delete compiled[triggerKey];
                                const updated = { ...activeCompany, filedStatus: compiled };
                                onSaveCompany(updated, selectedCompanyIdx);
                              }}
                              className="h-4.5 w-4.5 text-emerald-600 focus:ring-emerald-500 rounded-sm cursor-pointer shadow-3xs"
                              title="Mark as Filed"
                            />
                            <button
                              onClick={() => handleDeleteCustomForm(f.id)}
                              className="p-1 text-gray-400 hover:text-rose-500 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800"
                              title="Delete from custom list"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Smart Compliance Dynamic Form Checklist Dashboard */}
            <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="border-b border-gray-100 dark:border-neutral-850 pb-3">
                <h4 className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-widest block">
                  🛡️ Smart compliance checklist tracker
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                  Manage active deliverables and mark off forms submitted to the MCA. Doing so eliminates them from overdue counters and halts late fees accrual.
                </p>
              </div>

              {/* Company metadata header cards */}
              <div className="p-4 bg-gray-50 border border-gray-155 rounded-xl dark:bg-neutral-805 dark:border-neutral-800 flex flex-wrap gap-x-5 gap-y-3.5 items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Active Entity Profile
                  </span>
                  <span className="text-xs font-bold text-gray-750 dark:text-gray-150 block mt-1">
                    {activeCompany.name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Category Type
                  </span>
                  <span className="text-[10.5px] font-extrabold block px-2.5 py-0.5 rounded-full w-max text-blue-700 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 mt-1">
                    {activeCompany.type.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Incorporation Date
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 block mt-1">
                    {new Date(activeCompany.incorp).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* FY selector tabs */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                  Select Financial Year
                </span>
                <div className="flex flex-wrap gap-1.5 bg-gray-100/40 dark:bg-neutral-950 p-1.5 rounded-xl border border-gray-200/50 dark:border-neutral-800">
                  {getAllFYs(activeCompany.incorp).map((fyEnd, index) => {
                    const label = getFYLabel(fyEnd);
                    const isActive = index === selectedFYIdx;
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedFYIdx(index)}
                        className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer hover-scale ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-2xs ring-2 ring-blue-500/20 dark:bg-blue-500'
                            : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 dark:bg-neutral-900 dark:text-gray-300 dark:hover:text-white dark:hover:bg-neutral-800 border border-transparent dark:border-neutral-800 shadow-2xs'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Compliance Rows checklist table */}
              <div className="border border-gray-150 dark:border-neutral-800 rounded-xl overflow-hidden shadow-3xs max-h-[350px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-neutral-850 text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-gray-150 dark:border-neutral-800">
                    <tr>
                      <th className="p-3">Form</th>
                      <th className="p-3">Deliverable Task</th>
                      <th className="p-3">Limit Date</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Filed?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-neutral-850">
                    {(() => {
                      const allFYs = getAllFYs(activeCompany.incorp);
                      const selFY = allFYs[selectedFYIdx] || allFYs[0];
                      if (!selFY) return null;

                      const rows = generateComplianceRows(activeCompany, selFY);
                      const today = new Date(); today.setHours(0,0,0,0);

                      return rows.map((r, rIdx) => {
                        const cellKey = `${activeCompany.cin || activeCompany.name}_${getFYLabel(selFY)}_${r.form}${r.isPostIncorp ? '_postincorp' : ''}`;
                        const isFiled = !!(activeCompany.filedStatus && activeCompany.filedStatus[cellKey]);

                        let statusColor = 'text-blue-500 bg-blue-50 dark:bg-blue-950/20';
                        let statusLabel = 'Upcoming';

                        if (isFiled) {
                          statusColor = 'text-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20';
                          statusLabel = 'Filed';
                        } else if (r.dueDate) {
                          const diff = Math.ceil((r.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          if (diff < 0) {
                            statusColor = 'text-rose-500 bg-rose-50 dark:bg-rose-950/20';
                            statusLabel = `Overdue by ${Math.abs(diff)}d`;
                          } else if (diff <= 7) {
                            statusColor = 'text-amber-500 bg-amber-50 dark:bg-amber-950/20';
                            statusLabel = 'Critical';
                          } else if (diff <= 30) {
                            statusColor = 'text-blue-500 bg-blue-50 dark:bg-blue-950/20';
                            statusLabel = `Due in ${diff}d`;
                          }
                        }

                        return (
                          <tr
                            key={rIdx}
                            className={`hover:bg-gray-50/15 dark:hover:bg-neutral-800/10 ${
                              isFiled ? 'bg-emerald-50/5 dark:bg-neutral-850/5 opacity-70' : ''
                            }`}
                          >
                            <td className="p-3 font-semibold text-gray-901 dark:text-white shrink-0 font-mono">
                              {r.form}
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-gray-700 dark:text-gray-200 block truncate max-w-[150px]">
                                {r.desc}
                              </span>
                              <span className="text-[10px] text-gray-400 block max-w-[200px] mt-0.5 line-clamp-1">
                                {r.note}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-gray-600 dark:text-gray-300">
                              {r.dueDate
                                ? r.dueDate.toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short'
                                  })
                                : 'N/A'}
                            </td>
                            <td className="p-2 text-center shrink-0">
                              <span className={`text-[9.5px] font-bold py-0.5 px-2 rounded-full inline-block ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="p-3 text-center shrink-0">
                              <input
                                type="checkbox"
                                checked={isFiled}
                                onChange={(e) => {
                                  const compiled = { ...(activeCompany.filedStatus || {}) };
                                  if (e.target.checked) compiled[cellKey] = true;
                                  else delete compiled[cellKey];
                                  const updated = { ...activeCompany, filedStatus: compiled };
                                  onSaveCompany(updated, selectedCompanyIdx);
                                }}
                                className="h-4.5 w-4.5 text-emerald-600 focus:ring-emerald-500 rounded-sm cursor-pointer shadow-3xs"
                              />
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl min-h-[400px]">
            <CheckSquare className="w-12 h-12 text-gray-300 dark:text-neutral-700 mb-3 animate-pulse" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select or save a business profile from the left registry margin to unleash the active Smart Compliance Dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
 * PARSING HELPERS SPECIFIC TO TRACKER SEED DATA
 * ──────────────────────────────────────────────────────────────── */

function getFYofAGM(agmDateStr: string): Date {
  const d = new Date(agmDateStr);
  const m = d.getMonth();
  const yr = d.getFullYear();
  // AGM belongs to FY ending March 31 of same year if April-December, else prior year
  if (m >= 3) {
    return new Date(yr, 2, 31);
  }
  return new Date(yr - 1, 2, 31);
}

function getFYofLLPFiling(filingDateStr: string): Date {
  const d = new Date(filingDateStr);
  const m = d.getMonth();
  const yr = d.getFullYear();
  if (m >= 3) {
    return new Date(yr, 2, 31);
  }
  return new Date(yr - 1, 2, 31);
}

