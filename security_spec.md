# Security Specification: MCA Compliance Tracker Cloud Database

This specification details the mathematical and structural invariants of the real-time cloud database, outlining defensive countermeasures against privilege escalation, state spoofing, and resource poisoning.

## 1. Data Invariants

- **Ownership Integrity**: Every company compliance document stored at `/companies/{companyId}` must possess a `userId` field exactly matching the authenticated user's UID (`request.auth.uid`). No tenant can read, modify, or delete a profile belonging to another user.
- **Strict Verification**: Write access requires that the user's email is verified by Firebase Google Authentication (`request.auth.token.email_verified == true`).
- **Temporal Verification**: The `savedAt` timestamp must correspond to the server's time balance, protecting against client-clock tampering.
- **Type Constraints**: Crucial parameters such as `capital` (number, non-negative) and `type` (enum limit) must strictly conform to their schema definitions to prevent value poisoning or database latency expansion.

## 2. The "Dirty Dozen" Attack Vectors

These payloads are designed to attack the system rules. Our security architecture ensures each vector returns `PERMISSION_DENIED`:

1. **Owner Spoofing (Create)**: A user authenticated as `UID_ALICE` attempts to write a profile setting `userId` to `UID_BOB` (denied via schema matching).
2. **Global Query Scrape (Read)**: A signed-in user tries to listen to the entire `/companies` collection without limiting the query where clause to `userId == request.auth.uid` (denied via resource evaluations).
3. **Cross-Tenant Edit (Update)**: A user authenticated as `UID_ALICE` attempts to update a document at `/companies/charles_co_id` which has `existing().userId == "UID_BOB"` (denied via existing checks).
4. **Cross-Tenant Delete (Delete)**: A user attempts to delete a profile belonging to another tenant (denied via resource comparison).
5. **Ghost Field Injection (Update)**: An attacker pushes an update payload including a secret field like `isAdmin: true` or `isSuperUser: true` to hijack system rights (denied via strict `.affectedKeys()` validation).
6. **No-Authentication Creation (Create)**: An unauthenticated guest attempts to write a document at `/companies/anyId` (denied via auth check).
7. **Junk Character ID Attack (Create)**: An attacker attempts to create a document with a massive 10KB junk-character ID string to saturate index memory and induce wallet exhaustion (denied via `isValidId` string size and regex constraints).
8. **Invalid Entity Code Injection (Create)**: Pushing a company document where `type` is set to `"malicious_script"` or `"corporation_unlimited"` instead of the strict list of legal Indian corporate variants (denied via string limits and schema check).
9. **Negative Capital Value Poisoning (Update)**: Editing a company profile to set `capital` to a negative amount `-\u20B99,999,999` to break the late-fee computation slabs (denied via numeric validators).
10. **Timestamp Tampering (Create)**: Alice submits a company record with a hardcoded old timestamp `savedAt: "1970-01-01"` to evade historical audits (denied via server-timed `request.time` check).
11. **Unverified Email Access (Create)**: A user with a fraudulent self-signed email (where `email_verified == false`) attempts to construct records (denied via `email_verified == true` mandate).
12. **Array Saturation (Update)**: An attacker attempts to inject a 10,000-element array into the `customForms` parameter to exceed firestore limits and trigger a denial-of-wallet exception (denied via strict sub-array size constraints).

## 3. Test Verification Rules

Our security specifications will be implemented and audited using ESLint (`@firebase/eslint-plugin-security-rules`) and verified against the following rule-set in `firestore.rules`.
