"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { EventDetail } from "@/lib/api-types";
import EventForm from "@/components/admin/EventForm";
import { useAdminAccess } from "@/components/admin/AdminAccess";
import { AdminFeedback, apiData } from "@/components/admin/AdminFeedback";
import { PERMISSIONS } from "@/lib/permissions";

export default function EventSettingsPage() {
    const { eventId, can } = useAdminAccess();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        let cancelled = false;
        api.events.getById(eventId).then(apiData).then((data) => { if (!cancelled) { setEvent(data); setError(null); } })
            .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "โหลดงานไม่สำเร็จ"); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [eventId, revision]);
    return <><div className="p-4"><AdminFeedback loading={loading} error={error} retry={() => { setLoading(true); setRevision(revision + 1); }} /></div>{!loading && !error && event && <EventForm key={event.id} initial={event} canDelete={can(PERMISSIONS.EVENT_CREATE)} />}</>;
}
