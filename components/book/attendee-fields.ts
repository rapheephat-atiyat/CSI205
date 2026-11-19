import type { AttendeeField } from "@/server/database/enums/domain.enum";
import type { HTMLInputTypeAttribute } from "react";
import type { BookingAttendee } from "./booking-types";

export const attendeeFields = [
    { name: "firstName", label: "ชื่อ", max: 255, autoComplete: "given-name" },
    { name: "lastName", label: "นามสกุล", max: 255, autoComplete: "family-name" },
    { name: "email", label: "อีเมล", type: "email", pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, max: 255, autoComplete: "email" },
    { name: "phone", label: "เบอร์โทรศัพท์", type: "tel", pattern: /^[0-9]{9,10}$/, max: 10, autoComplete: "tel-national" },
    { name: "graduationYear", label: "ปีที่จบ / รุ่น", max: 10 },
] as const satisfies { name: AttendeeField; label: string; type?: HTMLInputTypeAttribute; pattern?: RegExp; max: number; autoComplete?: string }[];

export type AttendeeProgress = { key: string; name: string; status: "complete" | "incomplete" | "empty" };

export function getAttendeeStatus({ ticketType, attendee }: BookingAttendee): AttendeeProgress["status"] {
    let started = false;
    let complete = true;
    for (const field of attendeeFields) {
        const value = attendee[field.name] ?? "";
        const filled = value.trim().length > 0;
        started ||= filled;
        const missingRequiredValue = !filled && ticketType.requiredFields.includes(field.name);
        const invalidFormat = value && "pattern" in field && !field.pattern.test(value);
        if (missingRequiredValue || invalidFormat || value.length > field.max) {
            complete = false;
        }
    }
    return complete ? "complete" : started ? "incomplete" : "empty";
}
