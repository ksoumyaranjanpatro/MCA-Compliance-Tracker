/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { X, Scale, FileText, CheckCircle2, ChevronRight, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FormRef, AppLanguage } from '../types';

interface FormsDetailModalProps {
  isOpen: boolean;
  formName: string | null;
  onClose: () => void;
  lang: AppLanguage;
  formsList: FormRef[];
}

interface Provision {
  ref: string;
  text: string;
}

interface FormKnowledge {
  why: string;
  provisions: Provision[];
  documents: string[];
  steps: string[];
}

const FORM_KB: Record<string, FormKnowledge> = {
  'AOC-4': {
    why: "Every company registered in India is required to lay down its adopted Financial Statements before its shareholders at the Annual General Meeting (AGM) and file a digitized version with the Registrar of Companies (RoC). This ensures administrative transparency regarding company solvency, dividend declaration, asset backing, and accounting accuracy.",
    provisions: [
      {
        ref: "Section 137, Companies Act 2013 — Filing of Financial Statements",
        text: "Every company shall file a digital copy of its adopted financial statements, including documents required to be attached thereto, with the Registrar of Companies within <strong>30 days</strong> of the concluding AGM date. For One Person Companies (OPC), financial statements must be filed within <strong>180 days</strong> from the close of the financial year. Failure to file on time triggers automatic continuing late penalties under Section 403."
      },
      {
        ref: "Section 129, Companies Act 2013 — True and Fair View",
        text: "Financial statements must give a true and fair view of the state of affairs of the company and comply with standard Accounting Standards notified under Section 133, formulated in the structure outlined in Schedule III of the Act."
      },
      {
        ref: "Section 134, Companies Act 2013 — Board's Report",
        text: "The Board of Directors must affix a signed Board's Report detailing promoters, meeting counts, CSR allocations, loan portfolios, key acquisitions, and a Directors' Responsibility Statement."
      }
    ],
    documents: [
      "Signed Standalone/Consolidated Balance Sheet & Profit & Loss Statement",
      "Statutory Auditor's Report (certified with unique UDIN)",
      "Board of Directors' Report with all required annexures",
      "Notes to Accounts explaining individual ledger groups",
      "Cash Flow Statement (except for small companies and OPCs)",
      "Form AOC-1 (Statement of subsidiary, associate, or joint venture financial summaries)",
      "Digital signatures (DSC) of authorized directors and the certifying Practice CA/CS"
    ],
    steps: [
      "Convene and conclude the Annual General Meeting where shareholders adopt the accounts.",
      "Receive signed copy of Audited Financials with UDIN from the Statutory Auditor.",
      "Compile the e-form AOC-4 on the MCA V3 portal.",
      "Upload required PDF attachments (not exceeding 35MB).",
      "Affix Class-3 Digital Signatures (DSC) of Director and the certifying Practicing Professional.",
      "Pay structural government transaction fee and monitor Service Request Number (SRN) status."
    ]
  },
  'MGT-7': {
    why: "Every active corporate entity must submit an annual synopsis of its equity structures, debentures, share transfer actions, indebtedness register, meeting frequencies, attendance summaries, and managerial salaries within 60 days of their Annual General Meeting.",
    provisions: [
      {
        ref: "Section 92, Companies Act 2013 — Annual Return Specification",
        text: "Every company shall compile a return (Annual Return) detailing registered office setups, indebtedness, directors, partners, shareholder percentages, and dividend records. The return must be filed within <strong>60 days</strong> of the AGM."
      },
      {
        ref: "Section 92(2) — Practicing CS Certification",
        text: "Companies with a paid-up share capital of ₹10 crore or more, or a turnover of ₹50 crore or more, must have their Annual Return certified in Form MGT-8 by an independent Practicing Company Secretary."
      }
    ],
    documents: [
      "Exhaustive list of current shareholders showing capital slices or holdings",
      "Details of share transfers concluded during the financial cycle",
      "Details of registered charges and active liabilities",
      "MGT-8 Certification doc (if capital or turnover thresholds are exceeded)",
      "Date records of held Board, Committee, and General meetings with voting turnouts"
    ],
    steps: [
      "Hold the AGM to establish the yearly parameters.",
      "Compile the shareholding register from the statutory books down to March 31.",
      "Draft the MGT-7 return and procure MGT-8 certification if required.",
      "Affix DSC of an active Director and practicing CS/CA professional.",
      "Submit on the MCA portal and satisfy fees."
    ]
  },
  'MGT-7A': {
    why: "One Person Companies (OPC) and registered Small Companies file a heavily simplified, truncated return in Form MGT-7A which omits promoter profiles, professional certifications, and meeting attendance statistics to minimize compliance friction.",
    provisions: [
      {
        ref: "Rule 11A, Companies (Management and Administration) Rules 2014",
        text: "Provides a streamlined annual return form for small companies and OPCs. No professional certification or audit is required for this filing, significantly lowering operational costs."
      },
      {
        ref: "Section 2(85), Companies Act 2013 — Small Company Definition",
        text: "A company qualifies as a 'Small Company' if its paid-up capital is under ₹4 crore and its annual turnover does not exceed ₹40 crore. Public companies, Section 8 companies, or subsidiaries of large holdings cannot be classified as Small."
      }
    ],
    documents: [
      "Consolidated list of active members/subsidiaries",
      "Details of registered debt charges",
      "Digital signatures (DSC) of sole member or Director"
    ],
    steps: [
      "Compile of year-end directors and member registry.",
      "Map company turnover to confirm it stays within the Small Company tier limits (£40cr).",
      "Upload on the digital system within 60 days of the AGM template."
    ]
  },
  'ADT-1': {
    why: "Companies must officially notify the Registrar of the appointment or renewal of their Statutory Auditor, confirming compliance with qualifications, rotation rules, and terms of service.",
    provisions: [
      {
        ref: "Section 139, Companies Act 2013 — Appointment of auditor",
        text: "The first auditor must be appointed by the Board of Directors within <strong>30 days</strong> of incorporation. Subsequent auditor appointments occur at the AGM for a block of 5 years, and must be reported via ADT-1 within <strong>15 days</strong>."
      }
    ],
    documents: [
      "Auditor's written consent letter confirming availability",
      "Certificate of eligibility from the Auditor confirming they are not disqualified under Section 141",
      "Copy of the AGM or Board resolution passed by members/directors",
      "UDIN and firm registration details"
    ],
    steps: [
      "Pass the appointment resolution during Board or AGM sessions.",
      "Obtain the candidate's active consent or eligibility records.",
      "File ADT-1 on the portal within 15 days of the triggering resolution date."
    ]
  },
  'DIR-12': {
    why: "Ensures any change in directorship—appointment, designation change, resignation, disqualification, or removal—is reported within 30 days of the event, updating the public registry.",
    provisions: [
      {
        ref: "Section 168 & 170, Companies Act 2013 — Directorship Changes",
        text: "Any addition, resignation, or vacation of directorship must be recorded and filed with the RoC within <strong>30 days</strong>. If delayed, subsequent corporate actions cannot be signed safely."
      }
    ],
    documents: [
      "Form DIR-2 (Consent to act as director) for new appointees",
      "Form DIR-8 (Declaration of non-disqualification) for new appointees",
      "Board resolution and formal resignation notice for outgoing directors",
      "PAN, Passport/Utility bills confirming residential address"
    ],
    steps: [
      "Convene a Board Meeting or compile the written resignation letter.",
      "Collect consent letters from incoming candidates.",
      "File DIR-12 with RoC matching the designated event dates."
    ]
  },
  'MSME-1': {
    why: "Companies with outstanding payments to MSME-registered suppliers exceeding 45 days must file half-yearly returns. This promotes prompt settlements for small businesses.",
    provisions: [
      {
        ref: "Section 405, Companies Act 2013 — MSME Protection Mandates",
        text: "Requires half-yearly returns by specified companies whose outstanding dues to Micro & Small enterprises exceed <strong>45 days</strong>. Reports are due by April 30 and October 31 each year."
      }
    ],
    documents: [
      "Full listing of unpaid invoices exceeding 45 days",
      "Udyam registration certificates for each registered MSME vendor",
      "Documented reasons or disputes explaining the payment delay"
    ],
    steps: [
      "Extract accounts payable records matching vendor Udyam profiles.",
      "Identify transactions exceeding 45 days from acceptance.",
      "File MSME-1 detailing names, outstanding sums, and delays."
    ]
  }
};

