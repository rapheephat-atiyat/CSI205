"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import type { EventDetail } from "@/lib/api-types";
import EventForm from "@/components/admin/EventForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventSettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      setLoading(true);
      setError(null);
      const res = await api.events.get(slug);
      if (res.success) {
        setEvent(res.data);
      } else {
        setError(res.error.message);
      }
      setLoading(false);
    }
    loadEvent();
  }, [slug]);

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
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 text-destructive">
        {error ?? "ไม่พบข้อมูลงาน"}
      </div>
    );
  }

  return <EventForm initial={event} canDelete={true} />;
}
