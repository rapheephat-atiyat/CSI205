import EventClient from "@/app/(main)/e/[slug]/EventClient";
import EventDescription from "@/app/(main)/e/[slug]/EventDescription";
import { api } from "@/lib/api-client";
import { EventDetail } from "@/lib/api-types";
import { ApiError } from "@/server/http/errors";
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
        const res = await api.events.get(slug);
        if (res.success) {
            event = res.data;
        } else if (res.error.code === "EVENT_NOT_FOUND") {
            notFound();
        } else {
            throw new Error(res.error.message)
        }
    } catch (err) {
        if (err instanceof ApiError && err.code == "EVENT_NOT_FOUND") {
            notFound();
        }
        throw err;
    }

    return <EventClient event={event} key={event.id} description={<EventDescription html={event.description} />} />
}

export default function page({ params }: Props) {
    return (
        <Suspense fallback={<div>wdw</div>}>
            <Content params={params} />
        </Suspense>
    );
}