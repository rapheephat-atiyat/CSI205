import { Button } from "@/components/ui/button";
import type { EventSessionItem } from "@/lib/api-types";
import { bookingDateLabel, bookingTimeLabel } from "@/lib/booking-days";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { BookCard } from "./BookUI";

type Props = {
    days: { date: string; sessions: EventSessionItem[] }[];
    selectedDate: string | null;
    errorMessage: string;
    onDateChange: (date: string) => void;
    onContinue: () => void;
};

export function Step0SelectDate({ days, selectedDate, errorMessage, onDateChange, onContinue }: Props) {
    return (
        <form className="max-w-2xl" onSubmit={(event) => {
            event.preventDefault();
            if (selectedDate) onContinue();
        }}>
            <BookCard title="วันจัดงาน">
                <fieldset className="space-y-3">
                    <legend className="sr-only">วันที่เข้าร่วม</legend>
                    {days.map(({ date, sessions }) => (
                        <label key={date} className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-brand",
                            date === selectedDate ? "border-brand bg-brand-soft" : "hover:bg-muted",
                        )}>
                            <input
                                type="radio"
                                name="attendance-date"
                                value={date}
                                checked={date === selectedDate}
                                aria-label={bookingDateLabel(date)}
                                onChange={() => onDateChange(date)}
                                className="mt-1 size-4 shrink-0 accent-brand"
                            />
                            <span className="grid min-w-0 gap-2">
                                <time dateTime={date} className="font-medium">{bookingDateLabel(date)}</time>
                                <span className="grid gap-1 text-sm text-muted-foreground">
                                    {sessions.map((session) => (
                                        <span key={session.id} className="flex flex-wrap gap-x-2">
                                            {session.startsAt && (
                                                <time dateTime={session.startsAt} className="tabular-nums">{bookingTimeLabel(session.startsAt)} น.</time>
                                            )}
                                            <span>{session.title}</span>
                                        </span>
                                    ))}
                                </span>
                            </span>
                        </label>
                    ))}
                </fieldset>
                {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
                <Button type="submit" variant="brand" className="h-11 w-full justify-between sm:w-40" disabled={!selectedDate}>
                    เลือกบัตร <ArrowRight aria-hidden="true" />
                </Button>
            </BookCard>
        </form>
    );
}
