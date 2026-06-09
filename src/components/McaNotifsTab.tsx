/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FormEvent } from 'react';
import { db, isFirebaseReady, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, addDoc, doc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { 
  Bell, Newspaper, Search, Filter, ShieldAlert, Plus, CheckCircle, Trash2, 
  Calendar, Link, Sparkles, Send, RefreshCw, Layers, Gavel, Briefcase, 
  FileSpreadsheet, Activity, Wifi, Play, Square, AlertCircle, Info, ChevronRight, CheckSquare
} from 'lucide-react';
import { AppLanguage } from '../types';
import { TRANSLATIONS } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  COMPANIES_ACT_CHAPTERS, 
  LLP_ACT_CHAPTERS, 
  MCA_RULES_SET, 
  McaActChapter, 
  McaRuleSet 
} from '../data/mcaLawDatabase';

interface McaNotifsTabProps {
  lang: AppLanguage;
  userId: string | null;
  isEmailVerified: boolean;
}

export interface McaCircularItem {
  id: string;
  title: string;
  type: 'Circular' | 'Notification' | 'Order' | 'News';
  category: string; // 'Company Law' | 'LLP Act' | 'Insolvency' | 'General'
  date: string; // YYYY-MM-DD
  description: string;
  docRef?: string;
  important: boolean;
  timestamp: string;
  createdBy: string;
}

const DEFAULT_CIRCULARS: Omit<McaCircularItem, 'id'>[] = [
  {
    title: "Extension of CCFS-2026 Scheme Waiver operational window",
    type: "Circular",
    category: "Company Law",
    date: "2026-05-15",
    docRef: "General Circular 04/2026",
    description: "The central government has approved the extended operational period of the Company Compliance Facilitation Scheme (CCFS-2026) up to June 30, 2026 due to technical disruptions. Entities can benefit from up to 90% waiver on late fee multipliers.",
    important: true,
    timestamp: "2026-05-15T10:00:00Z",
    createdBy: "System"
  },
  {
    title: "Form MGT-7A simplified deployment for small companies",
    type: "Notification",
    category: "Company Law",
    date: "2026-06-01",
    docRef: "MCA GSR 412(E)",
    description: "Web-based smart filing Form MGT-7A is live with simpler parameters for start-ups and OPCs. Ensure key capital, paid-up, and turnover thresholds are verified using the Simplified Slabs calculator.",
    important: false,
    timestamp: "2026-06-01T09:15:00Z",
    createdBy: "System"
  },
  {
    title: "Filing relaxation for newly registered LLPs in North East circles",
    type: "Order",
    category: "LLP Act",
    date: "2026-06-07",
    docRef: "Order Sec 15(3)-22",
    description: "Providing additional transition buffer window of 45 days above normal event thresholds for compliance submissions of LLP Form 3 and Form 4 in designated North-East commercial zones.",
    important: true,
    timestamp: "2026-06-07T14:45:00Z",
    createdBy: "System"
  },
  {
    title: "Insolvency and Bankruptcy (Second Amendment) Rules 2026",
    type: "Circular",
    category: "Insolvency",
    date: "2026-06-08",
    docRef: "IBBI Circular No. 981",
    description: "Introduction of micro-entity fast-track resolution pathways with integrated file matching mechanisms. Read and upload pre-checks carefully before updating client statuses on corporate portals.",
    important: false,
    timestamp: "2026-06-08T11:20:00Z",
    createdBy: "System"
  }
];

const UPCOMING_SIMULATED_NOTIFS = [
  {
    title: "Mandatory Dematerialization extension for Non-Government Private Companies",
    type: "Notification" as const,
    category: "Company Law",
    docRef: "MCA Notification S.O. 1024(E)",
    description: "The Ministry of Corporate Affairs has extended the deadline for the mandatory dematerialization of shares in massive private conglomerates from September to December 2026, granting structural transition leverage to startup entities.",
    important: true,
  },
  {
    title: "Rationalization of additional fee multipliers for dormant registrations",
    type: "Circular" as const,
    category: "General",
    docRef: "General Circular 08/2026",
    description: "Introduction of a relaxed fee-scale cap on physical document retrieval, eliminating multiple additional penalties for companies under process of official wind-up or summary dissolution.",
    important: false,
  },
  {
    title: "Mandatory incorporation of Geo-Tagging coordinates in Registered Office filings",
    type: "Order" as const,
    category: "Company Law",
    docRef: "MCA GSR 455(E)",
    description: "Updating SPICe+ and INC-22 portals to embed high-precision latitude/longitude coordinate verifications matched against municipal postal codes to rule out front companies or brief-case shell companies.",
    important: true,
  },
  {
    title: "Upgradation of MCA21 portal to support AI-driven instant compliance screening",
    type: "News" as const,
    category: "General",
    docRef: "MCA Press Announcement",
    description: "Deploying automated model scanners on submitted Balance Sheets (AOC-4) to spot and alert filings that have internal deficit mismatch errors, or fail to substantiate dynamic schedules.",
    important: false,
  }
];

