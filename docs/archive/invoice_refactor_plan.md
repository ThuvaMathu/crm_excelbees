# Invoice Refactor Plan

## 1. Visual Specification (Template Deconstruction)
Based on the provided `MkEnterprises-Invoice-EBMK-03` template, the PDF follows a clean, modern structure:

*   **Header (Top):**
    *   **Left:** Company Logo (ExcelBees) with subtext "Web Solutions & Digital Marketing".
    *   **Right:** "INVOICE" title (large, bold, right-aligned) with the domain "EXCELBEES.COM" underneath.
    *   **Divider:** A thin multi-colored accent line (Orange/Navy) separating the header from the content.
*   **Meta Information (Middle):**
    *   **Left (Bill To):** "Invoice to :", Client Name (Bold), Contact Name, Phone, Email.
    *   **Right (Details):** "Invoice no : EXB-1020" (Bold), Date (09 Feb 2026).
*   **Table Structure:**
    *   **Headers:** Dark gray background block with white bold text (`DESCRIPTION`, `PRICE`, `QTY`, `TOTAL`).
    *   **Rows:** Clean white rows with a simple bottom border separator.
    *   **Data formatting:** Prices shown with `$` symbol.
*   **Footer & Totals:**
    *   **Totals:** A floating subset aligned right for `SUB-TOTAL` and `TOTAL` (The `TOTAL` block uses a dark background with white text).
    *   **Payment Method:** A dark header block for "PAYMENT METHOD :", followed by PayID information.
    *   **Signatures & Terms:** "Thank you for business with us!". Terms and conditions block on the left (30 days logic, 10% interest). On the right, the exact Administrator name, Title, and ABN.
    *   **Bottom Bar:** A matching multi-colored accent line, followed by footer contact info with small icons (Phone, Email, Website) spanning the bottom perfectly horizontally.

## 2. Technical Root Cause Analysis

### A. Non-Sequential / Random Invoice Numbers
The codebase natively uses `lib/firestore/invoice-number-generator.ts` to manage the sequence.
*   **The Error:** When the system fetches `settings` via `getUserInvoiceSettings(userId)`, if there is any network delay, missing initialization document, or error, the `try/catch` block falls back to generating a pseudo-random timestamp string: ``INV-${String(Date.now()).slice(-6)}``.
*   **The Second Flaw (Concurrency):** The `generateNextInvoiceNumber` function reads the current number, adds 1, and writes it back using separate asynchronous calls. Under concurrent load (e.g., an admin double-clicking "Create"), this causes a race condition leading to duplicate numbers. It completely lacks a locking mechanism or a Firestore Transaction.

### B. Missing Company Logo
The PDF generator (`lib/pdf/invoice-generator.ts`) utilizes standard `fetch()` to download the `settings.logoUrl` and convert it to Base64 using a `FileReader`.
*   **The Error:** It uses `mode: 'cors'`. If the logo is hosted on Firebase Storage (or any external S3 bucket), and that bucket does not have explicit CORS headers configured allowing the frontend's specific domain to execute `GET` requests, the browser fundamentally blocks the canvas/fetch from reading the image data. The catch block triggers, silently ignoring the logo.

### C. Design Mismatch
*   **The Engine:** The system currently uses `jsPDF` paired with `jspdf-autotable`. While functional for basic data dumping, `jsPDF` relies on exact XY coordinate mapping. Reproducing the highly bespoke headers, footer alignments, dark-bg blocks, and flex-like column layouts of the provided template is extremely brittle and virtually impossible to maintain perfectly at varying page lengths using raw Canvas coordinates.

## 3. Step-by-Step Implementation Plan

### Step 1: Migrate PDF Engine
*   **Action:** Replace `jsPDF` with `@react-pdf/renderer` (Recommended) or a Server-Side HTML-to-PDF engine (like Vercel OG or Puppeteer).
*   **Why:** `@react-pdf/renderer` allows us to build the exact template using React components and Flexbox styling (`<View>`, `<Text>`, `<Image>`), guaranteeing a pixel-perfect replica of the provided template layout while easily handling page breaks.
*   **Task:** Rewrite `lib/pdf/invoice-generator.ts` to return a React-PDF document stream instead of a jsPDF blob.

### Step 2: Fix Logo Embedding & CORS
*   **Action A (Storage):** Execute a `gsutil cors set cors.json gs://<your-bucket-name>` command on the Firebase project to allow `GET` requests from your domains.
*   **Action B (Engine):** With `@react-pdf/renderer`, images are passed directly natively via URL without requiring manual Base64 `FileReader` conversion hacks, completely bypassing standard browser Canvas taint issues.

### Step 3: Implement Transactional Sequencing
*   **Action:** Rewrite `generateNextInvoiceNumber` in `lib/firestore/invoice-number-generator.ts`.
*   **Task:** Use a Firebase `runTransaction`.
    ```typescript
    await runTransaction(db, async (transaction) => {
        const settingsDoc = await transaction.get(userSettingsRef);
        const currentNum = settingsDoc.data().nextInvoiceNumber || 1;
        transaction.update(userSettingsRef, { nextInvoiceNumber: currentNum + 1 });
        return currentNum;
    });
    ```
*   **Why:** Transactions guarantee atomic increments, meaning even with 100 simultaneous requests, no two invoices will ever share the same number. Remove the random timestamp fallback and replace it with a hard error catch to explicitly prevent random generation.

### Step 4: Admin Settings UI Update
*   **Action:** Verify `components/invoices/InvoiceSettingsModal.tsx` contains the fields for `invoicePrefix` (e.g., "EXB-") and `nextInvoiceNumber` (e.g., "1020").
*   **Task:** Ensure the setup directly writes to the settings document that the new Transactional Sequencer targets, allowing the administrator tight control over the starting digit.

## 4. Risk Assessment

1. **PDF Engine Migration Latency:** Moving to `@react-pdf/renderer` adds slightly more weight to the bundle size or requires the generation to be offloaded to a Node.js API route rather than entirely client-side if performance drops. Server-side generation is safer for consistent font rendering.
2. **Font Loading Failures:** The custom fonts in the template (likely Montserrat or Poppins) must be explicitly registered in the new engine via `.ttf` static URLs, or they will fallback to Times New Roman.
3. **Concurrency Bottlenecks:** While Firestore Transactions securely fix the sequence duplicates, if a massive bulk-generation occurs simultaneously, the transaction will retry multiple times. For a small CRM, this is a non-issue, but it's important to know the limits of document contention.
