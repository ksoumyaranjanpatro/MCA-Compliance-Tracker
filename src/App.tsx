/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Menu, Search, AlertCircle, Sparkles, LogIn, LogOut, CheckCircle2, CloudLightning } from 'lucide-react';

// Core Firebases
import {
  db,
  auth,
  isFirebaseReady,
  loginWithGoogle,
  logoutUser,
  handleFirestoreError,
  OperationType
} from './firebase';

import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';

// Types & i18n
import { Company, NotificationItem, AppLanguage, FormRef } from './types';
import { TRANSLATIONS } from './i18n';
import { FORMS } from './data/forms';
import { getAllFYs, getFYLabel, generateComplianceRows } from './utils/dateRules';

// Components
import Sidebar from './components/Sidebar';
import NotificationCenter from './components/NotificationCenter';
import FormsDetailModal from './components/FormsDetailModal';
import DashboardTab from './components/DashboardTab';
import CalculatorTab from './components/CalculatorTab';
import CalendarTab from './components/CalendarTab';
import TrackerTab from './components/TrackerTab';
import FormsTab from './components/FormsTab';
import GuideTab from './components/GuideTab';
import McaNotifsTab from './components/McaNotifsTab';
import GlobalSearch from './components/GlobalSearch';

export default function App() {
  // Navigation & Preferences State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [lang, setLang] = useState<AppLanguage>(() => {
    return (localStorage.getItem('mca_lang') as AppLanguage) || 'en';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('mca_theme') as 'light' | 'dark') || 'dark';
  });

  // Auth & Cloud State
  const [user, setUser] = useState<any | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyIdx, setSelectedCompanyIdx] = useState<number | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modals & UI Toggles
  const [isFDModalOpen, setIsFDModalOpen] = useState<boolean>(false);
  const [selectedFormDetailName, setSelectedFormDetailName] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Sync Global Theme HTML tag
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mca_theme', theme);
  }, [theme]);

  // Handle Firebase User State Changes
  useEffect(() => {
    if (isFirebaseReady && auth) {
      const unsubscribe = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
      }, (err) => {
        console.error("Auth state error", err);
      });
      return unsubscribe;
    }
  }, []);

  // Subscribe to Companies Real-time synchronization
  useEffect(() => {
    if (isFirebaseReady && db && user) {
      const q = query(collection(db, "companies"), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched: Company[] = [];
          snapshot.forEach((docSnap) => {
            fetched.push({ id: docSnap.id, ...docSnap.data() } as Company);
          });
          // Sort alphabetically
          fetched.sort((a,b) => a.name.localeCompare(b.name));
          setCompanies(fetched);
          if (fetched.length > 0 && selectedCompanyIdx === null) {
            setSelectedCompanyIdx(0);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, "companies");
        }
      );
      return unsubscribe;
    } else {
      // Local fallbacks
      try {
        const local = localStorage.getItem('mca_companies_v5');
        if (local) {
          const parsed = JSON.parse(local) as Company[];
          parsed.sort((a,b) => a.name.localeCompare(b.name));
          setCompanies(parsed);
          if (parsed.length > 0 && selectedCompanyIdx === null) {
            setSelectedCompanyIdx(0);
          }
        } else {
          // SEED DUMMY COMPANIES FOR AN EXTRAORDINARY OUT-OF-THE-BOX LOOK & PLAYGROUND EXPERIENCE
          const bootstrapSeed: Company[] = [
            {
              name: 'TATA CONSULTANCY SERVICES LTD',
              cin: 'L72200MH1995PLC090091',
              type: 'pub',
              capital: 3660000000,
              isSmall: false,
              incorp: '1995-01-18',
              lastAGMDate: '2025-06-15',
              opcLastFY: '',
              llpLastForm11Date: '',
              llpLastForm8Date: '',
              filedStatus: {
                'L72200MH1995PLC090091_FY 2024–25_AOC-4': true,
                'L72200MH1995PLC090091_FY 2024–25_MGT-7': true,
              },
              customForms: [
                { id: 'custom_1', form: 'CHG-1', desc: 'Charge Creation - SBI Bank Loan', eventDate: '2026-05-10', days: 30, dueDate: '2026-06-09' }
              ],
              savedAt: '2026-06-09T04:45:14Z'
            },
            {
              name: 'RELIANCE INDUSTRIES LIMITED',
              cin: 'L17110MH1973PLC019786',
              type: 'pub',
              capital: 67650000000,
              isSmall: false,
              incorp: '1973-05-08',
              lastAGMDate: '2025-08-29',
              opcLastFY: '',
              llpLastForm11Date: '',
              llpLastForm8Date: '',
              filedStatus: {
                'L17110MH1973PLC019786_FY 2024–25_AOC-4': true
              },
              customForms: [],
              savedAt: '2026-06-09T04:45:14Z'
            },
            {
              name: 'ACME DIGITAL SERVICES LLP',
              cin: 'AAB-9988',
              type: 'llp',
              capital: 1500000,
              isSmall: false,
              incorp: '2021-11-05',
              lastAGMDate: '',
              opcLastFY: '',
              llpLastForm11Date: '2025-05-20',
              llpLastForm8Date: '2025-10-18',
              filedStatus: {},
              customForms: [],
              savedAt: '2026-06-09T04:45:14Z'
            }
          ];
          localStorage.setItem('mca_companies_v5', JSON.stringify(bootstrapSeed));
          setCompanies(bootstrapSeed);
          setSelectedCompanyIdx(0);
        }
      } catch (e) {
        console.warn("Local storage retrieval failed", e);
      }
    }
  }, [user]);

  // Unified State Modifiers
  const handleSaveCompany = async (payload: Company, editIndex: number | null) => {
    let targetId = payload.id;

    if (isFirebaseReady && db && user) {
      try {
        // Enforce cloud security structure
        const docRef = editIndex !== null && payload.id
          ? doc(db, "companies", payload.id)
          : doc(collection(db, "companies"));

        const dataToSave = {
          ...payload,
          id: docRef.id,
          userId: user.uid,
          updatedAt: new Date().toISOString()
        };

        await setDoc(docRef, dataToSave);
      } catch (e: any) {
        handleFirestoreError(e, OperationType.WRITE, "companies");
      }
    } else {
      // Offline fallback state update
      const clone = [...companies];
      if (editIndex !== null) {
        clone[editIndex] = payload;
      } else {
        clone.push(payload);
      }
      clone.sort((a,b) => a.name.localeCompare(b.name));
      localStorage.setItem('mca_companies_v5', JSON.stringify(clone));
      setCompanies(clone);

      // Select newly entered profile
      const newSelIdx = clone.findIndex(c => c.name === payload.name && c.cin === payload.cin);
      if (newSelIdx !== -1) {
        setSelectedCompanyIdx(newSelIdx);
      }
    }

    addSystemNotification(`Company registry of "${payload.name}" updated successfully.`, "success");
  };

  const handleDeleteCompany = async (idxToDelete: number) => {
    const c = companies[idxToDelete];
    const confirmVal = window.confirm(`Are you sure you want to delete "${c.name}" from compliance tracking?`);
    if (!confirmVal) return;

    if (isFirebaseReady && db && user && c.id) {
      try {
        await deleteDoc(doc(db, "companies", c.id));
      } catch (e: any) {
        handleFirestoreError(e, OperationType.DELETE, "companies");
      }
    } else {
      const clone = companies.filter((_, idx) => idx !== idxToDelete);
      localStorage.setItem('mca_companies_v5', JSON.stringify(clone));
      setCompanies(clone);
      setSelectedCompanyIdx(clone.length > 0 ? 0 : null);
    }

    addSystemNotification(`Deleted profile "${c.name}" from database.`, "warn");
  };

  // Compute Outstanding Deadlines dynamically across ALL company listings
  const computePendingItemsList = () => {
    const list: {
      c: Company;
      ci: number; // global index
      fyL: string;
      r: {
        form: string;
        desc: string;
        dueDate: Date;
        isPostIncorp?: boolean;
        isAuditReminder?: boolean;
        isAGM?: boolean;
        isCustom?: boolean;
      };
      diff: number;
      key: string;
    }[] = [];

    const today = new Date();
    today.setHours(0,0,0,0);

    companies.forEach((c, cIdx) => {
      // 1. Regular Statutory Filings
      const allFYs = getAllFYs(c.incorp);
      allFYs.forEach(fy => {
        const fyLabelName = getFYLabel(fy);
        const rows = generateComplianceRows(c, fy);

        rows.forEach(r => {
          if (!r.dueDate) return;
          const key = `${c.cin || c.name}_${fyLabelName}_${r.form}${r.isPostIncorp ? '_postincorp' : ''}`;
          const isFiled = !!(c.filedStatus && c.filedStatus[key]);

          if (!isFiled) {
            const diffDays = Math.ceil((r.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            list.push({
              c,
              ci: cIdx,
              fyL: fyLabelName,
              r,
              diff: diffDays,
              key
            });
          }
        });
      });

      // 2. Custom Event Filings
      if (c.customForms && c.customForms.length > 0) {
        c.customForms.forEach(f => {
          const key = `${c.cin || c.name}_custom_${f.id}`;
          const isFiled = !!(c.filedStatus && c.filedStatus[key]);

          if (!isFiled) {
            const dueDateObj = new Date(f.dueDate);
            const diffDays = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            list.push({
              c,
              ci: cIdx,
              fyL: 'Event-Based',
              r: {
                form: f.form,
                desc: f.desc,
                dueDate: dueDateObj,
                isCustom: true
              },
              diff: diffDays,
              key
            });
          }
        });
      }
    });

    // Sort: Overdue first, then upcoming by proximity
    list.sort((a,b) => a.diff - b.diff);
    return list;
  };

  const pendingItems = computePendingItemsList();

  // Aggregate stats
  const totalOverdue = pendingItems.filter(p => p.diff < 0).length;
  const totalCritical = pendingItems.filter(p => p.diff >= 0 && p.diff <= 7).length;
  const totalWarnings = totalOverdue + totalCritical;

  // Automatically request browser push notifications permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(err => console.warn("Permission request failed", err));
    }
  }, []);

  // Compile real-time alerts inside Notification Center and trigger automated browser push notifications on new critical items
  useEffect(() => {
    const list: NotificationItem[] = [];
    const notifiedStr = localStorage.getItem('mca_notified_critical') || '[]';
    let notifiedCriticalKeys: string[] = [];
    try {
      notifiedCriticalKeys = JSON.parse(notifiedStr);
    } catch (_) {}

    let newlyTransitioned = false;

    // 1. Core Alerts
    pendingItems.forEach((item) => {
      if (item.diff < 0) {
        list.push({
          id: `notif_ov_${item.key}`,
          title: `Overdue Alert: ${item.r.form} for ${item.c.name}`,
          message: `The filing was due on ${item.r.dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}. Accumulated delays: ${Math.abs(item.diff)} days. Check late fee estimator.`,
          type: 'error',
          timestamp: new Date().toISOString(),
          read: false
        });
      } else if (item.diff <= 7) {
        list.push({
          id: `notif_cr_${item.key}`,
          title: `Deadline Warning: ${item.r.form}`,
          message: `${item.c.name} deliverable is due in ${item.diff} days. Satisfy before penalties accrue.`,
          type: 'warn',
          timestamp: new Date().toISOString(),
          read: false
        });

        // Detect transition from 'upcoming' -> 'critical' (7 days or less)
        if (!notifiedCriticalKeys.includes(item.key)) {
          notifiedCriticalKeys.push(item.key);
          newlyTransitioned = true;

          // Dispatch native browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`Urgent Filing Alert: ${item.r.form}`, {
                body: `${item.c.name} has moved to critical! Due in ${item.diff} days (${item.fyL}).`,
                icon: '/favicon.ico'
              });
            } catch (err) {
              console.warn("Native Notification failed (sandbox iframe):", err);
            }
          }
        }
      }
    });

    if (newlyTransitioned) {
      localStorage.setItem('mca_notified_critical', JSON.stringify(notifiedCriticalKeys));
    }

    // Match count sync with system notification status
    setNotifications(prev => {
      const systemAlerts = prev.filter(n => n.id.startsWith('system_') && !n.read);
      return [...systemAlerts, ...list];
    });
  }, [companies]);

  // Simulation handler to demonstrate upcoming -> critical transition push notification
  const handleSimulateCriticalTransition = () => {
    // Clear simulation item from list of notified keys to guarantee push triggers
    const targetKey = "TATA CONSULTANCY SERVICES LTD_custom_sim_critical";
    const notifiedStr = localStorage.getItem('mca_notified_critical') || '[]';
    let notified: string[] = [];
    try { notified = JSON.parse(notifiedStr); } catch (_) {}
    const filtered = notified.filter(k => k !== targetKey);
    localStorage.setItem('mca_notified_critical', JSON.stringify(filtered));

    // Force add a custom form expiring in 5 days (Critical region) to the first company (TATA)
    const today = new Date();
    const targetDueDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
    const dateStr = targetDueDate.toISOString().split('T')[0];

    const updatedCompanies = companies.map(c => {
      if (c.name.includes('TATA') || c.cin.includes('MH1995PLC090091')) {
        return {
          ...c,
          customForms: [
            ...(c.customForms || []).filter(f => f.id !== 'sim_critical'),
            {
              id: 'sim_critical',
              form: 'AOC-4 Delay Alert',
              desc: 'Filing transitioned from upcoming to critical (simulated demo)',
              eventDate: today.toISOString().split('T')[0],
              days: 30,
              dueDate: dateStr
            }
          ]
        };
      }
      return c;
    });

    setCompanies(updatedCompanies);
    addSystemNotification("Transition simulated successfully! A new filing AOC-4 Delay Alert was set to 5 days. Push notification fired.", "success");
  };

  // Push notifications helper for in-app logs
  const addSystemNotification = (msg: string, type: 'success' | 'warning' | 'warn' | 'info') => {
    const notifType = type === 'success' ? 'success' : type === 'warn' || type === 'warning' ? 'warn' : 'info';
    const newAlert: NotificationItem = {
      id: `system_${Date.now()}`,
      title: 'Registry Sync',
      message: msg,
      type: notifType,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newAlert, ...prev]);

    // Push browser notification api context
    if (Notification.permission === 'granted') {
      new Notification('MCA Compliance Tracker', {
        body: msg,
        icon: '/favicon.ico'
      });
    }
  };

  // Action handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearAllNotifs = () => {
    setNotifications([]);
  };

  const handleLaunchFormDetail = (formName: string) => {
    setSelectedFormDetailName(formName);
    setIsFDModalOpen(true);
  };

  const activeTranslation = TRANSLATIONS[lang];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-neutral-950 text-neutral-100' : 'bg-gray-50 text-gray-800'
    }`}>
      {/* Mobile AppBar header */}
      <header className="md:hidden border-b border-gray-150 bg-white dark:bg-neutral-900 dark:border-neutral-850 p-3.5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer text-gray-600 dark:text-gray-300"
          id="mobile-sidebar-toggle-btn"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4.5 h-4.5 text-blue-500" />
          <h1 className="text-xs font-extrabold tracking-widest text-gray-901 dark:text-white uppercase leading-none">
            {activeTranslation.appName}
          </h1>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onClearAll={handleClearAllNotifs}
            lang={lang}
          />
        </div>
      </header>

      {/* Mobile Search Row */}
      <div className="md:hidden px-4.5 py-3 bg-white border-b border-gray-150 dark:bg-neutral-900 dark:border-neutral-850 sticky top-[51px] z-30">
        <GlobalSearch
          companies={companies}
          pendingItems={pendingItems}
          onSelectCompany={(idx) => {
            setSelectedCompanyIdx(idx);
            setActiveTab('tracker');
          }}
          onNavigateToTab={setActiveTab}
          onOpenFormDetails={handleLaunchFormDetail}
        />
      </div>

      {/* Primary body split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar Panel */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false);
          }}
          lang={lang}
          onLangChange={(l) => {
            setLang(l);
            localStorage.setItem('mca_lang', l);
          }}
          theme={theme}
          onThemeToggle={() => {
            setTheme(prev => prev === 'light' ? 'dark' : 'light');
          }}
          user={user}
          onLogin={loginWithGoogle}
          onLogout={logoutUser}
          isSidebarOpen={isMobileSidebarOpen}
          onCloseSidebar={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content canvas container */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
          {/* Status Alert Flags Row for Desktop */}
          <section className="hidden md:flex items-center justify-between bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 p-4 rounded-xl shadow-2xs gap-4">
            <div className="flex items-center gap-4 shrink-0">
              {/* Menu Toggle for Tablet/Desktop */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 border border-gray-200 dark:border-neutral-800 bg-gray-50 hover:bg-gray-100 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-300 rounded-lg cursor-pointer flex items-center justify-center transition-all hover:scale-105 hover-glow group"
                title="Toggle Menu Drawer"
              >
                <Menu className="w-4.5 h-4.5 text-gray-500 group-hover:text-blue-500 transition-colors" />
              </button>

              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                <h2 className="text-sm font-extrabold text-gray-910 dark:text-white tracking-tight uppercase">
                  {activeTranslation.appName}
                </h2>
              </div>

              {/* Status pill badges */}
              {companies.length > 0 && (
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  {totalOverdue > 0 ? (
                    <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 px-2.5 py-1 rounded-full border border-rose-100 dark:border-rose-900/30 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {totalOverdue} OVERDUE FILINGS
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ALL METRICS IN TARGET ✓
                    </span>
                  )}

                  {totalCritical > 0 && (
                    <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/25 dark:text-amber-450 px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-900/30">
                      {totalCritical} FILINGS DUE THIS WEEK
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Global Search Center element */}
            <div className="flex-1 max-w-sm mx-4">
              <GlobalSearch
                companies={companies}
                pendingItems={pendingItems}
                onSelectCompany={(idx) => {
                  setSelectedCompanyIdx(idx);
                  setActiveTab('tracker');
                }}
                onNavigateToTab={setActiveTab}
                onOpenFormDetails={handleLaunchFormDetail}
              />
            </div>

            {/* Right-aligned desktop action blocks */}
            <div className="flex items-center gap-4 shrink-0">
              {/* Cloud Sync Status label */}
              {isFirebaseReady && user ? (
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50/20 px-2.5 py-1.5 rounded-lg border border-emerald-100/50">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  Cloud Synchronized
                </div>
              ) : isFirebaseReady ? (
                <button
                  onClick={loginWithGoogle}
                  className="flex items-center gap-1 px-3 py-1.5 border border-blue-500 bg-blue-50 hover:bg-blue-105 dark:bg-neutral-805 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase tracking-widest rounded-lg cursor-pointer transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In for Synced Cloud
                </button>
              ) : (
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-neutral-850 px-2.5 py-1.5 rounded-lg">
                  <CloudLightning className="w-3.5 h-3.5" />
                  Using Local Storage
                </div>
              )}

              {/* Notification Center */}
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onClearAll={handleClearAllNotifs}
                lang={lang}
              />
            </div>
          </section>

          {/* Core Tab Routing State Panels */}
          <section className="flex-1 animate-fade-in">
            {activeTab === 'dashboard' && (
              <DashboardTab
                companies={companies}
                pendingItems={pendingItems}
                lang={lang}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onSelectCompany={(idx) => {
                  setSelectedCompanyIdx(idx);
                  setActiveTab('tracker');
                }}
                onSimulateCritical={handleSimulateCriticalTransition}
              />
            )}

            {activeTab === 'calc' && (
              <CalculatorTab
                formsList={FORMS}
                lang={lang}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarTab
                companies={companies}
                pendingItems={pendingItems}
                lang={lang}
              />
            )}

            {activeTab === 'tracker' && (
              <TrackerTab
                companies={companies}
                selectedCompanyIdx={selectedCompanyIdx}
                onSaveCompany={handleSaveCompany}
                onDeleteCompany={handleDeleteCompany}
                onSelectCompany={setSelectedCompanyIdx}
                lang={lang}
                pendingItems={pendingItems}
              />
            )}

            {activeTab === 'forms' && (
              <FormsTab
                formsList={FORMS}
                lang={lang}
                onSelectForm={handleLaunchFormDetail}
              />
            )}

            {activeTab === 'guide' && (
              <GuideTab
                lang={lang}
              />
            )}

            {activeTab === 'mca-notifs' && (
              <McaNotifsTab
                lang={lang}
                userId={user ? user.uid : null}
                isEmailVerified={user ? user.emailVerified : false}
              />
            )}
          </section>
        </main>
      </div>

      {/* Forms Knowledge Detail Overlay Modal */}
      <FormsDetailModal
        formName={selectedFormDetailName}
        isOpen={isFDModalOpen}
        onClose={() => setIsFDModalOpen(false)}
        lang={lang}
        formsList={FORMS}
      />
    </div>
  );
}
