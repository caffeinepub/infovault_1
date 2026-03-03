# InfoVault

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- User authentication and login system
- Dashboard overview showing summary of stored data
- Account Manager: store and manage multiple accounts (service name, username/user ID, password, notes)
- Password visibility toggle for stored passwords
- Personal Document Manager: upload, label, and manage personal documents (PDFs, images, etc.)
- Search and filter across accounts and documents
- Edit and delete functionality for all entries
- Secure, per-user data isolation (each user only sees their own data)

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Select `authorization` component for user login/identity and `blob-storage` for document uploads
2. Backend (Motoko):
   - Data model for Account entries (id, serviceName, username, password, notes, createdAt)
   - CRUD operations: createAccount, getAccounts, updateAccount, deleteAccount
   - Data model for Document entries (id, label, blobId, fileType, createdAt)
   - CRUD operations: uploadDocument (store blob reference), getDocuments, deleteDocument
   - All data scoped per authenticated user principal
3. Frontend:
   - Login/auth gate using authorization component
   - Dashboard with tabs: Accounts, Documents
   - Accounts tab: list of stored accounts with add/edit/delete modals, password show/hide toggle, search bar
   - Documents tab: upload button, list of documents with label, type, download/delete actions
   - Empty states for both tabs
   - Responsive layout
