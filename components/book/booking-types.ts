import type { EventTicketItem, TicketAttendeeInput } from "@/lib/api-types";

export type BookingAttendee = {
    key: string;
    ticketType: EventTicketItem;
    attendee: TicketAttendeeInput;
};
