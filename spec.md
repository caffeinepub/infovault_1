# InfoVault

## Current State

InfoVault is a personal information management app with:
- Internet Identity authentication
- Accounts vault: store service credentials (serviceName, username, password, notes) with masked password display, show/hide toggle, copy, edit, delete, and search
- Documents safe: upload files via blob-storage, list with type/size/date metadata, delete
- User profile: display name setup on first login
- Backend stores accounts as `Map<Principal, Map<Text, Account>>` and documents as `Map<Principal, Map<Text, Document>>`, both keyed by service name / blobId

Missing from current backend: category/tag fields, favorite flag, lastUpdatedAt timestamps, document expiry date, 2FA notes field on accounts.

## Requested Changes (Diff)

### Add

**Security & Access**
- Password Generator: inline tool in the account add/edit form — generates random passwords with configurable length (8–32) and toggleable character sets (uppercase, lowercase, numbers, symbols); generates on button click
- Password Strength Indicator: visual strength meter (Weak/Fair/Strong/Very Strong) with color-coded bar shown in real-time as user types password in add/edit form
- Auto-lock / Session Timeout: after 5 minutes of inactivity, clear the auth session and redirect to login with a "Session expired" toast

**Organization**
- Categories & Tags: accounts can have an optional category (Banking, Work, Social, Shopping, Entertainment, Other); documents can have an optional category (ID, Contract, Receipt, Medical, Financial, Other); categories shown as colored badges; filterable by category via dropdown
- Search & Filter: already exists for accounts; add to documents tab too; add category filter dropdown to both tabs
- Favorites / Pin: accounts and documents each have a `favorite` boolean; pinned items appear at top of list with a star icon; click star to toggle

**Documents**
- Document Categories: as above, filter/badge per category
- Expiry Reminders: documents can have an optional `expiryDate` (Text, ISO date string); shown in document row; items expiring within 30 days shown with a yellow warning badge; expired items shown with a red badge

**Accounts / Credentials**
- Two-Factor Auth Notes: add a `twoFactorNotes` field to accounts (store backup codes, TOTP secrets)
- Last Updated Timestamps: accounts gain a `updatedAt` field; shown in the account row as "Updated X days ago"
- Breach Alerts (simulated): on the accounts list, flag any account whose password is fewer than 8 characters or reused across multiple accounts with a red shield icon tooltip

**Profile & Settings**
- Security Dashboard: new "Security" tab in the main dashboard showing: total accounts, total documents, count of weak passwords, count of reused passwords, count of expiring documents, count of favorites; visual summary cards
- Export / Backup: "Export Vault" button on the Security tab that downloads a JSON file of all accounts and documents (passwords included) as a local file; no server involvement
- Dark Mode Toggle: toggle in the header to switch between dark and light themes; persisted to localStorage

### Modify

- `Account` backend type: add `category`, `favorite`, `twoFactorNotes`, `updatedAt` fields
- `Document` backend type: add `category`, `favorite`, `expiryDate` fields
- `createAccount` and `updateAccount` backend functions: accept new fields
- `createDocument` backend function: accept new fields
- `updateDocument` (new): allow updating document metadata (category, favorite, expiryDate)
- Dashboard: add "Security" tab alongside Accounts and Documents
- Header: add dark mode toggle button
- AccountsTab: category filter dropdown, favorites at top, strength meter, generator, 2FA notes field, updatedAt display, breach alert icons
- DocumentsTab: search input, category filter dropdown, favorites at top, expiry date field and badges, update document metadata

### Remove

Nothing removed.

## Implementation Plan

1. Update Motoko backend: extend Account and Document types with new fields; update create/update functions to accept new fields; add updateDocument function
2. Update backend.d.ts to reflect new types and functions
3. Update useQueries.ts hooks: update createAccount/updateAccount/createDocument to pass new fields; add useUpdateDocument hook
4. Build PasswordGenerator component (inline in account form)
5. Build PasswordStrengthIndicator component
6. Update AccountsTab: add category, favorite, twoFactorNotes fields to form; strength meter; generator; updatedAt; category filter; favorites pinned; breach alert
7. Update DocumentsTab: add search, category filter, favorite toggle, expiryDate field; update document metadata via updateDocument
8. Build SecurityDashboard component: summary stats cards, export vault button
9. Update Dashboard: add Security tab, dark mode toggle in header, wire theme context
10. Add dark mode: ThemeContext with localStorage persistence; toggle in Header; apply `dark` class to root
