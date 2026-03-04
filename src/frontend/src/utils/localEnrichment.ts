/**
 * Local enrichment storage for InfoVault.
 * Stores per-user enrichment data in localStorage keyed by principal.
 */

export interface AccountEnrichment {
  category?: string;
  favorite?: boolean;
  twoFactorNotes?: string;
  updatedAt?: number; // ms timestamp
}

export interface DocumentEnrichment {
  category?: string;
  favorite?: boolean;
  expiryDate?: string; // ISO date string e.g. "2025-12-31"
  overrideDescription?: string;
}

export interface EnrichmentData {
  accounts: Record<string, AccountEnrichment>;
  documents: Record<string, DocumentEnrichment>;
}

function getStorageKey(principalText: string): string {
  return `infovault:enrichment:${principalText}`;
}

function loadEnrichment(principalText: string): EnrichmentData {
  try {
    const raw = localStorage.getItem(getStorageKey(principalText));
    if (!raw) return { accounts: {}, documents: {} };
    const parsed = JSON.parse(raw);
    return {
      accounts: parsed.accounts ?? {},
      documents: parsed.documents ?? {},
    };
  } catch {
    return { accounts: {}, documents: {} };
  }
}

function saveEnrichment(principalText: string, data: EnrichmentData): void {
  try {
    localStorage.setItem(getStorageKey(principalText), JSON.stringify(data));
  } catch {
    // silently fail if storage is not available
  }
}

export function updateAccountEnrichment(
  principalText: string,
  id: string,
  fields: Partial<AccountEnrichment>,
): void {
  const data = loadEnrichment(principalText);
  data.accounts[id] = { ...data.accounts[id], ...fields };
  saveEnrichment(principalText, data);
}

export function updateDocumentEnrichment(
  principalText: string,
  id: string,
  fields: Partial<DocumentEnrichment>,
): void {
  const data = loadEnrichment(principalText);
  data.documents[id] = { ...data.documents[id], ...fields };
  saveEnrichment(principalText, data);
}

export function deleteAccountEnrichment(
  principalText: string,
  id: string,
): void {
  const data = loadEnrichment(principalText);
  delete data.accounts[id];
  saveEnrichment(principalText, data);
}

export function deleteDocumentEnrichment(
  principalText: string,
  id: string,
): void {
  const data = loadEnrichment(principalText);
  delete data.documents[id];
  saveEnrichment(principalText, data);
}

import { useCallback, useState } from "react";

export function useEnrichment(principalText: string) {
  const [enrichment, setEnrichment] = useState<EnrichmentData>(() =>
    loadEnrichment(principalText),
  );

  const refresh = useCallback(() => {
    setEnrichment(loadEnrichment(principalText));
  }, [principalText]);

  const updateAccount = useCallback(
    (id: string, fields: Partial<AccountEnrichment>) => {
      updateAccountEnrichment(principalText, id, fields);
      setEnrichment(loadEnrichment(principalText));
    },
    [principalText],
  );

  const updateDocument = useCallback(
    (id: string, fields: Partial<DocumentEnrichment>) => {
      updateDocumentEnrichment(principalText, id, fields);
      setEnrichment(loadEnrichment(principalText));
    },
    [principalText],
  );

  const removeAccount = useCallback(
    (id: string) => {
      deleteAccountEnrichment(principalText, id);
      setEnrichment(loadEnrichment(principalText));
    },
    [principalText],
  );

  const removeDocument = useCallback(
    (id: string) => {
      deleteDocumentEnrichment(principalText, id);
      setEnrichment(loadEnrichment(principalText));
    },
    [principalText],
  );

  return {
    enrichment,
    refresh,
    updateAccount,
    updateDocument,
    removeAccount,
    removeDocument,
  };
}
