/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileText, ShieldAlert, Award, AlertTriangle, Layers, BookOpen, Check } from 'lucide-react';
import { AppLanguage } from '../types';
import { TRANSLATIONS } from '../i18n';

interface GuideTabProps {
  lang: AppLanguage;
}

export default function GuideTab({ lang }: GuideTabProps) {
  const t = TRANSLATIONS[lang];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 leading-relaxed items-start text-left">
      {/* Column 1: Multiplier Slabs & CCFS Details */}
      <div className="space-y-6">
        {/* Schedule X Multiplier Rates */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-extrabold text-blue-750 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 matches-left-border">
            <Layers className="w-5 h-5 text-blue-500 shrink-0" />
            Schedule X Multiplier Slabs (Event-Based Forms)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            For event-based filings (such as DIR-12, INC-22, PAS-3, CHG-4, ADT-1), additional filing fees are determined as a multiplier of the normal registration fee depending on the delay duration.
          </p>

          <div className="overflow-x-auto border border-gray-100 dark:border-neutral-850 rounded-lg shadow-3xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-neutral-850 text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-gray-150 dark:border-neutral-800">
                <tr>
                  <th className="p-3">Filing Delay Duration</th>
                  <th className="p-3">Fee Multiplier</th>
                  <th className="p-3 text-right">Example (Normal Fee: ₹500)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-850">
                <tr>
                  <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">Up to 30 days</td>
                  <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">2x Normal Fee</td>
                  <td className="p-3 text-right font-mono font-bold text-gray-600 dark:text-gray-400">+ ₹1,000</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">31 to 60 days</td>
                  <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">4x Normal Fee</td>
                  <td className="p-3 text-right font-mono font-bold text-gray-600 dark:text-gray-400">+ ₹2,000</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">61 to 90 days</td>
                  <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">6x Normal Fee</td>
                  <td className="p-3 text-right font-mono font-bold text-gray-600 dark:text-gray-400">+ ₹3,000</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">91 to 180 days</td>
                  <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">10x Normal Fee</td>
                  <td className="p-3 text-right font-mono font-bold text-gray-600 dark:text-gray-400">+ ₹5,000</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">Beyond 180 days</td>
                  <td className="p-3 font-semibold text-rose-500">12x Normal Fee</td>
                  <td className="p-3 text-right font-mono font-bold text-rose-550 dark:text-rose-450">+ ₹6,000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <span className="text-[10px] text-gray-405 leading-snug block mt-1">
            * Source: Companies (Registration Offices and Fees) Rules 2014, Schedule X. Normal fee is fully payable in addition to the computed multiplier penalty.
          </span>
        </div>

        {/* CCFS-2026 Core Pillars */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-extrabold text-blue-750 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 matches-left-border">
            <Award className="w-5 h-5 text-emerald-500 shrink-0" />
            Condonation of Delay Scheme — CCFS-2026
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            The Ministry of Corporate Affairs introduced the <strong>Company Condonation of Delay Scheme (CCFS-2026)</strong> via General Circular 01/2026 to offer a massive compliance window for companies struggling with accrued legacy late penalties.
          </p>

          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg dark:bg-emerald-950/20 dark:border-emerald-900/35 space-y-3.5 text-xs text-emerald-850 dark:text-emerald-400">
            <div className="flex gap-2.5">
              <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                <strong>90% Waiver Credit:</strong> Satisfy filings by paying the normal government filing fee plus only <strong>10%</strong> of the accumulated multiplier penalty. 90% is waived.
              </p>
            </div>
            <div className="flex gap-2.5">
              <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                <strong>Full Legal Immunity:</strong> Successful filing under the CCFS-2026 window grants directors full immunity from prosecution and compounding proceedings related to the specific delayed documents.
              </p>
            </div>
            <div className="flex gap-2.5">
              <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                <strong>Covered Forms:</strong> Includes key annual files (AOC-4 standing standalone/XBRL, MGT-7, MGT-7A) and major event-based appointment returns like ADT-1.
              </p>
            </div>
            <div className="flex gap-2.5">
              <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                <strong>Exclusions:</strong> Companies currently under strike-off proceedings (Section 248), vanishing shell status, and ALL LLPs are structurally excluded.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Legal Disqualifications & OPC/LLP Exceptions */}
      <div className="space-y-6">
        {/* Director Disqualification Section 164(2) */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-extrabold text-blue-750 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 matches-left-border">
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
            Director Disqualification Hazards (Section 164(2))
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Filing delay is not merely a financial cost; chronic default triggers devastating administrative outcomes under Section 164 of the Companies Act 2013.
          </p>

          <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-lg dark:bg-rose-950/20 dark:border-rose-900/35 space-y-3.5 text-xs text-rose-800 dark:text-rose-400 leading-normal">
            <div className="flex gap-2 shrink-0">
              <span className="font-extrabold text-rose-500 transform scale-110">⚠️</span>
              <p>
                <strong>The 3-Year Trigger:</strong> If a company fails to file its annual accounts (AOC-4) or annual returns (MGT-7/7A) for any <strong>three consecutive financial years</strong>, all directors are immediately disqualified.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <span className="font-extrabold text-rose-500 transform scale-110">⚠️</span>
              <p>
                <strong>5-Year Global Vacation:</strong> Upon disqualification, the directors vacate office immediately across all companies under Section 167(1)(a) and are strictly barred from re-appointment or incorporation roles for a period of <strong>five years</strong>.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <span className="font-extrabold text-rose-500 transform scale-110">⚠️</span>
              <p>
                <strong>DIN Deactivation:</strong> Director Identification Numbers (DIN) are deactivated on the central directory, locking the individual from authenticating corporate documents on any public registry.
              </p>
            </div>
          </div>
        </div>

        {/* Special Entity Directives: OPC & LLP */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-extrabold text-blue-750 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 matches-left-border">
            <BookOpen className="w-5 h-5 text-gray-500 shrink-0" />
            Special Entity Directives (OPC &amp; LLP)
          </h3>

          <div className="space-y-4 text-xs">
            {/* OPC */}
            <div className="space-y-1 bg-gray-50/40 p-3.5 rounded-lg border border-gray-100 dark:bg-neutral-850/40 dark:border-neutral-800">
              <span className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                One Person Company (OPC) Relaxations
              </span>
              <p className="text-gray-650 dark:text-gray-300 leaders-leading mt-1 text-xs">
                OPCs are exempt from holding Annual General Meetings (AGMs) under Section 96. Consequently, their deadlines are computed strictly relative to the financial year closure date (31 March):
              </p>
              <ul className="list-disc pl-4 text-gray-500 text-[11.5px] space-y-1 block mt-1.5 list-custom-paddings">
                <li>Form MGT-7A is due by 30 May (60 days from FY end).</li>
                <li>Form AOC-4 is due by 27 September (180 days from FY end).</li>
              </ul>
            </div>

            {/* LLP */}
            <div className="space-y-1 bg-gray-50/40 p-3.5 rounded-lg border border-gray-100 dark:bg-neutral-850/40 dark:border-neutral-800">
              <span className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Limited Liability Partnership (LLP) Guidelines
              </span>
              <p className="text-gray-650 dark:text-gray-300 mt-1">
                LLPs operate under the separate LLP Act 2008 and are not covered under CCFS-2026. Delays incur a continuing penalty of ₹100 per day with no upper cap.
              </p>
              <ul className="list-disc pl-4 text-gray-500 text-[11.5px] space-y-1 block mt-1.5 list-custom-paddings">
                <li>Form 11 (Annual Return) is due by 30 May (60 days from FY end).</li>
                <li>Form 8 (Statement of Accounts &amp; Solvency) is due by 30 October.</li>
                <li>Rule 24(8) audit is triggered when contributions exceed ₹25 lakh or turnover exceeds ₹40 lakh.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
