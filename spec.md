# InfoVault

## Current State
- Documents tab allows uploading files (via blob storage), viewing a list with metadata (name, type, size, date), and actions: favorite, edit metadata, delete.
- Categories for both documents and accounts are hardcoded constant arrays (`DOC_CATEGORIES`, `ACCOUNT_CATEGORIES`) -- users cannot create their own.
- No view or download functionality exists for uploaded documents.
- `StorageClient.getDirectURL(hash)` is available and returns a direct URL to retrieve a blob from storage.
- Enrichment data (category, favorite, expiry, etc.) is stored in localStorage via `localEnrichment.ts`.

## Requested Changes (Diff)

### Add
- **Download button** on each document row (next to edit/delete), triggers browser download of the file using the blob URL from `StorageClient.getDirectURL(blobId)`.
- **Click-to-view on document name**: clicking the document name/description opens a viewer modal/dialog showing the file in its original form:
  - Images (image/*): render as `<img>` tag
  - PDFs (application/pdf): render in an `<iframe>` or `<object>` tag
  - Videos (video/*): render in a `<video>` tag
  - Audio (audio/*): render in an `<audio>` tag
  - Other file types: show a "Preview not available" message with a prominent download button
- **Custom categories for Documents**: replace the hardcoded `DOC_CATEGORIES` const array with a dynamic list stored in localStorage. Add a "+ New Category" option at the bottom of the category select dropdown in both the upload modal and edit modal, which opens a small inline input (or popover) to type and save a custom category name. Custom categories are stored in localStorage alongside the enrichment data (per user/principal). The filter dropdown in the toolbar also shows custom categories.
- **Custom categories for Accounts**: same pattern -- replace hardcoded `ACCOUNT_CATEGORIES` with a dynamic list from localStorage. Add "+ New Category" to the category select in the Add/Edit Account modal and in the filter toolbar.

### Modify
- `localEnrichment.ts`: add storage for custom document categories and custom account categories (arrays in `EnrichmentData`), with helper functions and hooks to add/read them.
- `DocumentsTab.tsx`: wire up download button, document name click -> viewer modal, and dynamic category management.
- `AccountsTab.tsx`: wire up dynamic category management (same pattern as documents).
- `DocumentRow` component: add download icon button; make description text a clickable link/button that opens the viewer.

### Remove
- Hardcoded `DOC_CATEGORIES` and `ACCOUNT_CATEGORIES` constant arrays (replace with dynamic lists that start with the same defaults).

## Implementation Plan
1. Update `localEnrichment.ts`:
   - Add `customDocCategories: string[]` and `customAccountCategories: string[]` to `EnrichmentData`.
   - Add `addDocCategory` / `addAccountCategory` helper functions.
   - Expose `addDocCategory` / `addAccountCategory` in the `useEnrichment` hook.
   - Default category lists remain the same; custom ones are appended.

2. Update `DocumentsTab.tsx`:
   - Replace hardcoded `DOC_CATEGORIES` with a derived list: defaults + custom categories from enrichment.
   - Add download button to `DocumentRow` (uses `StorageClient.getDirectURL` + `useActor` to build the URL, then triggers `<a download>` click).
   - Make document name/description a clickable button that sets a `viewTarget` state.
   - Add a viewer `<Dialog>` that fetches the blob URL and renders appropriately based on `fileType`.
   - Add "+ New Category" as the last item in category selects; clicking it shows an inline input to create and save a custom category.

3. Update `AccountsTab.tsx`:
   - Replace hardcoded `ACCOUNT_CATEGORIES` with defaults + custom categories from enrichment.
   - Add "+ New Category" option in the category select dropdowns (Add/Edit modal and filter toolbar).

4. Use `useActor` and `StorageClient` (from `useActor` hook or direct instantiation with config) to generate download/view URLs per document.
