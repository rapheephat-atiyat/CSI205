import type { OrderSouvenirItem, TicketSouvenir } from "@/lib/api-types";
import type { EntityManager } from "typeorm";
import { Events, EventSouvenir, EventTicket, Order, OrderShipping, Ticket, User } from "./entities";
import {
    ATTENDEE_FIELDS,
    DELIVERY_METHODS,
    ORDER_STATUSES,
    SHIPPING_STATUSES,
    TICKET_STATUSES,
    type OrderStatus,
    type ShippingStatus,
    type TicketStatus,
} from "./enums/domain.enum";

const demoSlip = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jMfkAAAAASUVORK5CYII=";

export async function seedCheckoutSalesExamples(manager: EntityManager, campusEvent: Events, seededAt: Date) {
    const [freeTicket] = await manager.save(EventTicket, [
        {
            eventId: campusEvent.id, name: "บัตรเข้าชมฟรี", description: "ทดสอบจองบัตรยอด 0 บาท",
            price: "0.00", quota: 20, sortOrder: 3,
            requiredFields: [ATTENDEE_FIELDS.FIRST_NAME, ATTENDEE_FIELDS.LAST_NAME],
        },
        {
            eventId: campusEvent.id, name: "บัตรพิเศษ (ขายหมด)", price: "2000.00",
            quota: 10, sold: 10, sortOrder: 4,
        },
        {
            eventId: campusEvent.id, name: "บัตรทีมงาน (ซ่อน)", price: "0.00",
            quota: 10, isActive: false, sortOrder: 5,
        },
    ]);

    const day = 86_400_000;
    const dateFromSeed = (days: number) => new Date(seededAt.getTime() + days * day);
    const examples = [
        { slug: "checkout-demo-upcoming", title: "ตัวอย่างงานที่ยังไม่เปิดขาย", buyAt: dateFromSeed(7), buyEndAt: dateFromSeed(30) },
        { slug: "checkout-demo-closed", title: "ตัวอย่างงานที่ปิดขายแล้ว", buyAt: dateFromSeed(-30), buyEndAt: dateFromSeed(-1) },
        { slug: "checkout-demo-no-tickets", title: "ตัวอย่างงานที่ยังไม่มีประเภทบัตร", buyAt: dateFromSeed(-1), buyEndAt: dateFromSeed(30) },
    ];
    for (const example of examples) {
        await manager.save(Events, {
            ...example,
            subTitle: "ข้อมูลตัวอย่างสำหรับทดสอบหน้าจองบัตร",
            description: example.title,
            venue: campusEvent.venue,
            banner: campusEvent.banner,
            thumbnail: campusEvent.thumbnail,
        });
    }

    return freeTicket;
}

type CheckoutFixtures = {
    buyer: User;
    earlyTicket: EventTicket;
    regularTicket: EventTicket;
    standingTicket: EventTicket;
    freeTicket: EventTicket;
    shirt: EventSouvenir;
    pin: EventSouvenir;
    keychain: EventSouvenir;
    reunionShippingFee: string;
    seededAt: Date;
};

type DemoOrder = {
    code: string;
    ticketType: EventTicket;
    status: OrderStatus;
    ticketStatus: TicketStatus;
    paymentSlip?: string;
    includedItems?: TicketSouvenir[];
    extraItems?: OrderSouvenirItem[];
    shippingStatus?: ShippingStatus;
    createdAt?: Date;
};

