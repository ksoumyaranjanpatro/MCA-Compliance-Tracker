/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface McaActChapter {
  chapter: string;
  title: string;
  sections: string;
  description: string;
  keyAxioms: string[];
  associatedForms: string[];
}

export interface McaRuleSet {
  ruleName: string;
  year: number;
  description: string;
  coverage: string;
  keyCompliancePoints: string[];
  associatedForms: string[];
}

export const COMPANIES_ACT_CHAPTERS: McaActChapter[] = [
  {
    chapter: "Chapter I",
    title: "Preliminary",
    sections: "Sections 1 - 2",
    description: "Defines the scope, applicability, and legal taxonomy of terms used across corporate laws, including 'associate company', 'holding company', 'subsidiary', 'small company', and 'one person company'.",
    keyAxioms: [
      "Sec 2(46): Definition of Holding Company based on equity or board composition control.",
      "Sec 2(85): Small Company thresholds of paid-up capital and turnover defining relaxation eligibilities.",
      "Sec 2(62): One Person Company framework definition allowing unified single-member incorporation."
    ],
    associatedForms: ["INC-32 (SPICe+)", "INC-3"]
  },
  {
    chapter: "Chapter II",
    title: "Incorporation of Company & Matters Incidental",
    sections: "Sections 3 - 22",
    description: "Lays down statutory protocols for company formation, filing memorandums (MoA) and articles (AoA), altering association deeds, registered office locations, and service of documents.",
    keyAxioms: [
      "Sec 7: Formalities and mandatory documents required for successful registrar upload.",
      "Sec 12: Registered office establishment within 30 days of certificate receipt and physical verification.",
      "Sec 13: Alteration of Memorandum of Association requiring Special Resolutions."
    ],
    associatedForms: ["INC-32", "INC-33 (SPICe+ MoA)", "INC-34 (SPICe+ AoA)", "INC-22", "INC-20A"]
  },
  {
    chapter: "Chapter III",
    title: "Prospectus & Allotment of Securities",
    sections: "Sections 23 - 42",
    description: "Regulates public offers, private placements, shelf prospectus, dematerialization of share certificates, and liability for misstatements in offer documents.",
    keyAxioms: [
      "Sec 39: Minimum subscription requirements and timelines for filing allotment reports.",
      "Sec 42: Rigid guidelines governing Private Placement offers to select identified persons."
    ],
    associatedForms: ["PAS-3", "PAS-4", "PAS-5", "PAS-6"]
  },
  {
    chapter: "Chapter IV",
    title: "Share Capital and Debentures",
    sections: "Sections 43 - 72",
    description: "Deals with types of share capital, voting rights, calls on shares, transfer/transmission of securities, buyback restrictions, and debenture certificates.",
    keyAxioms: [
      "Sec 62: Rights issues, preferential issues, and employee stock options protocols.",
      "Sec 66: High Court/Tribunal sanction requirements for equity capital reduction schemes."
    ],
    associatedForms: ["SH-7", "SH-8", "SH-9", "SH-11"]
  },
  {
    chapter: "Chapter V",
    title: "Acceptance of Deposits by Companies",
    sections: "Sections 73 - 76A",
    description: "Sets crucial constraints to prevent unauthorized public deposit taking, detailing exemption conditions and mandatory liquid reserves.",
    keyAxioms: [
      "Sec 73: Absolute prohibition on members' public deposits without circular approval.",
      "Sec 74: Urgent repayment mandate of pre-existing deposits under historical legal systems."
    ],
    associatedForms: ["DPT-3", "DPT-1"]
  },
  {
    chapter: "Chapter VI",
    title: "Registration of Charges",
    sections: "Sections 77 - 87",
    description: "Stipulates that any security interest or mortgage created on company assets must be registered publicly with the MCA to serve as construct public notice.",
    keyAxioms: [
      "Sec 77: Mandates filing details of created or modified charge within 30 days of execution.",
      "Sec 82: Submission to the registrar for satisfaction certificate when loans are completely repaid."
    ],
    associatedForms: ["CHG-1", "CHG-4", "CHG-9"]
  },
  {
    chapter: "Chapter VII",
    title: "Management and Administration",
    sections: "Sections 88 - 122",
    description: "Forms the bedrock of statutory administration, prescribing registers of members, location of statutory registers, Annual General Meetings (AGM), voting, and minute books.",
    keyAxioms: [
      "Sec 92: Filing of Annual Return containing director holdings, debt, and share transfers.",
      "Sec 96: Mandatorily convening Annual General Meetings within 6 months of corporate fiscal year-end.",
      "Sec 117: Submitting special resolutions or major board actions within 30 days."
    ],
    associatedForms: ["MGT-7", "MGT-7A", "MGT-14", "MGT-15", "MGT-10"]
  },
  {
    chapter: "Chapter IX",
    title: "Accounts of Companies",
    sections: "Sections 128 - 138",
    description: "Governs double-entry bookkeeping, physical/electronic books location, financial statements, board reports, corporate social responsibility (CSR) budgets, and internal audits.",
    keyAxioms: [
      "Sec 128: Bookkeeping must follow accrual guidelines reflecting a true and fair view.",
      "Sec 135: Mandatory allocation of 2% average net-profit for CSR activities of large entities.",
      "Sec 137: Compulsory filing of approved financial statements with registrar."
    ],
    associatedForms: ["AOC-4", "AOC-4 XBRL", "AOC-4 CFS", "MSME-1"]
  },
  {
    chapter: "Chapter X",
    title: "Audit and Auditors",
    sections: "Sections 139 - 148",
    description: "Prescribes qualifications, appointment rules, rotation periods, auditor resignations, reporting duties, and central government-sanctioned Cost Audit structures.",
    keyAxioms: [
      "Sec 139: Auditor appointments made during AGMs for contiguous terms of 5 years.",
      "Sec 140: Retiring auditors or resigning auditors must file formal reasons to the Ministry.",
      "Sec 143: Auditor duty to report instances of corporate fraud directly to the board or central government."
    ],
    associatedForms: ["ADT-1", "ADT-3", "CRA-4"]
  }
];

