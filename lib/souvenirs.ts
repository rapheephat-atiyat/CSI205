import type { EventSouvenirItem } from "./api-types";

export function ticketCanReceiveSouvenir(souvenir: EventSouvenirItem, ticketTypeId: string) {
    return souvenir.allTicketTypes || souvenir.eligibleTicketTypeIds.includes(ticketTypeId);
}

export function souvenirVariantKey(souvenirId: string, size: string | null) {
    return JSON.stringify([souvenirId, size]);
}
