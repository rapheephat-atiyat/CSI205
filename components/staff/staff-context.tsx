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
  type Attendee,
  type AttendeeStatus,
  type ScanOutcome,
  type ScanRecord,
} from "@/lib/staff-mock";
import {
  getStoredAttendees,
  getStoredScans,
  saveScanRecord,
  saveStoredAttendees,
} from "@/lib/staff-storage";

export type CheckInResult = {
  outcome: "checked-in" | "checked-out" | "duplicate";
  attendee: Attendee | null;
};

export interface StaffContextType {
  attendees: Attendee[];
  scanHistory: ScanRecord[];
  total: number;
  checkedIn: number;
  checkedOut: number;
  waiting: number;
  checkInOrOut: (attendeeId: string, action: "in" | "out") => CheckInResult;
  addScan: (record: Omit<ScanRecord, "id"> & { id?: string }) => ScanRecord;
  updateAttendeeTokens: (attendeeId: string, tokens: number) => void;
  setAttendees: (attendees: Attendee[] | ((prev: Attendee[]) => Attendee[])) => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

function nowTime(): string {
  return new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

let attendeesStore: Attendee[] = seedAttendees.map((a) => ({ ...a }));
let scansStore: ScanRecord[] = seedScanHistory.map((s) => ({ ...s }));
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

  const value = useMemo(
    () => ({
      attendees,
      scanHistory,
      total,
      checkedIn,
      checkedOut,
      waiting,
      checkInOrOut,
      addScan,
      updateAttendeeTokens,
      setAttendees,
    }),
    [
      attendees,
      scanHistory,
      total,
      checkedIn,
      checkedOut,
      waiting,
      checkInOrOut,
      addScan,
      updateAttendeeTokens,
      setAttendees,
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
