"use client";

import { useEffect, useState } from "react";
import { useAdminAccess } from "@/components/admin/AdminAccess";
import { AdminFeedback, apiData } from "@/components/admin/AdminFeedback";
import { PERMISSIONS } from "@/lib/permissions";
import { api } from "@/lib/api-client";
import type { EventDetail } from "@/lib/api-types";
import EventForm from "@/components/admin/EventForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventSettingsPage() {
  const { eventId, can } = useAdminAccess();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.events.getById(eventId).then(apiData).then((data) => {
      if (!cancelled) setEvent(data);
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : "โหลดงานไม่สำเร็จ");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [eventId, revision]);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-4">
        <Skeleton className="h-6 w-60" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6">
        <AdminFeedback loading={false} error={error ?? "ไม่พบข้อมูลงาน"} retry={() => {
          setError(null);
          setLoading(true);
          setRevision((value) => value + 1);
        }} />
      </div>
    );
  }

  return <EventForm key={event.id} initial={event} canDelete={can(PERMISSIONS.EVENT_CREATE)} />;
}
