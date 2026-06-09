/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EntityType = 'pvt' | 'pub' | 'opc' | 'sec8' | 'llp';

export interface CustomForm {
  id: string;
  form: string;
  desc: string;
  eventDate: string;
  days: number;
  dueDate: string;
}

export interface Company {
  id?: string; // Firestore document ID
  userId?: string; // Owner UID
  name: string;
  cin: string;
  type: EntityType;
  incorp: string; // YYYY-MM-DD
  capital: number;
  isSmall: boolean;
  lastAGMDate: string; // YYYY-MM-DD (blank if none)
  opcLastFY: string; // blank if none
  llpLastForm11Date: string; // blank if none
  llpLastForm8Date: string; // blank if none
  filedStatus: Record<string, boolean>; // key: CompanyName/CIN_FY_FormName
  customForms: CustomForm[];
  savedAt: string;
}

export interface FormRef {
  form: string;
  desc: string;
  sec: string;
  type: 'annual' | 'event';
  entity: string;
  dueInfo: string;
  lateBasis: string;
  flat: boolean;
  flatAmt?: number;
  ccfs: 'ccfs2026' | 'none';
  fixedFee?: boolean;
  isOPC?: boolean;
  isLLP?: boolean;
  eventDays?: number | null;
  eventHint?: string;
  msme?: boolean;
}

export type AppLanguage = 'en' | 'hi' | 'ta';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warn' | 'error' | 'success';
  timestamp: string;
  read: boolean;
}

export interface ComplianceRow {
  form: string;
  desc: string;
  dueDate: Date | null;
  note: string;
  mandatory: boolean;
  isPostIncorp?: boolean;
  isAGM?: boolean;
  isAuditReminder?: boolean;
}
