import "server-only";
import { revalidateTag } from "next/cache";

export const PUBLIC_EVENTS_TAG = "public-events";
export const PUBLIC_FAQ_TAG = "public-faq";

export function invalidatePublicEvents() {
    revalidateTag(PUBLIC_EVENTS_TAG, { expire: 0 });
}

export function invalidatePublicFaq() {
    revalidateTag(PUBLIC_FAQ_TAG, { expire: 0 });
}
