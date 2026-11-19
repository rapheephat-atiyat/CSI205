"use client";

import { scanHistory as seedHistory, staffProfile as defaultProfile, type ScanRecord } from "./staff-mock";

const STORAGE_SCAN_KEY = "tuatua_staff_scans";
const STORAGE_QUOTA_KEY = "tuatua_staff_quota";

export function getStoredScans(): ScanRecord[] {
  if (typeof window === "undefined") return seedHistory;
  try {
    const raw = localStorage.getItem(STORAGE_SCAN_KEY);
    if (!raw) return seedHistory;
    const parsed = JSON.parse(raw) as ScanRecord[];
    // Merge with seedHistory avoiding duplicates by id
    const existingIds = new Set(parsed.map((s) => s.id));
    const merged = [...parsed, ...seedHistory.filter((s) => !existingIds.has(s.id))];
    return merged;
  } catch {
    return seedHistory;
  }
}

export function saveScanRecord(record: Omit<ScanRecord, "id"> & { id?: string }): ScanRecord {
  const newRecord: ScanRecord = {
    id: record.id ?? `s_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...record,
  };

  if (typeof window !== "undefined") {
    try {
      const current = getStoredScans();
      const updated = [newRecord, ...current.filter((s) => s.id !== newRecord.id)];
      localStorage.setItem(STORAGE_SCAN_KEY, JSON.stringify(updated.slice(0, 100)));
    } catch {
      // ignore storage errors
    }
  }

  return newRecord;
}

export function getStoredTopUpQuota(): { total: number; used: number } {
  if (typeof window === "undefined") {
    return {
      total: defaultProfile.topUpQuotaTotal,
      used: defaultProfile.topUpQuotaUsed,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_QUOTA_KEY);
    if (!raw) {
      return {
        total: defaultProfile.topUpQuotaTotal,
        used: defaultProfile.topUpQuotaUsed,
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      total: defaultProfile.topUpQuotaTotal,
      used: defaultProfile.topUpQuotaUsed,
    };
  }
}

export function addTopUpUsed(amount: number) {
  if (typeof window !== "undefined") {
    try {
      const current = getStoredTopUpQuota();
      const updated = { ...current, used: current.used + amount };
      localStorage.setItem(STORAGE_QUOTA_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
}