export const LLP_ACT_CHAPTERS: McaActChapter[] = [
  {
    chapter: "Chapter I-II",
    title: "LLP Preliminary & Nature",
    sections: "Sections 1 - 10",
    description: "Statutory framework for Limited Liability Partnership as a body corporate having perpetual succession and distinct legal identity separate from partners.",
    keyAxioms: [
      "Sec 3: Mutual agency is between partner and LLP, not between partners themselves.",
      "Sec 5: Partners can be individuals or corporate bodies.",
      "Sec 7: Requirement of at least two designated partners (DPs), with at least one resident in India."
    ],
    associatedForms: ["FiLLiP", "Form 7", "Form 1"]
  },
  {
    chapter: "Chapter III-IV",
    title: "Incorporation & Partners Relations",
    sections: "Sections 11 - 25",
    description: "Deals with the filing of incorporation documents, registration of LLP agreements, change of registered offices, and relations between partners.",
    keyAxioms: [
      "Sec 11: Absolute requirement of filing incorporation statement.",
      "Sec 23: Direct mandate to file LLP agreement or any subsequent modifications with Registrar on Form 3."
    ],
    associatedForms: ["LLP Form 3", "LLP Form 4", "LLP Form 5", "LLP Form 6"]
  },
  {
    chapter: "Chapter VII",
    title: "LLP Financial Disclosures & Returns",
    sections: "Sections 34 - 35",
    description: "Mandates proper accounting, preparation of Solvency Statement, and the submission of yearly returns to register performance metrics.",
    keyAxioms: [
      "Sec 34: Filing of Statement of Account & Solvency within 30 days from end of 6 months of FY.",
      "Sec 35: Filing of Annual Return within 60 days from the closure of financial year."
    ],
    associatedForms: ["LLP Form 8", "LLP Form 11"]
  }
];

export const MCA_RULES_SET: McaRuleSet[] = [
  {
    ruleName: "Companies (Accounts) Rules",
    year: 2014,
    description: "Regulates modern book-keeping standards, physical or electronic accessibility, consolidation parameters, and board report contents.",
    coverage: "Sec 128, 129, 134, 137",
    keyCompliancePoints: [
      "Maintenance of accounting standards on accrual system with active edit log features.",
      "Filing financial reports using standard electronic format within due parameters."
    ],
    associatedForms: ["AOC-4", "AOC-4 CFS", "AOC-4 XBRL"]
  },
  {
    ruleName: "Companies (Management and Administration) Rules",
    year: 2014,
    description: "Governs convening of meetings, proxy criteria, voting procedures, annual return templates, and register inspection.",
    coverage: "Sec 88 - 122",
    keyCompliancePoints: [
      "Regular compilation of Member registers in alphabetical order with active updates.",
      "Completion of systematic annual disclosures via MGT e-forms."
    ],
    associatedForms: ["MGT-7", "MGT-7A", "MGT-14", "MGT-15"]
  },
  {
    ruleName: "Companies (Audit and Auditors) Rules",
    year: 2014,
    description: "Examines auditor competency metrics, limit constraints on director audits, resignation, and special reporting channels.",
    coverage: "Sec 139 - 147",
    keyCompliancePoints: [
      "Filing electronic notification lists of auditor appointments within 15 days of AGM.",
      "Ensuring resignations are reported within 30 days."
    ],
    associatedForms: ["ADT-1", "ADT-3"]
  },
  {
    ruleName: "Limited Liability Partnership Rules",
    year: 2009,
    description: "General framework for partners, name reservations, conversions, striking-off, and statutory filings of LLP.",
    coverage: "LLP Act 2008",
    keyCompliancePoints: [
      "Uploading signed agreements using dynamic forms within 30 days of registration.",
      "Routine annual filing of Solvency and returns."
    ],
    associatedForms: ["LLP Form 3", "LLP Form 4", "LLP Form 8", "LLP Form 11"]
  }
];
