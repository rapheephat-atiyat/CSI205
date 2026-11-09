import EventClient from "@/app/(main)/e/[slug]/EventClient";
import EventDescription from "@/app/(main)/e/[slug]/EventDescription";
import { EventDetail } from "@/lib/api-types";
import { ApiError } from "@/server/http/errors";
import { getEventBySlug } from "@/server/services/event.service";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

interface Props {
    params: Promise<{ slug: string }>;
}

async function Content({ params }: Props) {
    await connection();
    const { slug } = await params;
    let event: EventDetail;
    try {
        event = await getEventBySlug(slug);
    } catch (err) {
        if (err instanceof ApiError && err.code === "EVENT_NOT_FOUND") {
            notFound();
        }
        throw err;
    }

    return <EventClient event={event} key={event.id} description={<EventDescription html={event.description} />} />;
}

export default function page({ params }: Props) {
    return (
        <Suspense fallback={<div>กำลังโหลดข้อมูลงาน...</div>}>
            <Content params={params} />
        </Suspense>
    );
}
