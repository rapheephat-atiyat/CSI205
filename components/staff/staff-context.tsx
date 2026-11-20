"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  attendees as seedAttendees,
  scanHistory as seedScanHistory,
  staffProfile as defaultProfile,
  type Attendee,
  type AttendeeStatus,
  type ScanOutcome,
  type ScanRecord,
} from "@/lib/staff-mock";
import {
  addTopUpUsed,
  getStoredAttendees,
  getStoredScans,
  getStoredTopUpQuota,
  saveScanRecord,
  saveStoredAttendees,
} from "@/lib/staff-storage";
import { api } from "@/lib/api-client";

export type CheckInResult = {
  outcome: "checked-in" | "checked-out" | "duplicate";
  attendee: Attendee | null;
};

export type StaffQuota = {
  total: number;
  used: number;
  remaining: number;
};

export type TopUpResult =
  | { success: true; name: string; ticketCode: string | null; newBalance: number }
  | { success: false; error: string; message: string };

export interface StaffContextType {
  attendees: Attendee[];
  scanHistory: ScanRecord[];
  total: number;
  checkedIn: number;
  checkedOut: number;
  waiting: number;
  quota: StaffQuota;
  checkInOrOut: (attendeeId: string, action: "in" | "out") => CheckInResult;
  addScan: (record: Omit<ScanRecord, "id"> & { id?: string }) => ScanRecord;
  updateAttendeeTokens: (attendeeId: string, tokens: number) => void;
  setAttendees: (attendees: Attendee[] | ((prev: Attendee[]) => Attendee[])) => void;
  topUpTokens: (attendeeIdOrTicket: string, amount: number, expectedBahtPerToken: string) => Promise<TopUpResult>;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

function nowTime(): string {
  return new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

let attendeesStore: Attendee[] = seedAttendees.map((a) => ({ ...a }));
let scansStore: ScanRecord[] = seedScanHistory.map((s) => ({ ...s }));
let quotaStore = {
  total: defaultProfile.topUpQuotaTotal,
  used: defaultProfile.topUpQuotaUsed,
};
let quotaSnapshot: StaffQuota = {
  total: defaultProfile.topUpQuotaTotal,
  used: defaultProfile.topUpQuotaUsed,
  remaining: Math.max(defaultProfile.topUpQuotaTotal - defaultProfile.topUpQuotaUsed, 0),
};
const serverQuotaSnapshot: StaffQuota = {
  total: defaultProfile.topUpQuotaTotal,
  used: defaultProfile.topUpQuotaUsed,
  remaining: Math.max(defaultProfile.topUpQuotaTotal - defaultProfile.topUpQuotaUsed, 0),
};

function updateQuotaSnapshot() {
  const total = quotaStore.total;
  const used = quotaStore.used;
  quotaSnapshot = {
    total,
    used,
    remaining: Math.max(total - used, 0),
  };
}

let isInitialized = false;

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

function initStoreIfNeeded() {
  if (typeof window !== "undefined" && !isInitialized) {
    isInitialized = true;
    attendeesStore = getStoredAttendees();
    scansStore = getStoredScans();
    quotaStore = getStoredTopUpQuota();
    updateQuotaSnapshot();
  }
}

function getAttendeesSnapshot(): Attendee[] {
  initStoreIfNeeded();
  return attendeesStore;
}

function getAttendeesServerSnapshot(): Attendee[] {
  return seedAttendees;
}

function getScansSnapshot(): ScanRecord[] {
  initStoreIfNeeded();
  return scansStore;
}

function getScansServerSnapshot(): ScanRecord[] {
  return seedScanHistory;
}

function getQuotaSnapshot(): StaffQuota {
  initStoreIfNeeded();
  return quotaSnapshot;
}

function getQuotaServerSnapshot(): StaffQuota {
  return serverQuotaSnapshot;
}

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const attendees = useSyncExternalStore(
    subscribe,
    getAttendeesSnapshot,
    getAttendeesServerSnapshot
  );

  const scanHistory = useSyncExternalStore(
    subscribe,
    getScansSnapshot,
    getScansServerSnapshot
  );

  const quota = useSyncExternalStore(
    subscribe,
    getQuotaSnapshot,
    getQuotaServerSnapshot
  );

  const total = attendees.length;
  const checkedIn = useMemo(
    () => attendees.filter((a) => a.status === "checked-in").length,
    [attendees]
  );
  const checkedOut = useMemo(
    () => attendees.filter((a) => a.status === "checked-out").length,
    [attendees]
  );
  const waiting = useMemo(
    () => attendees.filter((a) => a.status === "not-arrived").length,
    [attendees]
  );

  const setAttendees = useCallback(
    (action: Attendee[] | ((prev: Attendee[]) => Attendee[])) => {
      const next = typeof action === "function" ? action(attendeesStore) : action;
      attendeesStore = next;
      saveStoredAttendees(next);
      notify();
    },
    []
  );

  const checkInOrOut = useCallback(
    (attendeeId: string, action: "in" | "out"): CheckInResult => {
      initStoreIfNeeded();
      const cleanId = attendeeId.trim().toLowerCase();
      const target = attendeesStore.find(
        (a) => a.id === attendeeId || a.ticketId.toLowerCase() === cleanId
      );

      if (!target) {
        return { outcome: "duplicate", attendee: null };
      }

      const isDuplicate =
        (action === "in" && target.status === "checked-in") ||
        (action === "out" && target.status !== "checked-in");

      const time = nowTime();

      if (isDuplicate) {
        const duplicateRecord = saveScanRecord({
          time,
          attendeeName: target.name,
          ticketId: target.ticketId,
          action,
          outcome: "duplicate",
        });

        scansStore = [duplicateRecord, ...scansStore.filter((r) => r.id !== duplicateRecord.id)];
        notify();

        return { outcome: "duplicate", attendee: target };
      }

      const nextStatus: AttendeeStatus = action === "in" ? "checked-in" : "checked-out";
      const outcome: ScanOutcome = action === "in" ? "checked-in" : "checked-out";

      const updatedAttendee: Attendee = {
        ...target,
        status: nextStatus,
        lastActionAt: time,
      };

      const updatedList = attendeesStore.map((a) =>
        a.id === target.id ? updatedAttendee : a
      );

      attendeesStore = updatedList;
      saveStoredAttendees(updatedList);

      const record = saveScanRecord({
        time,
        attendeeName: target.name,
        ticketId: target.ticketId,
        action,
        outcome,
      });

      scansStore = [record, ...scansStore.filter((r) => r.id !== record.id)];
      notify();

      return { outcome, attendee: updatedAttendee };
    },
    []
  );

  const addScan = useCallback((record: Omit<ScanRecord, "id"> & { id?: string }) => {
    initStoreIfNeeded();
    const saved = saveScanRecord(record);
    scansStore = [saved, ...scansStore.filter((r) => r.id !== saved.id)];
    notify();
    return saved;
  }, []);

  const updateAttendeeTokens = useCallback((attendeeId: string, tokens: number) => {
    initStoreIfNeeded();
    const updated = attendeesStore.map((a) =>
      a.id === attendeeId || a.ticketId.toLowerCase() === attendeeId.toLowerCase()
        ? { ...a, tokens }
        : a
    );
    attendeesStore = updated;
    saveStoredAttendees(updated);
    notify();
  }, []);

  const topUpTokens = useCallback(
    async (attendeeIdOrTicket: string, amount: number, expectedBahtPerToken: string): Promise<TopUpResult> => {
      initStoreIfNeeded();
      if (!Number.isInteger(amount) || amount <= 0) {
        return { success: false, error: "invalidAmount", message: "จำนวน Token ต้องเป็นจำนวนเต็มบวก" };
      }

      const currentQuota = getStoredTopUpQuota();
      const remaining = Math.max(currentQuota.total - currentQuota.used, 0);
      if (amount > remaining) {
        return { success: false, error: "overQuota", message: "เกินโควตาของเจ้าหน้าที่" };
      }

      const res = await api.staff.topUp({ attendeeId: attendeeIdOrTicket, amount, expectedBahtPerToken });
      if (!res.success) return { success: false, error: res.error.code, message: res.error.message };

      const { name, ticketCode, balance } = res.data;
      if (ticketCode) {
        attendeesStore = attendeesStore.map((attendee) =>
          attendee.ticketId === ticketCode ? { ...attendee, tokens: balance } : attendee
        );
        saveStoredAttendees(attendeesStore);
      }

      addTopUpUsed(amount);
      quotaStore = getStoredTopUpQuota();
      updateQuotaSnapshot();
      notify();

      return {
        success: true,
        name,
        ticketCode,
        newBalance: balance,
      };
    },
    []
  );

  const value = useMemo(
    () => ({
      attendees,
      scanHistory,
      total,
      checkedIn,
      checkedOut,
      waiting,
      quota,
      checkInOrOut,
      addScan,
      updateAttendeeTokens,
      setAttendees,
      topUpTokens,
    }),
    [
      attendees,
      scanHistory,
      total,
      checkedIn,
      checkedOut,
      waiting,
      quota,
      checkInOrOut,
      addScan,
      updateAttendeeTokens,
      setAttendees,
      topUpTokens,
    ]
  );

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export function useStaff(): StaffContextType {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error("useStaff must be used within a StaffProvider");
  }
  return context;
}