export async function seedCheckoutOrders(manager: EntityManager, fixtures: CheckoutFixtures) {
    const { buyer, earlyTicket, regularTicket, standingTicket, freeTicket, shirt, pin, keychain, reunionShippingFee, seededAt } = fixtures;
    if (!keychain.extraPrice) throw new Error("Set a price for the demo keychain before seeding checkout orders.");
    const pinItem = { souvenirId: pin.id, name: pin.name, size: null };
    const shirtItem = { souvenirId: shirt.id, name: shirt.name, size: "M" };
    const keychainItem = { souvenirId: keychain.id, name: keychain.name, size: null, quantity: 1, unitPrice: keychain.extraPrice };
    const cases: DemoOrder[] = [
        {
            code: "AWAITING-PAYMENT", ticketType: earlyTicket,
            status: ORDER_STATUSES.PENDING, ticketStatus: TICKET_STATUSES.PENDING,
            includedItems: [pinItem], extraItems: [keychainItem], shippingStatus: SHIPPING_STATUSES.PENDING,
        },
        {
            code: "SLIP-SENT", ticketType: regularTicket,
            status: ORDER_STATUSES.PENDING, ticketStatus: TICKET_STATUSES.PENDING,
            paymentSlip: demoSlip, includedItems: [shirtItem, pinItem],
        },
        {
            code: "EXPIRED", ticketType: standingTicket,
            status: ORDER_STATUSES.PENDING, ticketStatus: TICKET_STATUSES.PENDING,
            createdAt: new Date(seededAt.getTime() - 60 * 60_000),
        },
        {
            code: "CANCELLED", ticketType: earlyTicket,
            status: ORDER_STATUSES.CANCELLED, ticketStatus: TICKET_STATUSES.CANCELLED,
        },
        {
            code: "FREE", ticketType: freeTicket,
            status: ORDER_STATUSES.PAID, ticketStatus: TICKET_STATUSES.ACTIVE,
        },
        {
            code: "SHIPPED", ticketType: regularTicket,
            status: ORDER_STATUSES.PAID, ticketStatus: TICKET_STATUSES.ACTIVE,
            paymentSlip: demoSlip, includedItems: [shirtItem, pinItem], shippingStatus: SHIPPING_STATUSES.SHIPPED,
        },
        {
            code: "DELIVERED", ticketType: regularTicket,
            status: ORDER_STATUSES.PAID, ticketStatus: TICKET_STATUSES.ACTIVE,
            paymentSlip: demoSlip, includedItems: [shirtItem, pinItem], shippingStatus: SHIPPING_STATUSES.DELIVERED,
        },
    ];

    for (const demo of cases) {
        const { ticketType, includedItems = [], extraItems = [], createdAt = seededAt, shippingStatus } = demo;
        const shippingFee = shippingStatus ? Number(reunionShippingFee) : 0;
        const hasSouvenirs = includedItems.length > 0 || extraItems.length > 0;
        const extraTotal = extraItems.reduce((total, item) => total + Number(item.unitPrice) * item.quantity, 0);
        const order = await manager.save(Order, {
            orderNo: `ORD-DEMO-${demo.code}`,
            userId: buyer.id,
            eventId: ticketType.eventId,
            total: (Number(ticketType.price) + extraTotal + shippingFee).toFixed(2),
            status: demo.status,
            paymentSlip: demo.paymentSlip ?? null,
            paidAt: demo.status === ORDER_STATUSES.PAID ? createdAt : null,
            deliveryMethod: shippingStatus ? DELIVERY_METHODS.SHIPPING : hasSouvenirs ? DELIVERY_METHODS.PICKUP : DELIVERY_METHODS.NONE,
            shippingFee: shippingFee.toFixed(2),
            souvenirItems: extraItems,
            createdAt,
        });
        await manager.save(Ticket, {
            orderId: order.id,
            userId: buyer.id,
            eventId: order.eventId,
            eventTicketId: ticketType.id,
            unitPrice: ticketType.price,
            status: demo.ticketStatus,
            ticketCode: `TKT-DEMO-${demo.code}`,
            qrToken: crypto.randomUUID(),
            firstName: buyer.firstName,
            lastName: buyer.lastName,
            phone: buyer.phone,
            email: buyer.email,
            graduationYear: "2567",
            souvenirItems: includedItems,
            createdAt,
        });
        if (demo.ticketStatus !== TICKET_STATUSES.CANCELLED) {
            await manager.increment(EventTicket, { id: ticketType.id }, "sold", 1);
        }

        if (shippingStatus) {
            const sent = shippingStatus === SHIPPING_STATUSES.SHIPPED || shippingStatus === SHIPPING_STATUSES.DELIVERED;
            await manager.save(OrderShipping, {
                orderId: order.id,
                recipientName: buyer.name,
                recipientPhone: buyer.phone ?? "0800000000",
                addressLine: "99/9 ถนนพหลโยธิน",
                subDistrict: "เสนานิคม",
                district: "จตุจักร",
                province: "กรุงเทพมหานคร",
                postalCode: "10900",
                status: shippingStatus,
                carrier: sent ? "ไปรษณีย์ไทย" : null,
                trackingNumber: sent ? `DEMO-${demo.code}` : null,
                shippedAt: sent ? seededAt : null,
            });
        }
    }
}