export default function FormsDetailModal({
  isOpen,
  formName,
  onClose,
  lang,
  formsList
}: FormsDetailModalProps) {
  const [openSectionIdx, setOpenSectionIdx] = useState<number | null>(0);

  if (!isOpen || !formName) return null;

  const formObj = formsList.find(x => x.form === formName);
  if (!formObj) return null;

  const kbItem = FORM_KB[formName] || {
    why: `This form relates to the registration of ${formObj.desc}. It is critical under Indian Regulatory framework to satisfy ${formObj.sec} filings on time to prevent massive multiplier charges.`,
    provisions: [
      {
        ref: `${formObj.sec} — Corporate Governance Compliance`,
        text: `The statutory due date is established as ${formObj.dueInfo}. Failure to transmit records invokes additional fee structures of ${formObj.lateBasis}.`
      }
    ],
    documents: [
      "Certified copy of Board or Shareholder Resolution",
      "Digital signatures (DSC) of authorised directors",
      "Professional practice certification where applicable"
    ],
    steps: [
      "Compile the required documents and pass a Board/General meeting resolution.",
      "Log into the MCA Portal, enter the company parameters, and fill the form fields.",
      "Affix DSC and pay the government transaction fees."
    ]
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs"
        />

        {/* Modal container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative bg-white dark:bg-neutral-900 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-neutral-800 p-6 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-100 dark:border-neutral-800 pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-905 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {formObj.form} — {formObj.desc}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${
                  formObj.type === 'annual'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                }`}>
                  {formObj.type === 'annual' ? 'Annual Filing' : 'Event-Based'}
                </span>
                {formObj.ccfs === 'ccfs2026' && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-md font-bold">
                    CCFS-2026 Eligible ✓
                  </span>
                )}
                {formObj.isLLP && (
                  <span className="text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 px-2.5 py-1 rounded-md font-bold">
                    LLP Form
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 sm:p-2 text-gray-400 hover:text-rose-500 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 space-y-5 overflow-y-auto pr-1">
            {/* Quick Metadata fields */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-neutral-800/40 p-4 rounded-lg border border-gray-100 dark:border-neutral-800/50">
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
                  Section / Rule
                </span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {formObj.sec}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
                  Applicable Entities
                </span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {formObj.entity}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
                  Filing Frequency / Trigger
                </span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {formObj.dueInfo}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
                  Late Fee Structure
                </span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {formObj.lateBasis}
                </span>
              </div>
            </div>

            {/* Why section */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5 matches-left-border">
                <Info className="w-4 h-4" /> Why File This Form?
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-blue-50/5 dark:bg-neutral-800/20 p-3 rounded-md border border-blue-500/10">
                {kbItem.why}
              </p>
            </div>

            {/* Provisions accordions */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5 matches-left-border">
                <Scale className="w-4 h-4" /> Legal Sections &amp; Provisions
              </h4>
              <p className="text-[10px] text-gray-400 italic">Click a section header below to expand full legal text.</p>
              <div className="space-y-1.5">
                {kbItem.provisions.map((prov, i) => (
                  <div
                    key={i}
                    className="border border-gray-100 dark:border-neutral-800 rounded-md overflow-hidden bg-white dark:bg-neutral-900"
                  >
                    <button
                      onClick={() => setOpenSectionIdx(openSectionIdx === i ? null : i)}
                      className="w-full text-left p-3 flex justify-between items-center bg-gray-50/4 hover:bg-gray-50/15 dark:bg-neutral-800/10 dark:hover:bg-neutral-800/25 transition-colors focus:outline-hidden"
                    >
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <ChevronRight className={`w-4 h-4 text-blue-500 transform transition-transform ${openSectionIdx === i ? 'rotate-90' : ''}`} />
                        {prov.ref}
                      </span>
                    </button>
                    {openSectionIdx === i && (
                      <div className="p-3 border-t border-gray-100 dark:border-neutral-800 text-xs text-gray-650 dark:text-gray-300 leading-relaxed prose dark:prose-invert">
                        <div dangerouslySetInnerHTML={{ __html: prov.text }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5 matches-left-border">
                <FileText className="w-4 h-4" /> Documents Required Checklist
              </h4>
              <ul className="space-y-2 pl-1">
                {kbItem.documents.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-gray-650 dark:text-gray-300">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Step checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5 matches-left-border">
                <AlertCircle className="w-4 h-4" /> Steps to File Correctly
              </h4>
              <ol className="space-y-3 pl-1">
                {kbItem.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-xs text-gray-650 dark:text-gray-300">
                    <span className="flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 w-5 h-5 rounded-full font-bold text-[10px] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
