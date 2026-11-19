"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  Attendee,
  AttendeeStatus,
  ScanOutcome,
  ScanRecord,
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
  setAttendees: React.Dispatch<React.SetStateAction<Attendee[]>>;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

function nowTime(): string {
  return new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [attendees, setAttendees] = useState<Attendee[]>(() => getStoredAttendees());
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>(() => getStoredScans());

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

  const checkInOrOut = useCallback(
    (attendeeId: string, action: "in" | "out"): CheckInResult => {
      const cleanId = attendeeId.trim().toLowerCase();
      const target = attendees.find(
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

        setScanHistory((prev) => [
          duplicateRecord,
          ...prev.filter((r) => r.id !== duplicateRecord.id),
        ]);

        return { outcome: "duplicate", attendee: target };
      }

      const nextStatus: AttendeeStatus = action === "in" ? "checked-in" : "checked-out";
      const outcome: ScanOutcome = action === "in" ? "checked-in" : "checked-out";

      const updatedAttendee: Attendee = {
        ...target,
        status: nextStatus,
        lastActionAt: time,
      };

      const updatedList = attendees.map((a) =>
        a.id === target.id ? updatedAttendee : a
      );

      setAttendees(updatedList);
      saveStoredAttendees(updatedList);

      const record = saveScanRecord({
        time,
        attendeeName: target.name,
        ticketId: target.ticketId,
        action,
        outcome,
      });

      setScanHistory((prev) => [record, ...prev.filter((r) => r.id !== record.id)]);

      return { outcome, attendee: updatedAttendee };
    },
    [attendees]
  );

  const addScan = useCallback((record: Omit<ScanRecord, "id"> & { id?: string }) => {
    const saved = saveScanRecord(record);
    setScanHistory((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
    return saved;
  }, []);

  const updateAttendeeTokens = useCallback((attendeeId: string, tokens: number) => {
    setAttendees((prev) => {
      const updated = prev.map((a) =>
        a.id === attendeeId || a.ticketId.toLowerCase() === attendeeId.toLowerCase()
          ? { ...a, tokens }
          : a
      );
      saveStoredAttendees(updated);
      return updated;
    });
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
