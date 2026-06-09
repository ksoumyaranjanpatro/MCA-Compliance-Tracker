/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Printer, Info, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { FormRef, AppLanguage } from '../types';
import { TRANSLATIONS } from '../i18n';

interface CalculatorTabProps {
  formsList: FormRef[];
  lang: AppLanguage;
}

const CAPITAL_FEES = [200, 300, 400, 500, 600, 600];

export default function CalculatorTab({ formsList, lang }: CalculatorTabProps) {
  const t = TRANSLATIONS[lang];

  // Form Fields State
  const [entityType, setEntityType] = useState<string>('company');
  const [capitalSlab, setCapitalSlab] = useState<number>(3); // Default index 3: ₹25L to ₹99.99L
  const [selectedFormName, setSelectedFormName] = useState<string>('');
  const [annualFY, setAnnualFY] = useState<number>(2025); // Default to FY 2025-26
  const [incorpDate, setIncorpDate] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>('');
  const [filingDate, setFilingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [normalFee, setNormalFee] = useState<number>(500);

  // Computed Outputs
  const [computedDueDate, setComputedDueDate] = useState<string>('');
  const [isFirstFY, setIsFirstFY] = useState<boolean>(false);
  const [computedDatesSummary, setComputedDatesSummary] = useState<string>('');
  const [ccfsStatus, setCcfsStatus] = useState<{ active: boolean; label: string; type: 'success' | 'warn' | null }>({ active: false, label: '', type: null });
  const [calcResult, setCalcResult] = useState<any | null>(null);

  // Populate financial years list (from 2015 to current)
  const [fyOptions, setFyOptions] = useState<number[]>([]);
  useEffect(() => {
    const today = new Date();
    const curYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    const list = [];
    for (let y = curYear; y >= 2015; y--) {
      list.push(y);
    }
    setFyOptions(list);
  }, []);

  // Filtered forms based on entity selection
  const getFilteredForms = () => {
    if (entityType === 'llp') return formsList.filter(f => f.isLLP);
    if (entityType === 'opc') return formsList.filter(f => !f.isLLP && (f.entity.includes('OPC') || f.entity.includes('Company') || f.entity.includes('Director')));
    if (entityType === 'body_corp') return formsList.filter(f => !f.isLLP && (f.entity.includes('Foreign') || f.entity.includes('Nidhi') || f.entity.includes('Company') || f.entity.includes('Director')));
    return formsList.filter(f => !f.isLLP);
  };

  const filteredForms = getFilteredForms();

  // Reset selected form when entityType changes
  useEffect(() => {
    const defaultForm = filteredForms[0]?.form || '';
    setSelectedFormName(defaultForm);
  }, [entityType]);

  // Update normal fee and layout on form change
  const activeFormObj = formsList.find(f => f.form === selectedFormName);
  useEffect(() => {
    if (activeFormObj) {
      const fee = activeFormObj.fixedFee ? 0 : CAPITAL_FEES[capitalSlab];
      setNormalFee(fee);
    }
  }, [selectedFormName, capitalSlab]);

  // Main dates calculator hook
  useEffect(() => {
    if (!activeFormObj) return;

    const isAnnual = ['AOC-4', 'AOC-4 XBRL', 'AOC-4 CFS', 'AOC-4 NBFC', 'MGT-7', 'MGT-7A', 'LLP Form 8', 'LLP Form 11'].includes(selectedFormName);

    if (isAnnual) {
      // Annual calculation
      const isLLP = selectedFormName.includes('LLP');
      const fyEnd = new Date(annualFY + 1, 2, 31); // 31 March
      const fyStart = new Date(annualFY, 3, 1);     // 1 April

      if (isLLP) {
        setIsFirstFY(false);
        if (selectedFormName === 'LLP Form 11') {
          // Due 30 May
          const due = new Date(annualFY + 1, 4, 30);
          setComputedDueDate(due.toISOString().split('T')[0]);
          setComputedDatesSummary(`LLP Form 11 is due by 30 May ${annualFY + 1} (60 days from FY end 31 March).`);
        } else {
          // Form 8 due 30 October
          const due = new Date(annualFY + 1, 9, 30);
          setComputedDueDate(due.toISOString().split('T')[0]);
          setComputedDatesSummary(`LLP Form 8 is due by 30 October ${annualFY + 1} (Statement of Solvency).`);
        }
      } else {
        // Company annual filing
        let isFirst = false;
        let agmDue = new Date(annualFY + 1, 8, 30); // Default 30 Sep

        if (incorpDate) {
          const inc = new Date(incorpDate);
          if (inc >= fyStart && inc <= fyEnd) {
            isFirst = true;
          }
          if (isFirst) {
            // First AGM: 9 months from first FY end
            agmDue = new Date(fyEnd);
            agmDue.setMonth(agmDue.getMonth() + 9);
          }
        }

        setIsFirstFY(isFirst);
        let finalDue = '';
        const agmFmt = agmDue.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        if (['MGT-7', 'MGT-7A'].includes(selectedFormName)) {
          // 60 days from AGM
          const mgtDue = new Date(agmDue);
          mgtDue.setDate(mgtDue.getDate() + 60);
          finalDue = mgtDue.toISOString().split('T')[0];
          setComputedDatesSummary(`AGM target: ${agmFmt} ${isFirst ? "(First FY)" : ""}. ${selectedFormName} due within 60 days from AGM held date. Proposed due date shown below as: ${mgtDue.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.`);
        } else {
          // AOC-4 variants: 30 days from AGM
          const aocDue = new Date(agmDue);
          aocDue.setDate(aocDue.getDate() + 30);
          finalDue = aocDue.toISOString().split('T')[0];
          setComputedDatesSummary(`AGM target: ${agmFmt} ${isFirst ? "(First FY)" : ""}. AOC-4 due within 30 days from AGM held date. Proposed due date shown below as: ${aocDue.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.`);
        }
        setComputedDueDate(finalDue);
      }
    } else if (activeFormObj.type === 'event') {
      // Event-based calculation
      setIsFirstFY(false);
      if (eventDate) {
        const ev = new Date(eventDate);
        const days = activeFormObj.eventDays || 30;
        const due = new Date(ev);
        due.setDate(due.getDate() + days);
        setComputedDueDate(due.toISOString().split('T')[0]);
        setComputedDatesSummary(`Statutory window: due within ${days} days from event date. Calculated due date is ${due.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.`);
      } else {
        setComputedDueDate('');
        setComputedDatesSummary("Enter triggering event date below to compute the statutory due date.");
      }
    } else {
      setIsFirstFY(false);
      setComputedDatesSummary("Manual calculation parameters active.");
    }
  }, [selectedFormName, annualFY, incorpDate, eventDate]);

  // CCFS eligibility checker
  useEffect(() => {
    if (!activeFormObj || !filingDate) return;

    const fDate = new Date(filingDate);
    const ccfsStart = new Date('2026-04-15');
    const ccfsEnd = new Date('2026-07-15');
    const inWindow = fDate >= ccfsStart && fDate <= ccfsEnd;
    const isEligible = activeFormObj.ccfs === 'ccfs2026' && entityType !== 'llp';

    if (inWindow && isEligible) {
      setCcfsStatus({
        active: true,
        label: "CCFS-2026 auto-applied! Filing date is inside the 15 Apr – 15 Jul 2026 window. Late additional fee is discounted by 90%.",
        type: 'success'
      });
    } else if (inWindow && !isEligible) {
      setCcfsStatus({
        active: false,
        label: `CCFS-2026 not applicable for ${selectedFormName}. LLP filings and specific event-based forms are fully excluded from the waiver scheme.`,
        type: 'warn'
      });
    } else {
      setCcfsStatus({ active: false, label: '', type: null });
    }
  }, [selectedFormName, filingDate, entityType]);

  const computeLateFees = () => {
    if (!computedDueDate || !filingDate || !activeFormObj) return;

    const due = new Date(computedDueDate);
    const filed = new Date(filingDate);

    if (filed <= due) {
      setCalcResult({
        onTime: true,
        delay: 0,
        normal: normalFee,
        additionalPayable: 0,
        total: normalFee,
        rawAdditional: 0,
        waiver: 0
      });
      return;
    }

    // Delay calculation
    const delayMs = filed.getTime() - due.getTime();
    const delayDays = Math.ceil(delayMs / (1000 * 60 * 60 * 24));

    let rawAdditional = 0;
    let explanation = '';

    if (activeFormObj.fixedFee) {
      rawAdditional = activeFormObj.flatAmt || 5000;
      explanation = `Fixed flat penalty: ₹${rawAdditional.toLocaleString('en-IN')}`;
    } else if (activeFormObj.flat) {
      const dailyRate = activeFormObj.flatAmt || 100;
      rawAdditional = dailyRate * delayDays;
      if (activeFormObj.msme) {
        rawAdditional = Math.min(rawAdditional, 2000);
        explanation = `₹100/day delay fee (capped at max ₹2,000 for MSME returns)`;
      } else {
        explanation = `₹${dailyRate}/day delay fee x ${delayDays} days`;
      }
    } else {
      // Multiplier schedule X rates
      let mult = 12;
      if (delayDays <= 30) mult = 2;
      else if (delayDays <= 60) mult = 4;
      else if (delayDays <= 90) mult = 6;
      else if (delayDays <= 180) mult = 10;

      rawAdditional = normalFee * mult;
      explanation = `${mult}x normal fee multiplier (Schedule X rate for ${delayDays} days delay)`;
    }

    // CCFS-2026 discount rules: pay normal fee + 10% of full additional fees (90% waived)
    const isCcfsActive = ccfsStatus.active;
    const additionalPayable = isCcfsActive ? Math.ceil(rawAdditional * 0.1) : rawAdditional;
    const waiver = isCcfsActive ? (rawAdditional - additionalPayable) : 0;
    const total = normalFee + additionalPayable;

    setCalcResult({
      onTime: false,
      delay: delayDays,
      normal: normalFee,
      rawAdditional,
      additionalPayable,
      waiver,
      total,
      explanation,
      isCcfsActive
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 leading-relaxed">
      {/* Parameter Entry: left */}
      <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 matches-left-border">
          <FileSpreadsheet className="w-4.5 h-4.5 shrink-0 text-blue-500" />
          {t.calcEntityHeading}
        </h3>

        {/* Entity Type selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {t.calcEntityType}
          </label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5 text-xs text-gray-750 dark:text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="company">{t.calcEntityCompany}</option>
            <option value="opc">{t.calcEntityOPC}</option>
            <option value="body_corp">{t.calcEntityCorp}</option>
            <option value="llp">{t.calcEntityLLP}</option>
          </select>
        </div>

        {/* Capital Slab selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {t.calcCapitalSlab}
          </label>
          <select
            value={capitalSlab}
            onChange={(e) => setCapitalSlab(parseInt(e.target.value))}
            className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5 text-xs text-gray-750 dark:text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="0">Up to ₹1,00,000 (No capital) — Fee: ₹200</option>
            <option value="1">₹1,00,001 to ₹4,99,999 — Fee: ₹300</option>
            <option value="2">₹5,00,000 to ₹24,99,999 — Fee: ₹400</option>
            <option value="3">₹25,00,000 to ₹99,99,999 — Fee: ₹500</option>
            <option value="4">₹1,00,00,000 to ₹4,99,99,999 — Fee: ₹600</option>
            <option value="5">₹5,00,00,000 and above — Fee: ₹600</option>
          </select>
        </div>

        {/* Form Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {t.calcFormReturn}
          </label>
          <select
            value={selectedFormName}
            onChange={(e) => setSelectedFormName(e.target.value)}
            className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5 text-xs text-gray-750 dark:text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {filteredForms.map(f => (
              <option key={f.form} value={f.form}>{f.form} &mdash; {f.desc}</option>
            ))}
          </select>
        </div>

        {/* Dynamic fields */}
        {activeFormObj && ['AOC-4', 'AOC-4 XBRL', 'AOC-4 CFS', 'AOC-4 NBFC', 'MGT-7', 'MGT-7A', 'LLP Form 8', 'LLP Form 11'].includes(selectedFormName) ? (
          <>
            {/* Financial Year Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {t.calcFYSel}
              </label>
              <select
                value={annualFY}
                onChange={(e) => setAnnualFY(parseInt(e.target.value))}
                className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5 text-xs text-gray-750 dark:text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {fyOptions.map(y => (
                  <option key={y} value={y}>FY {y}&ndash;{String(y + 1).slice(2)}</option>
                ))}
              </select>
            </div>

            {/* Incorporation date to auto calculate first AGM date */}
            {!selectedFormName.includes('LLP') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {t.calcIncorpDate}
                </label>
                <input
                  type="date"
                  value={incorpDate}
                  onChange={(e) => setIncorpDate(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-805 rounded-lg p-2.5 text-xs text-gray-750 dark:text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-gray-400 leading-snug">
                  {t.calcIncorpHint}
                </span>
              </div>
            )}
          </>
        ) : activeFormObj?.type === 'event' ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {t.calcEventDate}
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-850 rounded-lg p-2.5 text-xs text-gray-750 dark:text-gray-200 focus:border-blue-500"
            />
            <span className="text-[10px] text-gray-400">
              {t.calcEventHint}
            </span>
          </div>
        ) : null}

        {/* Due Date Display (computed) */}
        {computedDueDate && (
          <div className="p-3.5 bg-blue-50/50 border border-blue-150/40 rounded-lg dark:bg-blue-950/10 dark:border-blue-900/35 flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
              Suggested Due Date (Computed)
            </span>
            <span className="text-sm font-bold text-blue-900 dark:text-blue-300">
              {new Date(computedDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <p className="text-[10px] leading-relaxed text-gray-500 mt-1">
              {computedDatesSummary}
            </p>
          </div>
        )}

        {/* Filing Date selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {t.calcActualFilingDate}
          </label>
          <input
            type="date"
            value={filingDate}
            min={computedDueDate || undefined}
            onChange={(e) => setFilingDate(e.target.value)}
            className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-850 rounded-lg p-2.5 text-xs text-gray-750 dark:text-gray-200 focus:border-blue-500"
          />
        </div>

        {/* Normal Fee Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {t.calcNormalFee}
          </label>
          <input
            type="number"
            value={normalFee}
            onChange={(e) => setNormalFee(parseInt(e.target.value) || 0)}
            className="w-full bg-white dark:bg-neutral-905 border border-gray-200 dark:border-neutral-850 rounded-lg p-2.5 text-xs text-gray-750 dark:text-gray-200 focus:border-blue-500"
          />
          <span className="text-[10px] text-gray-400">
            {t.calcFeeHint}
          </span>
        </div>

        {/* CCFS Waiver Active Panel */}
        {ccfsStatus.label && (
          <div className={`p-3.5 rounded-lg border text-xs flex gap-2 items-start ${
            ccfsStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/35 dark:text-emerald-400'
              : 'bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/35 dark:text-amber-400'
          }`}>
            {ccfsStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            )}
            <p className="leading-relaxed leading-normal">{ccfsStatus.label}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={computeLateFees}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-lg text-xs tracking-wider cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            {t.calcButtonCompute}
          </button>
          <button
            onClick={() => {
              setIncorpDate('');
              setEventDate('');
              setFilingDate(new Date().toISOString().split('T')[0]);
              setCalcResult(null);
            }}
            className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-gray-750 dark:text-gray-300 font-bold rounded-lg text-xs cursor-pointer transition-colors"
          >
            {t.calcButtonReset}
          </button>
        </div>
      </div>

      {/* Computation results output: right */}
      <div className="lg:col-span-7">
        {!calcResult ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl min-h-[300px]">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-neutral-700 mb-3 animate-pulse" />
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
              {t.calcEmptyState}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-6 animate-fade-in">
            {/* Form Title banner */}
            <div className="border-b border-gray-100 dark:border-neutral-850 pb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-901 dark:text-white flex items-center gap-1.5 truncate max-w-[280px]">
                  {selectedFormName} &mdash; {activeFormObj?.desc}
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Filing delay parameters analyzed securely
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="p-1 px-3 border border-gray-200 dark:border-neutral-850 text-gray-500 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 dark:text-gray-400"
              >
                <Printer className="w-3.5 h-3.5" />
                {t.labelPrintPDF}
              </button>
            </div>

            {/* Alert status blocks */}
            {calcResult.onTime ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg dark:bg-emerald-950/20 dark:border-emerald-900/30 text-xs font-semibold leading-relaxed flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                Filing is on or before the due date. No late additional fees are credited.
              </div>
            ) : calcResult.isCcfsActive ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg dark:bg-emerald-950/20 dark:border-emerald-900/30 text-xs font-semibold leading-relaxed flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                CCFS-2026 scheme successfully computed! Additional fee has been slashed by 90%. Full immunity applies.
              </div>
            ) : null}

            {/* Metric counters */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50/50 dark:bg-neutral-850/40 p-3 rounded-lg border border-gray-150/40 dark:border-neutral-800/80">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                  {t.labelDelay}
                </span>
                <span className={`text-xl font-extrabold mt-1 block truncate ${calcResult.delay > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {calcResult.delay} Days
                </span>
              </div>
              <div className="bg-gray-50/50 dark:bg-neutral-850/40 p-3 rounded-lg border border-gray-150/40 dark:border-neutral-800/80">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                  {t.labelAdditionalPayable}
                </span>
                <span className="text-xl font-extrabold text-rose-500 mt-1 block truncate">
                  ₹{calcResult.additionalPayable.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-blue-50/20 dark:bg-neutral-850/40 p-3 rounded-lg border border-blue-100/50 dark:border-neutral-800/80">
                <span className="text-[9px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                  Final Amount Due
                </span>
                <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block truncate">
                  ₹{calcResult.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Detailed breakdowns list */}
            <div>
              <h5 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2.5">
                {t.labelDetailBreakdown}
              </h5>
              <ul className="space-y-2.5 text-xs text-gray-650 dark:text-gray-300">
                <li className="flex justify-between items-center py-1.5 border-b border-gray-100/80 dark:border-neutral-850">
                  <span className="font-medium text-gray-500">Statutory Due Date</span>
                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                    {new Date(computedDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </li>
                <li className="flex justify-between items-center py-1.5 border-b border-gray-100/80 dark:border-neutral-850">
                  <span className="font-medium text-gray-500">Target Filing Date</span>
                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                    {new Date(filingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </li>
                <li className="flex justify-between items-center py-1.5 border-b border-gray-100/80 dark:border-neutral-850">
                  <span className="font-medium text-gray-500">Total Counted delay</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {calcResult.delay} days
                  </span>
                </li>
                <li className="flex justify-between items-center py-1.5 border-b border-gray-100/80 dark:border-neutral-850">
                  <span className="font-medium text-gray-500">Normal Filing Fee (Sched XV)</span>
                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                    ₹{calcResult.normal.toLocaleString('en-IN')}
                  </span>
                </li>
                {!calcResult.onTime && (
                  <>
                    <li className="flex justify-between items-center py-1.5 border-b border-gray-100/80 dark:border-neutral-850">
                      <span className="font-medium text-gray-500 flex items-center gap-1.5">
                        Accumulated Additional Late Fee
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-normal normal-case italic">
                          ({calcResult.explanation})
                        </span>
                      </span>
                      <span className={`font-mono font-semibold text-gray-800 dark:text-gray-200 ${calcResult.waiver > 0 ? 'line-through text-gray-400' : ''}`}>
                        ₹{calcResult.rawAdditional.toLocaleString('en-IN')}
                      </span>
                    </li>
                    {calcResult.waiver > 0 && (
                      <li className="flex justify-between items-center py-1.5 border-b border-gray-100/80 dark:border-neutral-850 text-emerald-600 dark:text-emerald-400 font-medium">
                        <span>CCFS-2026 90% Waiver Credit</span>
                        <span className="font-mono font-bold">
                          - ₹{calcResult.waiver.toLocaleString('en-IN')}
                        </span>
                      </li>
                    )}
                    <li className="flex justify-between items-center py-1.5 border-b border-gray-100/80 dark:border-neutral-850">
                      <span className="font-medium text-gray-500">Net Additional Late Fee Payable</span>
                      <span className="font-mono font-bold text-rose-500">
                        ₹{calcResult.additionalPayable.toLocaleString('en-IN')}
                      </span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Total Block Panel */}
            <div className="p-4 bg-blue-600 text-white rounded-lg flex items-center justify-between dark:bg-blue-500">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                  Total Fees Payable
                </span>
                <span className="text-[10px] block opacity-50 mt-0.5 leading-snug">
                  Normal Fee + Net Additional Fee
                </span>
              </div>
              <span className="text-2xl font-extrabold tracking-tight">
                ₹{calcResult.total.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Legal footnotes */}
            <p className="text-[10px] text-gray-450 dark:text-gray-500 italic leading-relaxed pt-2 border-t border-dashed border-gray-100 dark:border-neutral-800">
              * Legal disclaimer: This due-date calculation engine is simulated based on Schedule X of the Companies Act 2013 and standard LLP Rules 2009. Kindly verify with live portal criteria before final payment transmission.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
