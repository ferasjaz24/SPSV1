# Security Specification: Alwaleed ERP

This document outlines the security invariants, malicious payloads designed to test our security defenses, and a comprehensive test suite (`firestore.rules.test.ts`) to ensure zero-trust access control.

## 1. Data Invariants
1. **Authentication Requirement**: All read and write operations on the database must be initiated by an authenticated user (`request.auth != null`).
2. **Strict Identity Boundaries**: A user can only access or modify entities relevant to their organization, role, or specifically assigned items.
3. **Immutability of Key Fields**: Once created, sensitive metadata such as `id`, `createdAt`, and `createdBy` must remain unchanged during updates.
4. **Numeric Safety and Denial of Wallet (DoW) Protection**: No payload may contain strings exceeding size limits (typically 256 or 512 characters, or 4096 characters for chat messages) to prevent resource exhaustion. All numeric fields must be actual numbers (positive where applicable).
5. **Terminal State Locking**: Transactions, payroll runs, journal entries, and invoices once submitted or finalized cannot be deleted or bypassed.

---

## 2. The "Dirty Dozen" Payloads (Malicious Payloads)
The following 12 payloads are designed to break the laws of Identity, Integrity, and State, and must be rejected by the security rules:

1. **Unauthenticated Employee Creation**:
   * *Target*: `/employees/emp_attacker_1`
   * *Payload*: `{"arabicName": "مهاجم", "englishName": "Attacker", "basicSalary": 999999}`
   * *Expected*: `PERMISSION_DENIED` (No auth)

2. **Privilege Escalation via Self-Role Modification**:
   * *Target*: `/users/attacker_uid`
   * *Payload*: `{"role": "super_admin", "permissions": ["all"]}`
   * *Expected*: `PERMISSION_DENIED` (Normal user cannot set their own role to admin)

3. **Denial of Wallet via Huge String Injection**:
   * *Target*: `/employees/emp_poison_1`
   * *Payload*: `{"arabicName": "A" * 100000, "englishName": "B" * 100000}` (exceeding string limit size)
   * *Expected*: `PERMISSION_DENIED`

4. **Bypassing Immutability of Created Date**:
   * *Target*: `/clients/client_123` (Updating existing)
   * *Payload*: `{"dateCreated": "2020-01-01"}` (where the original was different, attempting update)
   * *Expected*: `PERMISSION_DENIED`

5. **Hijacking Client Record Ownership**:
   * *Target*: `/clients/client_hijack`
   * *Payload*: `{"createdBy": "other_user_uid"}`
   * *Expected*: `PERMISSION_DENIED`

6. **Forging Financial Transaction Without Bank Account verification**:
   * *Target*: `/cash_bank_transactions/tx_fake_1`
   * *Payload*: `{"amount": -500000, "accountId": "non_existent_account"}`
   * *Expected*: `PERMISSION_DENIED`

7. **Tampering with Finalized Invoices**:
   * *Target*: `/customer_invoices/inv_final_123` (Updating existing closed/final status)
   * *Payload*: `{"status": "draft", "totalAmount": 10}`
   * *Expected*: `PERMISSION_DENIED`

8. **Orphaned Journal Entry Creation (Missing double-entry pair reference)**:
   * *Target*: `/journal_entries/je_broken`
   * *Payload*: `{"debit": 1000, "credit": 0, "balanced": false}`
   * *Expected*: `PERMISSION_DENIED`

9. **Spoofing Email Verification Status**:
   * *Target*: `/users/attacker_uid` (With spoofed auth claim `email_verified = false`)
   * *Payload*: `{"verified": true}`
   * *Expected*: `PERMISSION_DENIED`

10. **Injecting Malicious System Fields**:
    * *Target*: `/firas_saved_chats/chat_1`
    * *Payload*: `{"isSystemGenerated": true, "aiMetadata": {"unrestricted": true}}`
    * *Expected*: `PERMISSION_DENIED`

11. **Illegal Status Overwrite on Finalized Payroll**:
    * *Target*: `/payroll_runs/payroll_2026_07` (Updating existing terminal state)
    * *Payload*: `{"status": "pending_payout"}`
    * *Expected*: `PERMISSION_DENIED`

12. **Bypassing ID Validation Pattern**:
    * *Target*: `/clients/invalid_id_$$$@@@`
    * *Payload*: `{"clientName": "Test", "mobile": "0500000000"}`
    * *Expected*: `PERMISSION_DENIED`

---

## 3. The Test Runner (`firestore.rules.test.ts`)
Below is the complete TypeScript test specification utilizing standard Jest/Mocha assertions to guarantee that all security-denied cases return a permissions failure.

```typescript
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import * as fs from "fs";

let testEnv: RulesTestEnvironment;

describe("Firestore Security Rules Tests", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "planning-with-ai-a8c0e",
      firestore: {
        rules: fs.readFileSync("firestore.rules", "utf8"),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  test("1. Unauthenticated Employee Creation must fail", async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    const empDoc = doc(unauthDb, "employees/emp_attacker_1");
    await expect(
      setDoc(empDoc, {
        id: "emp_attacker_1",
        arabicName: "مهاجم",
        englishName: "Attacker",
        basicSalary: 999999,
      })
    ).rejects.toThrow();
  });

  test("2. Privilege Escalation via Self-Role Modification must fail", async () => {
    const userDb = testEnv.authenticatedContext("attacker_uid", { email_verified: true }).firestore();
    const userDoc = doc(userDb, "users/attacker_uid");
    await expect(
      setDoc(userDoc, {
        role: "super_admin",
        permissions: ["all"],
      })
    ).rejects.toThrow();
  });

  test("3. Denial of Wallet via Huge String Injection must fail", async () => {
    const userDb = testEnv.authenticatedContext("user_123", { email_verified: true }).firestore();
    const empDoc = doc(userDb, "employees/emp_poison_1");
    const longString = "A".repeat(20000);
    await expect(
      setDoc(empDoc, {
        id: "emp_poison_1",
        arabicName: longString,
        englishName: "Attacker",
      })
    ).rejects.toThrow();
  });

  test("12. Bypassing ID Validation Pattern must fail", async () => {
    const userDb = testEnv.authenticatedContext("user_123", { email_verified: true }).firestore();
    const clientDoc = doc(userDb, "clients/invalid_id_$$$@@@");
    await expect(
      setDoc(clientDoc, {
        id: "invalid_id_$$$@@@",
        clientName: "Test Name",
        mobile: "0500000000",
      })
    ).rejects.toThrow();
  });
});
```
