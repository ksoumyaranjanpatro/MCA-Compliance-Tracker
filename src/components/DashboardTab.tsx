/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertTriangle, Clock, Calendar, CheckCircle2, Factory, ShieldAlert, FileText, PieChart as ChartIcon, CheckSquare } from 'lucide-react';
import { Company, AppLanguage } from '../types';
import { TRANSLATIONS } from '../i18n';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface DashboardTabProps {
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
  lang: AppLanguage;
  onNavigateToTab: (tab: string) => void;
  onSelectCompany: (idx: number) => void;
  onSimulateCritical?: () => void;
}

export default function DashboardTab({
  companies,
  pendingItems: originalPendingItems,
  lang,
  onNavigateToTab,
  onSelectCompany,
  onSimulateCritical
}: DashboardTabProps) {
  const t = TRANSLATIONS[lang];

  // Get current financial year label (e.g. "FY 2026–27" for 2026)
  const todayDate = new Date();
  const currentFYEndingYear = todayDate.getMonth() >= 3 ? todayDate.getFullYear() + 1 : todayDate.getFullYear();
  const currentFYLabel = `FY ${currentFYEndingYear - 1}–${String(currentFYEndingYear).slice(2)}`;

  // Filter out current financial year's forms as requested by the user
  const pendingItems = originalPendingItems.filter(item => item.fyL !== currentFYLabel);

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl shadow-xs min-h-[350px]">
        <div className="w-16 h-16 bg-blue-50 dark:bg-neutral-800/40 rounded-full flex items-center justify-center text-blue-500 mb-4 animate-pulse">
          <Factory className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-gray-901 dark:text-white mb-2">
          {t.dashNoCompaniesTitle}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-5 leading-relaxed">
          {t.dashNoCompaniesText}
        </p>
        <button
          onClick={() => onNavigateToTab('tracker')}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          Add Your First Company Now &rarr;
        </button>
      </div>
    );
  }

  const overdue = pendingItems.filter(i => i.diff < 0).sort((a, b) => a.diff - b.diff);
  const due7 = pendingItems.filter(i => i.diff >= 0 && i.diff <= 7).sort((a, b) => a.diff - b.diff);
  const due30 = pendingItems.filter(i => i.diff > 7 && i.diff <= 30).sort((a, b) => a.diff - b.diff);

  const totalCompaniesCount = companies.length;

  const isHealthy = pendingItems.length === 0;
  const overdueCount = overdue.length;
  const ongoingCount = due7.length;
  const upcomingCount = pendingItems.length - overdueCount - ongoingCount;

  const chartData = [
    { name: 'Overdue', value: overdueCount, color: '#ef4444' },
    { name: 'Ongoing / Critical', value: ongoingCount, color: '#f59e0b' },
    { name: 'Upcoming', value: upcomingCount > 0 ? upcomingCount : 0, color: '#3b82f6' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Bento Grid Top Level Analytics Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Companies */}
        <div className="bg-white dark:bg-neutral-905 border border-gray-150 dark:border-neutral-800/60 p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
            {t.dashTotalCompanies}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-gray-901 dark:text-white leading-none">
              {totalCompaniesCount}
            </span>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-neutral-905 border border-gray-150 dark:border-neutral-800/60 p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
            {t.dashOverdueFilings}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-extrabold leading-none ${overdue.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {overdue.length}
            </span>
          </div>
        </div>

        {/* Due 7 Days */}
        <div className="bg-white dark:bg-neutral-905 border border-gray-150 dark:border-neutral-800/60 p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
            {t.dashDue7Days}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-extrabold leading-none ${due7.length > 0 ? 'text-amber-500' : 'text-gray-400 dark:text-neutral-600'}`}>
              {due7.length}
            </span>
          </div>
        </div>

        {/* Due 30 Days */}
        <div className="bg-white dark:bg-neutral-905 border border-gray-150 dark:border-neutral-800/60 p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
            {t.dashDue30Days}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-blue-500 leading-none">
              {due30.length}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Alerts Bento Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Distribution Pie Chart */}
        <div className="bg-white dark:bg-neutral-905 border border-gray-150 dark:border-neutral-800/60 p-5 rounded-xl shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-gray-901 dark:text-white uppercase tracking-wider block">
                Filing Distribution
              </h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">
                Proportion of regulatory items by urgency levels
              </p>
            </div>
            {onSimulateCritical && (
              <button
                onClick={onSimulateCritical}
                title="Simulate transition to critical (expiring in 5 days) to fire device push warning"
                className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1.5 bg-blue-50 hover:bg-blue-105 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-150 dark:border-neutral-700 cursor-pointer transition-colors shrink-0"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                Demo Push
              </button>
            )}
          </div>

          <div className="relative flex items-center justify-center h-44 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={isHealthy ? [{ name: 'Fully Compliant', value: 1, color: '#10b981' }] : chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={isHealthy ? 0 : 3}
                  dataKey="value"
                >
                  {(isHealthy ? [{ name: 'Fully Compliant', value: 1, color: '#10b981' }] : chartData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc'
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-extrabold text-gray-901 dark:text-white leading-none">
                {isHealthy ? '100%' : pendingItems.length}
              </span>
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
                {isHealthy ? 'Compliant' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Mini-Legend indicators */}
          <div className="grid grid-cols-3 gap-1 border-t border-gray-150 dark:border-neutral-850 pt-3 text-[10px] mt-1 font-bold">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span className="text-gray-400 dark:text-gray-500">Overdue</span>
              </div>
              <span className="text-xs font-extrabold text-rose-500 mt-0.5">{overdue.length}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="text-gray-400 dark:text-gray-500">Ongoing</span>
              </div>
              <span className="text-xs font-extrabold text-amber-500 mt-0.5">{due7.length}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span className="text-gray-400 dark:text-gray-500">Upcoming</span>
              </div>
              <span className="text-xs font-extrabold text-blue-500 mt-0.5">
                {pendingItems.length - overdue.length - due7.length}
              </span>
            </div>
          </div>
        </div>

        {/* Global Status Banner Alert (Occupies remaining columns) */}
        <div className="lg:col-span-2 flex flex-col justify-stretch">
          {overdue.length > 0 ? (
            <div className="p-5 h-full bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex flex-col justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5.5 h-5.5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-rose-800 dark:text-rose-450 uppercase tracking-widest">
                    Critical Warning: Accumulated Delays Detected
                  </h4>
                  <p className="text-xs text-rose-700 dark:text-rose-350 mt-1.5 leading-relaxed font-medium">
                    {overdue.length} regulatory filings are currently overdue across your verified list of companies. Delayed documentation incurs compound multipliers &amp; additional penalties under Section 403.
                  </p>
                </div>
              </div>

              <div className="bg-white/40 dark:bg-neutral-900/40 p-3.5 rounded-lg border border-rose-100/30 dark:border-rose-950/50">
                <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Estimated Impact</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-normal">
                  Filing delays of important accounts block critical board approvals, prevent new share issues, and expose Directors to potential deactivation of DIN tags under ROC rules.
                </p>
              </div>

              <button
                onClick={() => onNavigateToTab('tracker')}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center"
              >
                Resolve Pending Filings Right Now &rarr;
              </button>
            </div>
          ) : due7.length > 0 ? (
            <div className="p-5 h-full bg-amber-50/55 dark:bg-amber-950/15 border border-amber-100 dark:border-amber-900/30 rounded-xl flex flex-col justify-between gap-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5.5 h-5.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-amber-800 dark:text-amber-450 uppercase tracking-widest">
                    Milestone Clock: 7-Day Action Window
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-350 mt-1.5 leading-relaxed font-bold">
                    You have {due7.length} filing deadline(s) approaching this week. Finalize accounts, submit minutes, and secure digital signatures.
                  </p>
                </div>
              </div>

              <div className="bg-white/40 dark:bg-neutral-900/40 p-3.5 rounded-lg border border-amber-100/30 dark:border-amber-950/50">
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Preparation Step</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-normal">
                  Ensure authorized signatories have updated digital signature certificates (DSCs) and active V3 MCA logins to prevent submission failures on the cut-off dates.
                </p>
              </div>

              <button
                onClick={() => onNavigateToTab('calendar')}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center"
              >
                Inspect Calendar Agenda &rarr;
              </button>
            </div>
          ) : (
            <div className="p-5 h-full bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex flex-col justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-emerald-800 dark:text-emerald-450 uppercase tracking-widest">
                    Registry Status: 100% Compliant
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-350 mt-1.5 leading-relaxed font-semibold">
                    Superb job! All corporate filings, annual statements, and event tasks are successfully submitted inside target timelines.
                  </p>
                </div>
              </div>

              <div className="bg-white/40 dark:bg-neutral-900/40 p-3.5 rounded-lg border border-emerald-100/30 dark:border-emerald-950/50">
                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Continuous Check</span>
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1 leading-normal">
                  The Compliance Tracker automatically reviews incorporation anniversary dates and registers dynamic annual schedules. You will be notified instantly when new filings appear.
                </p>
              </div>

              <button
                onClick={() => onNavigateToTab('forms')}
                className="w-full py-2.5 bg-neutral-950 text-white hover:bg-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center border border-neutral-700"
              >
                Browse Regulatory Form Guides &rarr;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tiers Lists */}
      <div className="space-y-6">
        {/* Tier 1: Overdue */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 bg-rose-50/10 border-b border-gray-150 dark:border-neutral-800 dark:bg-rose-950/5 flex items-center justify-between">
            <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {t.dashOverdueHeader} ({overdue.length})
            </span>
          </div>
          <div className="p-4">
            {overdue.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">{t.dashNoFilingsCategory}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {overdue.map(item => (
                  <ComplianceCard
                    key={item.key}
                    item={item}
                    lang={lang}
                    onSelectCompany={onSelectCompany}
                    onNavigateToTab={onNavigateToTab}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tier 2: 7-Days Window */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 bg-amber-50/10 border-b border-gray-150 dark:border-neutral-800 dark:bg-amber-950/5 flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 shrink-0" />
              {t.dashDue7Header} ({due7.length})
            </span>
          </div>
          <div className="p-4">
            {due7.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">{t.dashNoFilingsCategory}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {due7.map(item => (
                  <ComplianceCard
                    key={item.key}
                    item={item}
                    lang={lang}
                    onSelectCompany={onSelectCompany}
                    onNavigateToTab={onNavigateToTab}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tier 3: 30-Days Window */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 bg-blue-50/10 border-b border-gray-150 dark:border-neutral-800 dark:bg-blue-950/5 flex items-center justify-between">
            <span className="text-xs font-extrabold text-blue-600 dark:text-blue-450 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 shrink-0" />
              {t.dashDue30Header} ({due30.length})
            </span>
          </div>
          <div className="p-4">
            {due30.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">{t.dashNoFilingsCategory}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {due30.map(item => (
                  <ComplianceCard
                    key={item.key}
                    item={item}
                    lang={lang}
                    onSelectCompany={onSelectCompany}
                    onNavigateToTab={onNavigateToTab}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inner helper card for item metrics
function ComplianceCard({
  item,
  lang,
  onSelectCompany,
  onNavigateToTab
}: {
  key?: string;
  item: {
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
  };
  lang: AppLanguage;
  onSelectCompany: (idx: number) => void;
  onNavigateToTab: (tab: string) => void;
}) {
  const isOverdue = item.diff < 0;
  const daysDiff = Math.abs(item.diff);
  const dueLabel = isOverdue
    ? `Overdue by ${daysDiff} day${daysDiff === 1 ? '' : 's'}`
    : item.diff === 0
    ? 'Due TODAY'
    : `Due in ${daysDiff} day${daysDiff === 1 ? '' : 's'}`;

  const borderCls = isOverdue
    ? 'border-rose-200/50 hover:border-rose-400 dark:border-rose-950/50 dark:hover:border-rose-800'
    : item.diff <= 7
    ? 'border-amber-200/50 hover:border-amber-400 dark:border-amber-950/50 dark:hover:border-amber-800'
    : 'border-blue-100 hover:border-blue-300 dark:border-neutral-800 dark:hover:border-neutral-750';

  const badgeCls = isOverdue
    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
    : item.diff === 0
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 animate-pulse'
    : item.diff <= 7
    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
    : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400';

  const fDate = item.r.dueDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div
      onClick={() => {
        onSelectCompany(item.ci);
        onNavigateToTab('tracker');
      }}
      className={`p-3.5 bg-white dark:bg-neutral-905 border rounded-lg shadow-2xs hover:shadow-xs transition-all relative flex flex-col justify-between h-32 text-left cursor-pointer group ${borderCls}`}
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-gray-901 dark:text-white flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0" />
            {item.r.form}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>
            {dueLabel}
          </span>
        </div>
        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate mt-1.5">
          {item.c.name}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
          {item.r.desc} &middot; {item.fyL}
        </p>
      </div>

      <div className="flex justify-between items-center border-t border-gray-100/50 dark:border-neutral-800 pt-2 mt-2">
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
          Limit Date
        </span>
        <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
          {fDate}
        </span>
      </div>
    </div>
  );
}
