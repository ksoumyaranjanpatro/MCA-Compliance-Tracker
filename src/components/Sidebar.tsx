/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutGrid, Calculator, Calendar, Building2, BookOpen, FileText, Globe, Sun, Moon, Database, LogIn, LogOut, CheckCircle, Bell } from 'lucide-react';
import { AppLanguage, EntityType } from '../types';
import { TRANSLATIONS } from '../i18n';
import { isFirebaseReady, auth } from '../firebase';
import { User } from 'firebase/auth';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  lang: AppLanguage;
  onLangChange: (lang: AppLanguage) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  lang,
  onLangChange,
  theme,
  onThemeToggle,
  user,
  onLogin,
  onLogout,
  isSidebarOpen,
  onCloseSidebar
}: SidebarProps) {
  const t = TRANSLATIONS[lang];

  const menuItems = [
    { id: 'dashboard', label: t.navDashboard, icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'calc', label: t.navCalculator, icon: <Calculator className="w-4 h-4" /> },
    { id: 'calendar', label: t.navCalendar, icon: <Calendar className="w-4 h-4" /> },
    { id: 'tracker', label: t.navTracker, icon: <Building2 className="w-4 h-4" /> },
    { id: 'mca-notifs', label: t.navNotifications, icon: <Bell className="w-4 h-4" /> },
    { id: 'forms', label: t.navReference, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'guide', label: t.navFeeGuide, icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Drawer Overlay for all screen sizes (Mobile, Tablet, and Desktop) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
          onClick={onCloseSidebar}
        />
      )}

      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 p-5 transition-transform duration-300 ease-out h-full shadow-2xl ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand details header with close option */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <h2 className="text-base font-bold text-gray-901 dark:text-white leading-tight uppercase tracking-tight">
                {t.appName}
              </h2>
            </div>
            <p className="text-[11px] text-gray-400 font-medium tracking-wider uppercase">
              Acts of 2013 &amp; 2008
            </p>
          </div>

          <button
            onClick={onCloseSidebar}
            className="p-1 px-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-150 dark:hover:bg-neutral-800 text-sm font-bold cursor-pointer transition-colors"
            title="Close menu drawer"
          >
            ✕
          </button>
        </div>

        {/* Database Storage Synchronisation Panel */}
        <div className="mb-4 bg-gray-50 dark:bg-neutral-800/40 p-3.5 rounded-lg border border-gray-200/50 dark:border-neutral-850 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider">
            <Database className="w-3.5 h-3.5 text-blue-500" />
            {t.navStorageLabel}
          </div>
          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 font-semibold flex items-center gap-1">
            {isFirebaseReady ? (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 block animate-pulse" />
                {t.navCloudSyncing}
              </>
            ) : (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 block" />
                {t.navLocalSyncing}
              </>
            )}
          </p>

          {/* User auth controls if Firebase is connected */}
          {isFirebaseReady && (
            <div className="mt-1 pt-2 border-t border-gray-200/50 dark:border-neutral-800">
              {user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Avatar"
                        className="w-6 h-6 rounded-full referrer-attr"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                        {user.displayName?.charAt(0) || "U"}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[150px]">
                      {user.displayName || user.email}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="text-xs font-bold text-gray-550 hover:text-rose-500 dark:text-gray-400 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> {t.authLogout}
                  </button>
                </div>
              ) : (
                <button
                  onClick={onLogin}
                  className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold cursor-pointer transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {t.authLogin}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {menuItems.map(item => {
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onCloseSidebar();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer hover:translate-x-1.5 ${
                  isSelected
                    ? 'bg-neutral-950 text-white border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50 dark:border-neutral-700 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/35 border-transparent'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Controls: Theme & Language Selection */}
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
          {/* Language selection panel */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              {t.langSelect}
            </span>
            <div className="grid grid-cols-3 gap-1 bg-gray-50 dark:bg-neutral-800 p-0.5 rounded-lg border border-gray-100 dark:border-neutral-700/50">
              {(['en', 'hi', 'ta'] as AppLanguage[]).map(l => (
                <button
                  key={l}
                  onClick={() => onLangChange(l)}
                  className={`text-[10px] font-bold py-1.5 rounded-md text-center cursor-pointer transition-colors ${
                    lang === l
                      ? 'bg-white dark:bg-neutral-900 border border-gray-200/50 dark:border-neutral-700/80 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-gray-550 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {l === 'en' ? 'EN' : l === 'hi' ? 'हिंदी' : 'தமிழ்'}
                </button>
              ))}
            </div>
          </div>

          {/* Theme selection panel */}
          <button
            onClick={onThemeToggle}
            className="w-full flex items-center justify-between text-xs font-semibold px-3 py-2 bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-750 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer border border-gray-100 dark:border-neutral-700/30 transition-colors"
          >
            <span className="flex items-center gap-2">
              {theme === 'light' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500" />
                  {t.themeLight}
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-400" />
                  {t.themeDark}
                </>
              )}
            </span>
            <span className="text-[10px] font-bold uppercase text-gray-400">Toggle</span>
          </button>

          {/* CCFS Waiver Card */}
          <div className="p-3 bg-gradient-to-br from-blue-50/70 to-blue-200/20 dark:from-neutral-850 dark:to-neutral-900/40 rounded-lg border border-blue-100 dark:border-blue-900/30 flex flex-col gap-1.5 text-left">
            <span className="text-[10px] font-extrabold text-blue-800 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              {t.ccfsHeader}
            </span>
            <span className="text-xs font-extrabold text-gray-901 dark:text-white">
              {t.ccfsWaiver}
            </span>
            <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
              15 Apr – 15 Jul 2026. Covers MGT-7, AOC-4, ADT-1. LLPs excluded.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
