import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getEvents } from "@/server/services/event.service";
import { getPublishedFaq } from "@/server/services/faq.service";
import { PUBLIC_EVENTS_TAG, PUBLIC_FAQ_TAG } from "./tags";

// Cache only public display data. Checkout, permissions and balances stay fresh.
export async function getPublicEvents() {
    "use cache";
    cacheLife({ stale: 60, revalidate: 60, expire: 300 });
    cacheTag(PUBLIC_EVENTS_TAG);
    return getEvents();
}

export async function getPublicFaq() {
    "use cache";
    cacheLife({ stale: 60, revalidate: 60, expire: 300 });
    cacheTag(PUBLIC_FAQ_TAG);
    return getPublishedFaq();
}
