const eventTimeZone = "Asia/Bangkok";
const dateKeyFormat = new Intl.DateTimeFormat("en-GB", {
    timeZone: eventTimeZone, year: "numeric", month: "2-digit", day: "2-digit",
});
const dateLabelFormat = new Intl.DateTimeFormat("th-TH", {
    timeZone: eventTimeZone, dateStyle: "full",
});
const timeLabelFormat = new Intl.DateTimeFormat("th-TH", {
    timeZone: eventTimeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export function getBookingDays<T extends { startsAt: Date | string | null }>(sessions: readonly T[]) {
    const byDate = new Map<string, T[]>();
    for (const session of sessions) {
        if (!session.startsAt) continue;
        const start = new Date(session.startsAt);
        if (!Number.isFinite(start.getTime())) continue;
        const parts = dateKeyFormat.formatToParts(start);
        const day = parts.find(({ type }) => type === "day")?.value;
        const month = parts.find(({ type }) => type === "month")?.value;
        const year = parts.find(({ type }) => type === "year")?.value;
        const date = `${year}-${month}-${day}`;
        const existing = byDate.get(date);
        if (existing) existing.push(session);
        else byDate.set(date, [session]);
    }
    return [...byDate].sort(([a], [b]) => a.localeCompare(b)).map(([date, sessions]) => ({ date, sessions }));
}

export function bookingDateLabel(date: string) {
    return dateLabelFormat.format(new Date(`${date}T00:00:00Z`));
}

export function bookingTimeLabel(dateTime: string) {
    return timeLabelFormat.format(new Date(dateTime));
}
