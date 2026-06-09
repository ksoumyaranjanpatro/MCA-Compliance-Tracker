/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Company, ComplianceRow } from '../types';

export function getFYLabel(fyEndDate: Date): string {
  const yr = fyEndDate.getFullYear();
  return `FY ${yr - 1}–${String(yr).slice(2)}`;
}

export function getFirstFYEnd(incorpDateStr: string): Date {
  const d = new Date(incorpDateStr);
  const yr = d.getFullYear();
  // Simply ends in March 31 of following calendar year
  return new Date(yr + 1, 2, 31);
}

export function getAllFYs(incorpDateStr: string): Date[] {
  const firstFYEnd = getFirstFYEnd(incorpDateStr);
  const today = new Date();
  const list = [firstFYEnd];
  let next = new Date(firstFYEnd.getFullYear() + 1, 2, 31);
  // List all years up to current year + 1 to project deadlines
  while (next.getFullYear() <= today.getFullYear() + 1) {
    list.push(new Date(next));
    next.setFullYear(next.getFullYear() + 1);
  }
  return list;
}

export function generateComplianceRows(c: Company, fyEnd: Date): ComplianceRow[] {
  const rows: ComplianceRow[] = [];
  const isOPC = c.type === 'opc';
  const isLLP = c.type === 'llp';
  const isSmall = c.isSmall;
  const useMGT7A = isOPC || isSmall;
  const incorp = new Date(c.incorp);
  const firstFYEnd = getFirstFYEnd(c.incorp);
  const isFirst = fyEnd.getTime() === firstFYEnd.getTime();

  if (isLLP) {
    rows.push({
      form: 'LLP Form 11',
      desc: 'Annual Return',
      dueDate: new Date(fyEnd.getFullYear(), 4, 30),
      note: 'Due within 60 days of FY closure (30 May).',
      mandatory: true
    });
    rows.push({
      form: 'LLP Form 8',
      desc: 'Statement of Accounts & Solvency',
      dueDate: new Date(fyEnd.getFullYear(), 9, 30),
      note: 'Due within 6 months of FY closure (30 October).',
      mandatory: true
    });
    if (c.capital > 2500000) {
      rows.push({
        form: 'CA Audit',
        desc: 'Mandatory Statutory Audit Review',
        dueDate: new Date(fyEnd.getFullYear(), 9, 30),
        note: 'Triggered audit under Rule 24(8) since total partner contributions exceed ₹25 lakh.',
        mandatory: true,
        isAuditReminder: true
      });
    }
    return rows;
  }

  // Company post incorporation one-time deliverables
  if (isFirst) {
    rows.push({
      form: 'ADT-1',
      desc: 'First Auditor Appointment',
      dueDate: addDays(incorp, 30),
      note: 'Board must appoint first auditor within 30 days of registration.',
      mandatory: true,
      isPostIncorp: true
    });
    if (!isOPC) {
      rows.push({
        form: 'INC-20A',
        desc: 'Declaration - Commencement of Business',
        dueDate: addDays(incorp, 180),
        note: 'Must file bank statement proof of subscription money within 180 days of incorp.',
        mandatory: true,
        isPostIncorp: true
      });
    }
    rows.push({
      form: 'INC-22',
      desc: 'Registered Office Situation Verification',
      dueDate: addDays(incorp, 30),
      note: 'File verified postal premises verification within 30 days of registration.',
      mandatory: true,
      isPostIncorp: true
    });
  }

  if (isOPC) {
    const aocDue = new Date(fyEnd);
    aocDue.setDate(aocDue.getDate() + 180); // ~27 Sep
    const mgtDue = new Date(fyEnd);
    mgtDue.setDate(mgtDue.getDate() + 60);  // ~30 May

    rows.push({
      form: 'MGT-7A',
      desc: 'Annual Return (OPC Simplified)',
      dueDate: mgtDue,
      note: '60 days from FY end. Simplified truncated layout.',
      mandatory: true
    });
    rows.push({
      form: 'AOC-4',
      desc: 'Financial Statements Disclosure',
      dueDate: aocDue,
      note: 'Due within 180 days from closure of financial cycle.',
      mandatory: true
    });
    rows.push({
      form: 'ADT-1',
      desc: 'Auditor Appointment Intimation',
      dueDate: addDays(aocDue, 15),
      note: 'ADT-1 filed within 15 days of written member resolution renewing auditor.',
      mandatory: true
    });
  } else {
    let agmDue = new Date(fyEnd);
    if (isFirst) {
      agmDue.setMonth(agmDue.getMonth() + 9);
    } else {
      agmDue.setMonth(agmDue.getMonth() + 6); // 30 Sep
    }

    rows.push({
      form: 'AGM',
      desc: 'Annual General Meeting',
      dueDate: agmDue,
      note: 'Section 96 proviso statutory conclave.',
      mandatory: true,
      isAGM: true
    });

    const aocDue = new Date(agmDue);
    aocDue.setDate(aocDue.getDate() + 30);
    rows.push({
      form: 'AOC-4',
      desc: 'Financial Statements Filing',
      dueDate: aocDue,
      note: 'Due within 30 days of AGM adoption.',
      mandatory: true
    });

    const mgtDue = new Date(agmDue);
    mgtDue.setDate(mgtDue.getDate() + 60);
    rows.push({
      form: useMGT7A ? 'MGT-7A' : 'MGT-7',
      desc: 'Annual Return',
      dueDate: mgtDue,
      note: `Due within 60 days of AGM adoption.`,
      mandatory: true
    });

    rows.push({
      form: 'ADT-1',
      desc: 'Auditor Appointment Return',
      dueDate: addDays(agmDue, 15),
      note: 'ADT-1 filed within 15 days of auditor appointment at AGM.',
      mandatory: true
    });
  }

  return rows;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
