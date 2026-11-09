import { Suspense } from "react";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { getEvents } from "@/server/services/event.service";
import { FALLBACK_EVENTS } from "@/lib/events-mock";
import { type EventSummary } from "@/lib/api-types";
import EventsClient from "@/components/events/EventsClient";

function EventsSkeleton() {
    return (
        <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-48 mt-1" />
                <Skeleton className="h-4 w-72" />
            </div>
            <div className="rounded-xl border bg-card p-4 sm:p-5">
                <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-2.5 rounded-xl border bg-card p-3">
                        <Skeleton className="aspect-video w-full rounded-lg" />
                        <Skeleton className="h-4 w-3/4 mt-1" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    );
}

async function EventsList() {
    await connection();
    let events: EventSummary[] = [];
    try {
        events = await getEvents();
        if (!events || events.length === 0) {
            events = [...FALLBACK_EVENTS];
        }
    } catch {
        events = [...FALLBACK_EVENTS];
    }

    return <EventsClient initialEvents={events} />;
}

export default function EventsPage() {
    return (
        <div className="m-5 xl:mx-0">
            <div className="container mx-auto max-w-7xl">
                <Suspense fallback={<EventsSkeleton />}>
                    <EventsList />
                </Suspense>
            </div>
        </div>
    );
}
