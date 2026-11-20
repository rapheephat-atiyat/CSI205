import type { EventSouvenirItem } from "./api-types";

export function isSouvenirImageUrl(value: string) {
    if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
    try {
        const url = new URL(value);
        return url.protocol === "https:" && !url.username && !url.password;
    } catch {
        return false;
    }
}

export function ticketCanReceiveSouvenir(souvenir: EventSouvenirItem, ticketTypeId: string) {
    return souvenir.allTicketTypes || souvenir.eligibleTicketTypeIds.includes(ticketTypeId);
}

export function souvenirVariantKey(souvenirId: string, size: string | null) {
    return JSON.stringify([souvenirId, size]);
}
