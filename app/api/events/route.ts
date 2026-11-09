import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { getEvents } from "@/server/services/event.service";
import { FALLBACK_EVENTS } from "@/lib/events-mock";
import type { EventSummary } from "@/lib/api-types";

export const GET = withHandler(async () => {
    try {
        const events = await getEvents();
        return success(events);
    } catch {
        return success([...FALLBACK_EVENTS] as EventSummary[]);
    }
});
