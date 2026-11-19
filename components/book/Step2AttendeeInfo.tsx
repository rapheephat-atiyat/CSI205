import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TicketAttendeeInput } from "@/lib/api-types";
import { attendeeFields } from "./attendee-fields";
import type { BookingAttendee } from "./booking-types";

type Props = {
    ticketAttendees: BookingAttendee[];
    profile: TicketAttendeeInput;
    onAttendeeChange: (attendeeKey: string, attendee: TicketAttendeeInput) => void;
};

export function Step2AttendeeInfo({ ticketAttendees, profile, onAttendeeChange }: Props) {
    return ticketAttendees.map((entry, index) => (
        <AttendeeForm
            key={entry.key}
            entry={entry}
            index={index}
            profile={profile}
            onChange={(attendee) => onAttendeeChange(entry.key, attendee)}
        />
    ));
}

function AttendeeForm({ entry, index, profile, onChange }: {
    entry: BookingAttendee;
    index: number;
    profile: TicketAttendeeInput;
    onChange: (attendee: TicketAttendeeInput) => void;
}) {
    const { key, ticketType, attendee } = entry;
    return (
        <fieldset className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
            <legend className="px-2 text-base font-semibold">บัตรใบที่ {index + 1}</legend>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="secondary">{ticketType.name}</Badge>
                <Button type="button" variant="outline" className="h-10" onClick={() => onChange({ ...attendee, ...profile })}>ใช้ข้อมูลของฉัน</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                {attendeeFields.map((field) => {
                    const inputId = `${key}-${field.name}`;
                    const required = ticketType.requiredFields.includes(field.name);
                    return <div key={inputId} className="space-y-2">
                        <Label htmlFor={inputId}>{field.label}{required && <span className="text-brand" aria-hidden="true">*</span>}</Label>
                        <Input
                            id={inputId} className="h-11" required={required} maxLength={field.max} type={"type" in field ? field.type : "text"}
                            pattern={"pattern" in field ? field.pattern.source : undefined}
                            autoComplete={"autoComplete" in field ? `section-ticket${index} ${field.autoComplete}` : "off"}
                            value={attendee[field.name] ?? ""} onChange={(event) => onChange({ ...attendee, [field.name]: event.target.value })}
                        />
                    </div>;
                })}
            </div>
        </fieldset>
    );
}