export default function McaNotifsTab({ lang, userId, isEmailVerified }: McaNotifsTabProps) {
  const t = TRANSLATIONS[lang];
  
  // Tab control
  type HubTab = 'notifs' | 'companies-act' | 'llp-act' | 'rules' | 'simulator';
  const [activeHubTab, setActiveHubTab] = useState<HubTab>('notifs');

  // Unified circulars state
  const [feed, setFeed] = useState<McaCircularItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real-time publishing states
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'Circular' | 'Notification' | 'Order' | 'News'>('Circular');
  const [newCategory, setNewCategory] = useState('Company Law');
  const [newDocRef, setNewDocRef] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImportant, setNewImportant] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Simulator controls
  const [simulatorActive, setSimulatorActive] = useState(true);
  const [simIntervalId, setSimIntervalId] = useState<any | null>(null);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);

  // Search inside Acts tabs
  const [actSearchQuery, setActSearchQuery] = useState('');
  const [selectedActChapter, setSelectedActChapter] = useState<string | null>(null);

  // 1. Set up Firestore snapshot or local fallback at mount
  useEffect(() => {
    let unsubscribe = () => {};

    if (isFirebaseReady && db) {
      setLoading(true);
      const q = query(collection(db, 'mca_notifications'), orderBy('timestamp', 'desc'));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const items: McaCircularItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as McaCircularItem);
        });
        
        // If snapshot is empty, auto pre-seed with default elements or load offline falls
        if (items.length === 0) {
          preseedDefaultData();
        } else {
          setFeed(items);
          setLoading(false);
        }
      }, (err) => {
        console.error("Firebase Circular onSnapshot error:", err);
        try {
          handleFirestoreError(err, OperationType.LIST, 'mca_notifications');
        } catch (_) {}
        loadOfflineData();
      });
    } else {
      loadOfflineData();
    }

    return () => unsubscribe();
  }, [userId, isEmailVerified]);

  // Periodic upcoming simulation loop
  useEffect(() => {
    if (simulatorActive) {
      logSimulationEvent("WebSocket handshakes established. Listening to Ministry Gazette RSS streams...");
      
      const interval = setInterval(() => {
        triggerSimulatedUpcomingUpdate();
      }, 45000); // simulate a fresh MCA release every 45s
      
      setSimIntervalId(interval);
      return () => {
        clearInterval(interval);
      };
    } else {
      logSimulationEvent("Real-time feed listener paused by proxy administrator.");
      if (simIntervalId) clearInterval(simIntervalId);
    }
  }, [simulatorActive, feed]);

  const loadOfflineData = () => {
    setLoading(true);
    const saved = localStorage.getItem('mca_offline_feed');
    if (saved) {
      try {
        setFeed(JSON.parse(saved));
      } catch (_) {
        setFeed(DEFAULT_CIRCULARS.map((c, i) => ({ ...c, id: `offline_${i}` })));
      }
    } else {
      const initialFeed = DEFAULT_CIRCULARS.map((c, i) => ({ ...c, id: `offline_${i}` }));
      setFeed(initialFeed);
      localStorage.setItem('mca_offline_feed', JSON.stringify(initialFeed));
    }
    setLoading(false);
  };

  const preseedDefaultData = async () => {
    if (!db || !isFirebaseReady) {
      loadOfflineData();
      return;
    }
    try {
      for (const item of DEFAULT_CIRCULARS) {
        await addDoc(collection(db, 'mca_notifications'), item);
      }
    } catch (e) {
      console.error("Preseeding failed:", e);
      loadOfflineData();
    }
  };

  const logSimulationEvent = (msg: string) => {
    setSimulationLogs(prev => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 25)
    ]);
  };

  // Automated/Interactive real-time trigger of Gazette upcoming updates
  const triggerSimulatedUpcomingUpdate = async () => {
    const randomIndex = Math.floor(Math.random() * UPCOMING_SIMULATED_NOTIFS.length);
    const chosenRaw = UPCOMING_SIMULATED_NOTIFS[randomIndex];
    
    // Add unique identifier element
    const todayStr = new Date().toISOString().split('T')[0];
    const uniqueTitle = `${chosenRaw.title} (Amended v${Math.floor(Math.random() * 90 + 10)})`;
    
    const simulatedItem: Omit<McaCircularItem, 'id'> = {
      title: uniqueTitle,
      type: chosenRaw.type,
      category: chosenRaw.category,
      date: todayStr,
      docRef: chosenRaw.docRef,
      description: chosenRaw.description,
      important: chosenRaw.important,
      timestamp: new Date().toISOString(),
      createdBy: "MCA Webhook Simulator"
    };

    logSimulationEvent(`New Official ${simulatedItem.type} Broadcast incoming on "${simulatedItem.docRef}."`);

    if (isFirebaseReady && db) {
      try {
        await addDoc(collection(db, 'mca_notifications'), simulatedItem);
        logSimulationEvent(`Success: Successfully published and synced to Firestore DB.`);
        
        // Alert user of incoming
        triggerBrowserPushAlert(simulatedItem.title, simulatedItem.type);
      } catch (e) {
        // Safe lock addition
        addSimulatedLocal(simulatedItem);
      }
    } else {
      addSimulatedLocal(simulatedItem);
    }
  };

  const addSimulatedLocal = (item: Omit<McaCircularItem, 'id'>) => {
    const updated = [
      { ...item, id: `offline_${Date.now()}` },
      ...feed
    ] as McaCircularItem[];
    setFeed(updated);
    localStorage.setItem('mca_offline_feed', JSON.stringify(updated));
    logSimulationEvent(`Success: Sync completed in local storage buffer.`);
    triggerBrowserPushAlert(item.title, item.type);
  };

  const triggerBrowserPushAlert = (title: string, type: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Realtime MCA ${type} Release`, {
          body: title,
          icon: '/favicon.ico'
        });
      } catch (_) {}
    }
  };

  // 2. Submit new manual announcement
  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      setErrorMsg("Please provide both a title and a detailed description.");
      return;
    }

    setPublishing(true);
    setErrorMsg('');
    setSuccessMsg('');

    const todayStr = new Date().toISOString().split('T')[0];
    const itemData: Omit<McaCircularItem, 'id'> = {
      title: newTitle.trim(),
      type: newType,
      category: newCategory,
      date: todayStr,
      docRef: newDocRef.trim() || undefined,
      description: newDesc.trim(),
      important: newImportant,
      timestamp: new Date().toISOString(),
      createdBy: userId || 'Guest'
    };

    if (isFirebaseReady && db) {
      try {
        await addDoc(collection(db, 'mca_notifications'), itemData);
        setSuccessMsg("Filing announcement broadcasted completely! Feed updated in real-time.");
        logSimulationEvent(`Manual Circular published successfully: "${itemData.title}"`);
        resetForm();
      } catch (err: any) {
        setErrorMsg("Failed to write to Cloud Firestore. Verification status check needed.");
        try {
          handleFirestoreError(err, OperationType.CREATE, 'mca_notifications');
        } catch (_) {}
      } finally {
        setPublishing(false);
      }
    } else {
      // Local addition
      const updated = [
        { ...itemData, id: `offline_${Date.now()}` },
        ...feed
      ] as McaCircularItem[];
      setFeed(updated);
      localStorage.setItem('mca_offline_feed', JSON.stringify(updated));
      setSuccessMsg("Announcement listed locally in offline database.");
      logSimulationEvent(`Manual Circular queued locally: "${itemData.title}"`);
      resetForm();
      setPublishing(false);
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDocRef('');
    setNewDesc('');
    setNewImportant(false);
    setTimeout(() => {
      setShowPublishForm(false);
      setSuccessMsg('');
    }, 2500);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this official notification?")) return;
    
    if (isFirebaseReady && db && !id.startsWith('offline_')) {
      try {
        await deleteDoc(doc(db, 'mca_notifications', id));
        logSimulationEvent(`Document removed from Cloud Firestore: ${id}`);
      } catch (err) {
        console.error("Error deleting MCANotification:", err);
        try {
          handleFirestoreError(err, OperationType.DELETE, `mca_notifications/${id}`);
        } catch (_) {}
      }
    } else {
      const updated = feed.filter(f => f.id !== id);
      setFeed(updated);
      localStorage.setItem('mca_offline_feed', JSON.stringify(updated));
      logSimulationEvent(`Local buffer item purged: ${id}`);
    }
  };

  // Filter application for primary feed
  const filteredFeed = feed.filter((item) => {
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesType = typeFilter === 'All' || item.type === typeFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.docRef && item.docRef.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesType && matchesSearch;
  });

  // Filters for statutory Acts
  const filteredCompanyChapters = COMPANIES_ACT_CHAPTERS.filter(chap => 
    chap.title.toLowerCase().includes(actSearchQuery.toLowerCase()) ||
    chap.chapter.toLowerCase().includes(actSearchQuery.toLowerCase()) ||
    chap.description.toLowerCase().includes(actSearchQuery.toLowerCase()) ||
    chap.sections.toLowerCase().includes(actSearchQuery.toLowerCase()) ||
    chap.keyAxioms.some(ax => ax.toLowerCase().includes(actSearchQuery.toLowerCase()))
  );

  const filteredLlpChapters = LLP_ACT_CHAPTERS.filter(chap => 
    chap.title.toLowerCase().includes(actSearchQuery.toLowerCase()) ||
    chap.chapter.toLowerCase().includes(actSearchQuery.toLowerCase()) ||
    chap.description.toLowerCase().includes(actSearchQuery.toLowerCase()) ||
    chap.sections.toLowerCase().includes(actSearchQuery.toLowerCase()) ||
    chap.keyAxioms.some(ax => ax.toLowerCase().includes(actSearchQuery.toLowerCase()))
  );

  const filteredRules = MCA_RULES_SET.filter(rule => 
    rule.ruleName.toLowerCase().includes(actSearchQuery.toLowerCase()) ||
    rule.description.toLowerCase().includes(actSearchQuery.toLowerCase()) ||
    rule.coverage.toLowerCase().includes(actSearchQuery.toLowerCase()) ||
    rule.keyCompliancePoints.some(pt => pt.toLowerCase().includes(actSearchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6 text-left leading-relaxed">
      {/* Intro Header banner */}
      <section className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-extrabold text-blue-750 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 matches-left-border">
            <Newspaper className="w-5 h-5 text-blue-500 shrink-0" />
            MCA Regulatory Reference Center & Live Feed
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Access official Acts, dynamic Rules, relevant Forms, live Ministerial Circulars, and configure upcoming real-time stream simulations.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 text-xs font-bold font-mono">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/50 rounded-lg">
            <Wifi className={`w-3.5 h-3.5 ${simulatorActive ? 'animate-pulse text-emerald-500' : 'text-gray-400'}`} />
            <span>{simulatorActive ? "MCA STREAM: ONLINE" : "STREAM: PAUSED"}</span>
          </div>
        </div>
      </section>

      {/* Primary Sub-tab Navigation */}
      <nav id="mca-hub-nav" className="flex flex-wrap gap-1 bg-gray-100/60 dark:bg-neutral-950 p-1.5 rounded-xl border border-gray-150 dark:border-neutral-800 select-none">
        <button
          onClick={() => { setActiveHubTab('notifs'); setActSearchQuery(''); }}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeHubTab === 'notifs'
              ? 'bg-white text-blue-600 shadow-2xs dark:bg-neutral-900 dark:text-white border border-gray-200/50 dark:border-neutral-800'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Bell className="w-4 h-4 text-blue-500" />
          Live Official Feed ({feed.length})
        </button>

        <button
          onClick={() => { setActiveHubTab('companies-act'); setActSearchQuery(''); }}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeHubTab === 'companies-act'
              ? 'bg-white text-blue-600 shadow-2xs dark:bg-neutral-900 dark:text-white border border-gray-200/50 dark:border-neutral-800'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Gavel className="w-4 h-4 text-blue-500" />
          Companies Act, 2013
        </button>

        <button
          onClick={() => { setActiveHubTab('llp-act'); setActSearchQuery(''); }}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeHubTab === 'llp-act'
              ? 'bg-white text-blue-600 shadow-2xs dark:bg-neutral-900 dark:text-white border border-gray-200/50 dark:border-neutral-800'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Briefcase className="w-4 h-4 text-blue-500" />
          LLP Act, 2008
        </button>

        <button
          onClick={() => { setActiveHubTab('rules'); setActSearchQuery(''); }}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeHubTab === 'rules'
              ? 'bg-white text-blue-600 shadow-2xs dark:bg-neutral-900 dark:text-white border border-gray-200/50 dark:border-neutral-800'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-blue-500" />
          Rules Directories
        </button>

        <button
          onClick={() => { setActiveHubTab('simulator'); setActSearchQuery(''); }}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeHubTab === 'simulator'
              ? 'bg-white text-blue-600 shadow-2xs dark:bg-neutral-900 dark:text-white border border-gray-200/50 dark:border-neutral-800'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Activity className="w-4 h-4 text-blue-500" />
          Realtime Stream Control
        </button>
      </nav>

      {/* Main Tab Panels */}
      <div className="space-y-4">
        
        {/* TAB 1: Live Official Feed */}
        {activeHubTab === 'notifs' && (
          <div className="space-y-6">
            {/* Search and manual trigger controls inside Feed tab */}
            <div className="flex flex-col md:flex-row gap-3 items-center">
              {/* Filter controls */}
              <div className="flex-grow w-full md:w-auto relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query circulars, amendments, Gazette ref numbers..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg text-xs font-semibold focus:border-blue-500 outline-none text-gray-700 dark:text-white transition-all shadow-3xs"
                />
              </div>

              <div className="flex gap-2.5 items-center shrink-0 w-full md:w-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 focus:border-blue-500 outline-none flex-1 md:flex-none"
                >
                  <option value="All">All Domains</option>
                  <option value="Company Law">Company Law</option>
                  <option value="LLP Act">LLP Act</option>
                  <option value="Insolvency">Insolvency & Bankruptcy</option>
                  <option value="General">General</option>
                </select>

                <button
                  onClick={() => setShowPublishForm(!showPublishForm)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer flex-1 md:flex-none active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Publish Notice
                </button>
              </div>
            </div>

            {/* Form to manual list notices */}
            <AnimatePresence>
              {showPublishForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <form
                    onSubmit={handlePublish}
                    className="bg-white dark:bg-neutral-900 border border-blue-150 dark:border-neutral-800 shadow-md rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-3">
                      <h3 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 animate-spin text-blue-500" />
                        Broadcast Custom Real-time Amendment
                      </h3>
                      <span className="text-[10px] text-gray-400 tracking-wider uppercase font-semibold">
                        ABAC Secure
                      </span>
                    </div>

                    {successMsg && (
                      <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-950/10 rounded-lg text-xs font-bold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        {successMsg}
                      </div>
                    )}

                    {errorMsg && (
                      <div className="p-3 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-300 border border-rose-100 dark:border-rose-950/10 rounded-lg text-xs font-bold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        {errorMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div className="space-y-1 md:col-span-2">
                        <label className="block font-bold text-gray-700 dark:text-gray-300">
                          Filing Alert / Circular Title
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={150}
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="e.g. Special dispensation framework for filing Form AOC-4 in 2026"
                          className="w-full bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2 text-gray-800 dark:text-white focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-gray-700 dark:text-gray-300">
                          Type Format
                        </label>
                        <select
                          value={newType}
                          onChange={(e: any) => setNewType(e.target.value)}
                          className="w-full bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2 text-gray-800 dark:text-gray-200 focus:border-blue-500 outline-none"
                        >
                          <option value="Circular">Circular</option>
                          <option value="Notification">Notification</option>
                          <option value="Order">Order</option>
                          <option value="News">News Updates</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-gray-700 dark:text-gray-300">
                          Functional Category
                        </label>
                        <select
                          value={newCategory}
                          onChange={(e: any) => setNewCategory(e.target.value)}
                          className="w-full bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2 text-gray-800 dark:text-gray-200 focus:border-blue-500 outline-none"
                        >
                          <option value="Company Law">Company Law</option>
                          <option value="LLP Act">LLP Act</option>
                          <option value="Insolvency">Insolvency & Bankruptcy</option>
                          <option value="General">General Administrative</option>
                        </select>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="block font-bold text-gray-700 dark:text-gray-300">
                          Official Document Gazette ID
                        </label>
                        <input
                          type="text"
                          maxLength={50}
                          value={newDocRef}
                          onChange={(e) => setNewDocRef(e.target.value)}
                          placeholder="e.g. Circular No. 05/2026 or Gazette S.O. 56(E)"
                          className="w-full bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2 text-gray-800 dark:text-white focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div className="flex items-center h-10 mt-4 md:col-span-2 pl-2">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-750 dark:text-gray-300 select-none">
                          <input
                            type="checkbox"
                            checked={newImportant}
                            onChange={(e) => setNewImportant(e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-neutral-950 cursor-pointer"
                          />
                          <span className="text-xs">Flag as Important (Adds warning style banner to notice card)</span>
                        </label>
                      </div>

                      <div className="space-y-1 md:col-span-4">
                        <label className="block font-bold text-gray-700 dark:text-gray-300">
                          Detailed Statutory Guidelines
                        </label>
                        <textarea
                          required
                          rows={4}
                          maxLength={1000}
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          placeholder="Provide detailed legal text, implementation processes, direct impacts..."
                          className="w-full bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5 text-gray-800 dark:text-white focus:border-blue-500 outline-none resize-y"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setShowPublishForm(false)}
                        className="px-4 py-2 border border-gray-205 dark:border-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-5 border-gray-200 dark:hover:bg-neutral-850 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={publishing}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500/50 text-white font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer hover:scale-103"
                      >
                        {publishing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Sync Circular
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Circular Stream Grid */}
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-450 text-xs font-bold">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                Querying database instances for official circular list...
              </div>
            ) : filteredFeed.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-8 text-center text-gray-500 dark:text-gray-400 space-y-2">
                <Newspaper className="w-10 h-10 mx-auto text-gray-300 dark:text-neutral-700 shrink-0" />
                <p className="text-xs font-bold text-gray-750 dark:text-gray-300">No circular feed items correspond to query parameters.</p>
                <p className="text-[11px] text-gray-400">Try checking active domain categories or clear search input strings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredFeed.map((item) => {
                    const badgeCol = 
                      item.type === 'Circular' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300' :
                      item.type === 'Notification' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300' :
                      item.type === 'Order' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300' :
                      'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/40 dark:border-sky-900/60 dark:text-sky-300';

                    return (
                      <motion.article
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        className={`bg-white dark:bg-neutral-900 border rounded-xl p-5 shadow-3xs flex flex-col justify-between gap-4 transition-all relative group ${
                          item.important
                            ? 'border-rose-450 dark:border-rose-950 ring-1 ring-rose-500/10'
                            : 'border-gray-150 dark:border-neutral-800'
                        }`}
                      >
                        {item.important && (
                          <div className="absolute top-0 right-0 h-1.5 w-16 bg-gradient-to-l from-rose-500 to-rose-400 rounded-tr-xl rounded-bl-xl" />
                        )}

                        <div className="space-y-3">
                          {/* Card tags row */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border leading-none ${badgeCol}`}>
                                {item.type.toUpperCase()}
                              </span>
                              <span className="px-2 py-0.5 bg-gray-55/70 border border-gray-150 dark:bg-neutral-850 dark:border-neutral-800 rounded-md text-[10px] text-gray-500 font-bold">
                                {item.category}
                              </span>
                              {item.important && (
                                <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded text-[8.5px] font-extrabold uppercase animate-pulse">
                                  REGULATION WARNING
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                              <Calendar className="w-3 h-3 text-gray-410" />
                              {item.date}
                            </div>
                          </div>

                          {/* Body text details */}
                          <div className="space-y-1.5">
                            <h3 className="font-extrabold text-gray-901 dark:text-white text-xs leading-normal tracking-tight hover:text-blue-500 transition-colors">
                              {item.title}
                            </h3>
                            
                            {item.docRef && (
                              <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500 bg-gray-50 dark:bg-neutral-850 p-1 px-1.5 rounded w-fit max-w-full border border-gray-150/40 dark:border-neutral-800">
                                <Link className="w-3 h-3 text-blue-500 shrink-0" />
                                <span className="truncate">{item.docRef}</span>
                              </div>
                            )}

                            <p className="text-xs text-gray-600 dark:text-gray-305 leading-relaxed mt-2 whitespace-pre-wrap">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Card metadata / Author footer */}
                        <div className="border-t border-gray-100 dark:border-neutral-850/50 pt-3 flex items-center justify-between text-[10px]">
                          <span className="text-gray-450 font-bold">
                            Publisher: <span className="text-gray-600 font-extrabold dark:text-gray-300">{item.createdBy === 'System' ? 'Ministry Authority' : (item.createdBy === userId ? 'Authorized Corporate Officer (You)' : `Filing Officer [${item.createdBy.substring(0,5)}]`)}</span>
                          </span>

                          <div className="flex items-center gap-1">
                            {item.createdBy !== 'System' && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1 px-2 text-rose-500 border border-rose-200/50 dark:border-rose-900/30 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 rounded-lg transition-all cursor-pointer font-bold shrink-0 flex items-center gap-1"
                                title="Remove Announcement circular"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Companies Act, 2013 Statutory Library */}
        {activeHubTab === 'companies-act' && (
          <div className="space-y-6">
            <div className="bg-blue-50/20 border border-blue-200/50 dark:bg-neutral-900 dark:border-neutral-850 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
              <div className="p-2.5 bg-blue-500 text-white rounded-lg shrink-0">
                <Gavel className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                  The Companies Act, 2013 Statutory Explorer
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Search, review, and analyze official legal chapters, constitutional requirements, and statutory codes mandated for registered corporations.
                </p>
              </div>
            </div>

            {/* General Chapter search */}
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={actSearchQuery}
                onChange={(e) => setActSearchQuery(e.target.value)}
                placeholder="Search legal axioms, chapters, section numbers (e.g., Sec 135)..."
                className="w-full bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg py-3 pl-11 pr-4 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-white outline-none shadow-3xs"
              />
            </div>

            {/* Grid display Chapters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCompanyChapters.length === 0 ? (
                <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-8 text-center text-gray-450 text-xs md:col-span-2">
                  No Companies Act matches found for your query terms.
                </div>
              ) : (
                filteredCompanyChapters.map((chap, idx) => {
                  const isOpen = selectedActChapter === chap.chapter;
                  return (
                    <div 
                      key={idx}
                      className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 shadow-3xs flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[10.5px] font-extrabold bg-blue-55/10 border border-blue-200/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 py-0.5 px-2 rounded-md">
                            {chap.chapter}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {chap.sections}
                          </span>
                        </div>

                        <h3 className="text-xs font-extrabold text-gray-901 dark:text-white uppercase tracking-tight">
                          {chap.title}
                        </h3>

                        <p className="text-xs text-gray-600 dark:text-gray-310">
                          {chap.description}
                        </p>

                        <div className="pt-2">
                          <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                            Core Compliance Axioms:
                          </span>
                          <ul className="space-y-1.5 pl-1 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                            {chap.keyAxioms.map((ax, innerIdx) => (
                              <li key={innerIdx} className="flex gap-1.5 items-start">
                                <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                <span>{ax}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Associated e-Forms tagging */}
                      <div className="border-t border-gray-100 dark:border-neutral-850 pt-3 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
                          Linked e-Forms:
                        </span>
                        {chap.associatedForms.map((frm, fIdx) => (
                          <span 
                            key={fIdx} 
                            className="font-mono bg-indigo-50/10 border border-indigo-200/60 text-indigo-700 dark:text-indigo-400 dark:border-indigo-900/50 py-0.5 px-1.5 rounded text-[10px] font-extrabold"
                          >
                            {frm}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LLP Act, 2008 Statutory Repository */}
        {activeHubTab === 'llp-act' && (
          <div className="space-y-6">
            <div className="bg-amber-50/20 border border-amber-200/50 dark:bg-neutral-900 dark:border-neutral-850 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
              <div className="p-2.5 bg-amber-500 text-white rounded-lg shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                  Limited Liability Partnership Rules & Acts (2008)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Review regulations governing minimum partner counts, designated partner liabilities, contribution clauses, and financial disclosures of LLPs.
                </p>
              </div>
            </div>

            {/* Search filter for LLPs */}
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={actSearchQuery}
                onChange={(e) => setActSearchQuery(e.target.value)}
                placeholder="Query LLP sections, agreement clauses, or filings (e.g., Sec 34)..."
                className="w-full bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg py-3 pl-11 pr-4 text-xs font-semibold focus:border-blue-500 text-gray-700 dark:text-white outline-none shadow-3xs"
              />
            </div>

            {/* Grid display LLP Chapters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLlpChapters.length === 0 ? (
                <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-8 text-center text-gray-450 text-xs md:col-span-2">
                  No LLP Act chapters matched your search inputs.
                </div>
              ) : (
                filteredLlpChapters.map((chap, idx) => (
                  <div 
                    key={idx}
                    className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 shadow-3xs flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10.5px] font-extrabold bg-amber-50/10 border border-amber-200/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 py-0.5 px-2 rounded-md">
                          {chap.chapter}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {chap.sections}
                        </span>
                      </div>

                      <h3 className="text-xs font-extrabold text-gray-901 dark:text-white uppercase tracking-tight">
                        {chap.title}
                      </h3>

                      <p className="text-xs text-gray-600 dark:text-gray-310">
                        {chap.description}
                      </p>

                      <div className="pt-2">
                        <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-450 uppercase tracking-wider block mb-1">
                          Core Statutory Guidelines:
                        </span>
                        <ul className="space-y-1.5 pl-1 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                          {chap.keyAxioms.map((ax, innerIdx) => (
                            <li key={innerIdx} className="flex gap-1.5 items-start">
                              <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{ax}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Associated e-Forms */}
                    <div className="border-t border-gray-100 dark:border-neutral-850 pt-3 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
                        Linked LLP Forms:
                      </span>
                      {chap.associatedForms.map((frm, fIdx) => (
                        <span 
                          key={fIdx} 
                          className="font-mono bg-sky-50/10 border border-sky-200/50 text-sky-700 dark:text-sky-400 dark:border-sky-900/50 py-0.5 px-1.5 rounded text-[10px] font-extrabold"
                        >
                          {frm}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Rules Directories and Master Lists */}
        {activeHubTab === 'rules' && (
          <div className="space-y-6">
            <div className="bg-indigo-50/20 border border-indigo-200/50 dark:bg-neutral-900 dark:border-neutral-850 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
              <div className="p-2.5 bg-indigo-500 text-white rounded-lg shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                  The Official MCA Rulebooks and Guidelines
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Access exact compliance guidelines containing rules for administrative declarations, audit timelines, and corporate reporting.
                </p>
              </div>
            </div>

            {/* Rules search input */}
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={actSearchQuery}
                onChange={(e) => setActSearchQuery(e.target.value)}
                placeholder="Search rule books, year thresholds, accountability items..."
                className="w-full bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg py-3 pl-11 pr-4 text-xs font-semibold focus:border-blue-500 text-gray-700 dark:text-white outline-none shadow-3xs"
              />
            </div>

            {/* Grid display rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRules.length === 0 ? (
                <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-8 text-center text-gray-450 text-xs md:col-span-2">
                  No explicit legal rule matches matched search criteria.
                </div>
              ) : (
                filteredRules.map((rule, idx) => (
                  <div 
                    key={idx}
                    className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 shadow-3xs flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-sans text-[10.5px] font-extrabold bg-indigo-50 border border-indigo-200/50 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300 py-0.5 px-2 rounded-md">
                          Ruleset Year: {rule.year}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 dark:bg-neutral-850 p-1 rounded">
                          Coverage: {rule.coverage}
                        </span>
                      </div>

                      <h3 className="text-xs font-extrabold text-gray-901 dark:text-white uppercase tracking-tight">
                        {rule.ruleName}
                      </h3>

                      <p className="text-xs text-gray-600 dark:text-gray-314">
                        {rule.description}
                      </p>

                      <div className="pt-2">
                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                          Key Audit & Filing Benchmarks:
                        </span>
                        <ul className="space-y-1.5 pl-1 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                          {rule.keyCompliancePoints.map((pt, innerIdx) => (
                            <li key={innerIdx} className="flex gap-1.5 items-start">
                              <CheckSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Associated e-Forms links */}
                    <div className="border-t border-gray-100 dark:border-neutral-850 pt-3 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
                        Mandated e-Forms:
                      </span>
                      {rule.associatedForms.map((frm, fIdx) => (
                        <span 
                          key={fIdx} 
                          className="font-mono bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400 py-0.5 px-1.5 rounded text-[10px] font-extrabold"
                        >
                          {frm}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Webhook & Live Gazette Stream Simulator */}
        {activeHubTab === 'simulator' && (
          <div className="space-y-6">
            {/* Split Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left explanation and toggles */}
              <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 shadow-3xs lg:col-span-1 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-extrabold text-blue-750 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-500" />
                    Filing Webhook Proxy Server
                  </h3>
                  <p className="text-[11px] text-gray-400 leading-snug">
                    Simulates secure active push sockets connected directly to the Government Gazette RSS publishers and MCA portals or notifications logs.
                  </p>
                </div>

                {/* Subscriptions toggle */}
                <div className="p-4 bg-gray-50/50 dark:bg-neutral-950 rounded-xl border border-gray-200/50 dark:border-neutral-800 flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    SIMULATION CONTROLS
                  </span>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-250">
                      Auto-Publish Updates
                    </span>
                    <button
                      onClick={() => setSimulatorActive(!simulatorActive)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        simulatorActive ? 'bg-blue-600' : 'bg-gray-300 dark:bg-neutral-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          simulatorActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-gray-400 leading-snug">
                    When active, a mock Gazetted notification/amendment is randomly selected, structured properly, and pushed into the live Firestore feed every 45 seconds to demonstrate real-time client sync.
                  </p>

                  <button
                    onClick={triggerSimulatedUpcomingUpdate}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Simulate Live Release Right Now
                  </button>
                </div>

                <div className="p-3 bg-blue-50/20 text-blue-800 border border-blue-150 rounded-lg text-[10.5px] leading-relaxed dark:bg-neutral-850 dark:text-blue-300 dark:border-neutral-800">
                  <span className="font-extrabold flex items-center gap-1 mb-1 text-blue-600 dark:text-indigo-400 uppercase text-[10px] tracking-wider">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    How real-time updates actually work
                  </span>
                  Our architecture leverages Firestore&apos;s native web sockets. When a simulated circular triggers, a new record is added to the shared collection. All open dashboards instantly repaint the interface seamlessly without refresh cycles.
                </div>
              </div>

              {/* Right simulation stream logs */}
              <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 shadow-3xs lg:col-span-2 flex flex-col gap-3">
                <span className="text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider flex items-center gap-1.5 matches-left-border">
                  <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                  Live Gazette Listener Logs & Telemetry
                </span>

                <div className="flex-grow font-mono text-[10.5px] bg-gray-95 text-gray-800 dark:bg-neutral-950 dark:text-emerald-400 p-4 rounded-xl border border-gray-200/50 dark:border-neutral-850 h-[300px] overflow-y-auto space-y-2 select-text selection:bg-blue-500/25 selection:text-white">
                  {simulationLogs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 italic">
                      Proxy server warm up complete. Waiting for incoming stream...
                    </div>
                  ) : (
                    simulationLogs.map((log, lIdx) => (
                      <div key={lIdx} className="border-b border-gray-100 dark:border-neutral-900 pb-1.5 last:border-b-0 leading-normal">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
