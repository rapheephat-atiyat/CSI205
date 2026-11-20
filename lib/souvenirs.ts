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

export function canBuySouvenirExtra(
    souvenir: EventSouvenirItem,
    ticketTypeIds: readonly string[],
): souvenir is EventSouvenirItem & { extraPrice: string } {
    return ticketTypeIds.length > 0 && souvenir.extraPrice !== null && Number(souvenir.extraPrice) > 0
        && (souvenir.eligibleTicketTypeIds.length === 0
            || ticketTypeIds.some((id) => ticketCanReceiveSouvenir(souvenir, id)));
}

export function souvenirVariantKey(souvenirId: string, size: string | null) {
    return JSON.stringify([souvenirId, size]);
}
