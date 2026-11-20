import { FALLBACK_EVENTS } from "@/lib/events-mock";
import { In, IsNull, type EntityManager } from "typeorm";
import { Events, EventSouvenir } from "./entities";

const demoPhotos = {
    shirt: "/images/demo-souvenirs/shirt.webp",
    pin: "/images/demo-souvenirs/pin.webp",
    keychain: "/images/demo-souvenirs/keychain.webp",
    bottle: "/images/demo-souvenirs/bottle.webp",
    postcard: "/images/demo-souvenirs/postcard.webp",
    tote: "/images/demo-souvenirs/tote.webp",
    notebook: "/images/demo-souvenirs/notebook.webp",
};

export const reunionSouvenirs = [
    { name: "เสื้อยืดที่ระลึก TUATUA Reunion 2026 (Oversize)", image: demoPhotos.shirt },
    { name: "เข็มกลัด TUATUA Reunion 2026", image: demoPhotos.pin },
    { name: "พวงกุญแจ TUATUA Reunion 2026", image: demoPhotos.keychain },
] as const;

export const galaBottle = {
    name: "กระบอกน้ำเก็บอุณหภูมิ Tech Alumni Edition",
    image: demoPhotos.bottle,
};

export function catalogSouvenirs(index: number) {
    if (index % 4 === 0) return [];
    const even = index % 2 === 0;
    return [
        { name: even ? "เข็มกลัดประจำงาน" : "โปสการ์ดประจำงาน", image: even ? demoPhotos.pin : demoPhotos.postcard, allTicketTypes: true, allowDecline: index % 3 !== 0 },
        { name: "เสื้อที่ระลึกประจำงาน", image: demoPhotos.shirt, sizes: ["S", "M", "L", "XL"], extraPrice: "179.50" },
        { name: even ? "กระเป๋าผ้าพิมพ์ลาย" : "สมุดโน้ตประจำงาน", image: even ? demoPhotos.tote : demoPhotos.notebook, extraPrice: "69.00" },
    ];
}

const legacySeedImages = new Set([
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
]);

export async function refreshSeedSouvenirImages(manager: EntityManager) {
    const photosBySlug = new Map<string, readonly { name: string; image: string }[]>([
        ["tuatua-reunion-2026", reunionSouvenirs],
        ["tech-alumni-gala-2026", [galaBottle]],
        ...FALLBACK_EVENTS.map(({ slug }, index) => [slug, catalogSouvenirs(index)] as const),
    ] as const);
    const events = await manager.find(Events, {
        select: { id: true, slug: true },
        where: { slug: In([...photosBySlug.keys()]) },
    });

    let updated = 0;
    for (const event of events) {
        const photos = photosBySlug.get(event.slug);
        if (!photos?.length) continue;
        const souvenirs = await manager.find(EventSouvenir, {
            where: { eventId: event.id, name: In(photos.map(({ name }) => name)) },
        });
        for (const souvenir of souvenirs) {
            if (souvenir.image?.trim() && !legacySeedImages.has(souvenir.image)) continue;
            const photo = photos.find(({ name }) => name === souvenir.name);
            if (!photo) continue;
            const result = await manager.update(EventSouvenir, {
                id: souvenir.id,
                image: souvenir.image ?? IsNull(),
            }, { image: photo.image });
            updated += result.affected ?? 0;
        }
    }
    return updated;
}
