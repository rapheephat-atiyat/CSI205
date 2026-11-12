import "reflect-metadata";
import { hashPassword } from "better-auth/crypto";
import migrationDataSource from "./data-source.cli";
import {
    Account,
    Events,
    EventSession,
    EventTicket,
    Order,
    OrderShipping,
    Product,
    Store,
    Ticket,
    User,
    UserRole,
    UserRolePermission,
    Wallet,
    WalletHistory,
} from "./entities";
import {
    ATTENDEE_FIELDS,
    DELIVERY_METHODS,
    ORDER_STATUSES,
    SHIPPING_STATUSES,
    TICKET_STATUSES,
    TRANSACTION_STATUSES,
    TRANSACTION_TYPES,
} from "./enums/domain.enum";
import { Role } from "./enums/role.enum";
import { PERMISSIONS, type Permission } from "@/lib/permissions";

async function runSeed() {
    const isReset = process.argv.includes("--reset");

    console.log("⏳ กำลังเชื่อมต่อฐานข้อมูล Supabase...");
    await migrationDataSource.initialize();

    try {
        if (isReset) {
            console.log("🗑️  กำลังล้างตารางและ Enum ทั้งหมดบนฐานข้อมูล (Drop Schema)...");
            await migrationDataSource.query(`DROP SCHEMA IF EXISTS public CASCADE;`);
            await migrationDataSource.query(`CREATE SCHEMA public;`);
            await migrationDataSource.query(`GRANT ALL ON SCHEMA public TO postgres;`);
            await migrationDataSource.query(`GRANT ALL ON SCHEMA public TO public;`);

            console.log("🚀 กำลังรัน Migration สร้างตารางใหม่ทั้งหมด...");
            await migrationDataSource.runMigrations();
        }

        console.log("🌱 กำลังสร้างข้อมูล Mockup (Seed Data)...");
        const passwordHash = await hashPassword("password123");

        await migrationDataSource.transaction(async (manager) => {
            // ==========================================
            // 1. สร้าง Users & Accounts (รหัสผ่านทุกคนคือ: password123)
            // ==========================================
            const usersData = [
                {
                    email: "admin@tuatua.com",
                    username: "admin",
                    firstName: "กิตติพงศ์",
                    lastName: "ผู้ดูแลระบบ",
                    name: "กิตติพงศ์ ผู้ดูแลระบบ",
                    phone: "0811111111",
                    graduationAt: new Date("2020-05-01"),
                    graduationInstitution: "คณะเทคโนโลยีสารสนเทศ",
                    balance: "5000.00",
                },
                {
                    email: "vendor1@tuatua.com",
                    username: "vendor_mala",
                    firstName: "สมชาย",
                    lastName: "สายปิ้งย่าง",
                    name: "สมชาย สายปิ้งย่าง",
                    phone: "0822222222",
                    graduationAt: new Date("2021-05-01"),
                    graduationInstitution: "คณะบริหารธุรกิจ",
                    balance: "1200.00",
                },
                {
                    email: "vendor2@tuatua.com",
                    username: "vendor_drink",
                    firstName: "แพรวา",
                    lastName: "บาร์เทนเดอร์",
                    name: "แพรวา บาร์เทนเดอร์",
                    phone: "0833333333",
                    graduationAt: new Date("2022-05-01"),
                    graduationInstitution: "คณะนิเทศศาสตร์",
                    balance: "800.00",
                },
                {
                    email: "staff@tuatua.com",
                    username: "staff_gate",
                    firstName: "วรพล",
                    lastName: "จุดลงทะเบียน",
                    name: "วรพล จุดลงทะเบียน",
                    phone: "0844444444",
                    graduationAt: new Date("2023-05-01"),
                    graduationInstitution: "คณะวิศวกรรมศาสตร์",
                    balance: "500.00",
                },
                {
                    email: "user1@tuatua.com",
                    username: "rapheephat",
                    firstName: "รพีภัทร",
                    lastName: "ศิษย์เก่าดีเด่น",
                    name: "รพีภัทร ศิษย์เก่าดีเด่น",
                    phone: "0855555555",
                    graduationAt: new Date("2024-05-01"),
                    graduationInstitution: "คณะเทคโนโลยีสารสนเทศ",
                    balance: "1500.00",
                },
                {
                    email: "user2@tuatua.com",
                    username: "pimchanok",
                    firstName: "พิมพ์ชนก",
                    lastName: "ร่วมงานสนุก",
                    name: "พิมพ์ชนก ร่วมงานสนุก",
                    phone: "0866666666",
                    graduationAt: new Date("2023-05-01"),
                    graduationInstitution: "คณะศิลปกรรมศาสตร์",
                    balance: "3200.00",
                },
            ];

            const savedUsers: Record<string, User> = {};
            const userWallets: Record<string, Wallet> = {};

            for (const u of usersData) {
                const user = await manager.save(
                    manager.create(User, {
                        email: u.email,
                        emailVerified: true,
                        username: u.username,
                        firstName: u.firstName,
                        lastName: u.lastName,
                        name: u.name,
                        phone: u.phone,
                        graduationAt: u.graduationAt,
                        graduationInstitution: u.graduationInstitution,
                        status: "ACTIVE",
                    })
                );
                savedUsers[u.email] = user;

                await manager.save(
                    manager.create(Account, {
                        userId: user.id,
                        accountId: user.id,
                        providerId: "credential",
                        password: passwordHash,
                    })
                );

                const wallet = await manager.save(
                    manager.create(Wallet, {
                        userId: user.id,
                        total: u.balance,
                    })
                );
                userWallets[u.email] = wallet;
            }

            // ==========================================
            // 2. สร้าง Events (3 งาน)
            // ==========================================
            const event1 = await manager.save(
                manager.create(Events, {
                    slug: "tuatua-reunion-2026",
                    title: "TUATUA Night Reunion 2026: คืนสู่เหย้าชาวเทคโนฯ",
                    subTitle: "กลับมาพบเพื่อนเก่า ย้อนวันวาน พร้อมมินิคอนเสิร์ตและบูธร้านค้าศิษย์เก่ากว่า 20 ร้าน",
                    banner: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80",
                    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
                    venue: "หอประชุมใหญ่ มหาวิทยาลัยศรีปทุม อาคาร 11 ชั้น 14",
                    description:
                        "งานเลี้ยงรุ่นประจำปีที่ยิ่งใหญ่ที่สุด! พบกับการแสดงดนตรีสดจากวงศิษย์เก่าและศิลปินรับเชิญ บูธอาหารและเครื่องดื่มสุดพิเศษ พร้อมรับเสื้อที่ระลึกรุ่น Limited Edition เฉพาะผู้ร่วมงานปีนี้เท่านั้น",
                    tags: ["งานเลี้ยงรุ่น", "คอนเสิร์ต", "ศิษย์เก่า", "Reunion"],
                    hasSouvenir: true,
                    souvenirName: "เสื้อยืดที่ระลึก TUATUA Reunion 2026 (Oversize)",
                    souvenirImage: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
                    souvenirSizes: ["S", "M", "L", "XL", "2XL"],
                    souvenirPrice: "300.00",
                    souvenirAllowDecline: true,
                    allowShipping: true,
                    shippingFee: "50.00",
                    buyAt: new Date("2026-10-01T10:00:00+07:00"),
                    buyEndAt: new Date("2026-12-25T23:59:59+07:00"),
                    minTicketQTY: 1,
                    maxTicketQTY: 5,
                })
            );

            const event2 = await manager.save(
                manager.create(Events, {
                    slug: "campus-music-fest-2026",
                    title: "Campus Music Festival 2026: ปรากฏการณ์ดนตรีกลางแจ้ง",
                    subTitle: "เทศกาลดนตรีสุดมันส์รวมศิลปินอินดี้และป๊อปแถวหน้าของเมืองไทย",
                    banner: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80",
                    thumbnail: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80",
                    venue: "ลานกิจกรรมกลางแจ้ง SPU Arena",
                    description:
                        "เตรียมพบกับไลน์อัปศิลปินกว่า 8 วง พร้อมโซน Food Market ที่ใช้ระบบ Cashless Token เต็มรูปแบบ สแกนจ่ายง่ายไม่ต้องพกเงินสด",
                    tags: ["เทศกาลดนตรี", "Music Festival", "Outdoor"],
                    hasSouvenir: false,
                    souvenirName: null,
                    souvenirImage: null,
                    souvenirSizes: [],
                    souvenirAllowDecline: true,
                    allowShipping: false,
                    shippingFee: "0.00",
                    buyAt: new Date("2026-11-01T09:00:00+07:00"),
                    buyEndAt: new Date("2027-01-31T22:00:00+07:00"),
                    minTicketQTY: 1,
                    maxTicketQTY: 4,
                })
            );

            const event3 = await manager.save(
                manager.create(Events, {
                    slug: "tech-alumni-gala-2026",
                    title: "Tech Alumni Gala Dinner & Networking 2026",
                    subTitle: "ค่ำคืนแห่งการสร้างเครือข่ายสายเทคโนโลยีและสตาร์ทอัพ",
                    banner: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80",
                    thumbnail: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
                    venue: "Grand Ballroom โรงแรมเซ็นทารา แกรนด์ เซ็นทรัลพลาซา ลาดพร้าว",
                    description:
                        "งานดินเนอร์สุดพิเศษสำหรับศิษย์เก่าสาย Tech, Developer, และผู้ประกอบการ ร่วมแลกเปลี่ยนประสบการณ์และอัปเดตเทรนด์เทคโนโลยีปี 2027",
                    tags: ["Networking", "Gala Dinner", "Tech"],
                    hasSouvenir: true,
                    souvenirName: "กระบอกน้ำเก็บอุณหภูมิ Tech Alumni Edition",
                    souvenirImage: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
                    souvenirSizes: ["One Size"],
                    souvenirAllowDecline: true,
                    allowShipping: true,
                    shippingFee: "60.00",
                    buyAt: new Date("2026-11-05T12:00:00+07:00"),
                    buyEndAt: new Date("2027-02-14T23:59:59+07:00"),
                    minTicketQTY: 1,
                    maxTicketQTY: 2,
                })
            );

            // สร้าง Event Sessions
            await manager.save([
                manager.create(EventSession, { eventId: event1.id }),
                manager.create(EventSession, { eventId: event2.id }),
                manager.create(EventSession, { eventId: event3.id }),
            ]);

            // ==========================================
            // 3. สร้าง Ticket Types (ราคาบัตรของแต่ละงาน)
            // ==========================================
            const [, t1Regular, t1Vip] = await manager.save([
                manager.create(EventTicket, {
                    eventId: event1.id,
                    name: "บัตรศิษย์เก่าสัมพันธ์ (Early Bird)",
                    description: "บัตรเข้างานราคาพิเศษสำหรับผู้จองล่วงหน้า (ไม่รวมเสื้อที่ระลึก)",
                    price: "350.00",
                    quota: 100,
                    sold: 45,
                    minTicketQTY: 1,
                    maxTicketQTY: 4,
                    sortOrder: 1,
                    isActive: true,
                    includesSouvenir: false,
                    requiredFields: [ATTENDEE_FIELDS.FIRST_NAME, ATTENDEE_FIELDS.LAST_NAME, ATTENDEE_FIELDS.PHONE],
                }),
                manager.create(EventTicket, {
                    eventId: event1.id,
                    name: "บัตรศิษย์เก่าทั่วไป (Regular + เสื้อที่ระลึก)",
                    description: "บัตรเข้างานพร้อมรับเสื้อยืดที่ระลึก TUATUA Reunion 1 ตัว",
                    price: "500.00",
                    quota: 300,
                    sold: 120,
                    minTicketQTY: 1,
                    maxTicketQTY: 5,
                    sortOrder: 2,
                    isActive: true,
                    includesSouvenir: true,
                    requiredFields: [
                        ATTENDEE_FIELDS.FIRST_NAME,
                        ATTENDEE_FIELDS.LAST_NAME,
                        ATTENDEE_FIELDS.PHONE,
                        ATTENDEE_FIELDS.GRADUATION_YEAR,
                    ],
                }),
                manager.create(EventTicket, {
                    eventId: event1.id,
                    name: "บัตรศิษย์เก่าสนับสนุน (VIP Front Table)",
                    description: "ที่นั่งโซนพิเศษหน้าเวที พร้อมเสื้อที่ระลึกและเครื่องดื่มต้อนรับ",
                    price: "1000.00",
                    quota: 50,
                    sold: 18,
                    minTicketQTY: 1,
                    maxTicketQTY: 5,
                    sortOrder: 3,
                    isActive: true,
                    includesSouvenir: true,
                    requiredFields: [
                        ATTENDEE_FIELDS.FIRST_NAME,
                        ATTENDEE_FIELDS.LAST_NAME,
                        ATTENDEE_FIELDS.PHONE,
                        ATTENDEE_FIELDS.EMAIL,
                    ],
                }),
            ]);

            await manager.save([
                manager.create(EventTicket, {
                    eventId: event2.id,
                    name: "Standing Zone B",
                    description: "บัตรยืนโซนมาตรฐาน",
                    price: "800.00",
                    quota: 500,
                    sold: 210,
                    minTicketQTY: 1,
                    maxTicketQTY: 4,
                    sortOrder: 1,
                    isActive: true,
                    includesSouvenir: false,
                    requiredFields: [ATTENDEE_FIELDS.FIRST_NAME, ATTENDEE_FIELDS.LAST_NAME],
                }),
                manager.create(EventTicket, {
                    eventId: event2.id,
                    name: "Standing Zone A (Front Stage)",
                    description: "บัตรยืนชิดขอบเวที",
                    price: "1500.00",
                    quota: 200,
                    sold: 95,
                    minTicketQTY: 1,
                    maxTicketQTY: 4,
                    sortOrder: 2,
                    isActive: true,
                    includesSouvenir: false,
                    requiredFields: [ATTENDEE_FIELDS.FIRST_NAME, ATTENDEE_FIELDS.LAST_NAME, ATTENDEE_FIELDS.PHONE],
                }),
                manager.create(EventTicket, {
                    eventId: event3.id,
                    name: "Standard Gala Seat",
                    description: "ที่นั่งร่วมงานดินเนอร์พร้อมชุดอาหารค่ำ",
                    price: "900.00",
                    quota: 150,
                    sold: 60,
                    minTicketQTY: 1,
                    maxTicketQTY: 2,
                    sortOrder: 1,
                    isActive: true,
                    includesSouvenir: true,
                    requiredFields: [ATTENDEE_FIELDS.FIRST_NAME, ATTENDEE_FIELDS.LAST_NAME, ATTENDEE_FIELDS.EMAIL],
                }),
            ]);

            // ==========================================
            // 4. สร้าง Stores, Products & Store Wallets
            // ==========================================
            const store1 = await manager.save(
                manager.create(Store, {
                    eventId: event1.id,
                    name: "อาม่าหม่าล่า & ยากิโทริ",
                    description: "ปิ้งย่างหม่าล่าสูตรเสฉวนแท้ เผ็ดชาหอมเครื่องเทศ",
                    banner: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
                    thumbnail: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80",
                })
            );

            const store2 = await manager.save(
                manager.create(Store, {
                    eventId: event1.id,
                    name: "ชื่นใจ Craft Soda & Mocktail",
                    description: "เครื่องดื่มคราฟต์โซดาผลไม้แท้ สดชื่นซ่าทุกแก้ว",
                    banner: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
                    thumbnail: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
                })
            );

            await manager.save([
                manager.create(Product, {
                    storeId: store1.id,
                    title: "เซ็ตหม่าล่ารวมมิตร 10 ไม้",
                    description: "หมูสามชั้น เนื้อโคขุน เห็ดออรินจิ และเบคอนพันไส้กรอก ย่างซอสหม่าล่าเข้มข้น",
                    price: "120.00",
                    images: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80"],
                }),
                manager.create(Product, {
                    storeId: store2.id,
                    title: "Yuzu Honey Sparkling Soda",
                    description: "โซดาส้มยูซุผสมน้ำผึ้งป่าเดือนห้า หอมหวานอมเปรี้ยว",
                    price: "65.00",
                    images: ["https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"],
                }),
            ]);

            const store1Wallet = await manager.save(manager.create(Wallet, { storeId: store1.id, total: "4560.00" }));
            const store2Wallet = await manager.save(manager.create(Wallet, { storeId: store2.id, total: "2925.00" }));

            // ==========================================
            // 5. กำหนด Roles & Permissions ให้ผู้ใช้ทั้งหมด
            // ==========================================
            const assignRole = async (
                user: User,
                role: Role,
                perms: Permission[],
                scope: { eventId?: string; storeId?: string } = {}
            ) => {
                const ur = await manager.save(
                    manager.create(UserRole, {
                        userId: user.id,
                        role,
                        eventId: scope.eventId ?? null,
                        storeId: scope.storeId ?? null,
                    })
                );
                if (perms.length > 0) {
                    await manager.save(
                        perms.map((permission) =>
                            manager.create(UserRolePermission, {
                                userRoleId: ur.id,
                                permission,
                            })
                        )
                    );
                }
            };

            const allPerms = Object.values(PERMISSIONS);
            await assignRole(savedUsers["admin@tuatua.com"], Role.ADMIN, allPerms);
            await assignRole(
                savedUsers["vendor1@tuatua.com"],
                Role.VENDOR,
                [PERMISSIONS.STORE_MANAGE, PERMISSIONS.STORE_SELL],
                { eventId: event1.id, storeId: store1.id }
            );
            await assignRole(
                savedUsers["vendor2@tuatua.com"],
                Role.VENDOR,
                [PERMISSIONS.STORE_MANAGE, PERMISSIONS.STORE_SELL],
                { eventId: event1.id, storeId: store2.id }
            );
            await assignRole(
                savedUsers["staff@tuatua.com"],
                Role.STAFF,
                [PERMISSIONS.TICKET_SCAN, PERMISSIONS.TOKEN_TOPUP, PERMISSIONS.REPORT_READ],
                { eventId: event1.id }
            );
            await assignRole(savedUsers["user1@tuatua.com"], Role.USER, []);
            await assignRole(savedUsers["user2@tuatua.com"], Role.USER, []);

            // ==========================================
            // 6. สร้าง Orders, OrderShipping & Tickets
            // ==========================================
            const user1 = savedUsers["user1@tuatua.com"];
            const user2 = savedUsers["user2@tuatua.com"];
            const staffUser = savedUsers["staff@tuatua.com"];

            // Order 1: User 1 ซื้อบัตร Regular 2 ใบ + จัดส่งเสื้อที่ระลึก (PAID)
            const order1 = await manager.save(
                manager.create(Order, {
                    orderNo: "ORD-20261109-001",
                    userId: user1.id,
                    eventId: event1.id,
                    total: "1050.00",
                    status: ORDER_STATUSES.PAID,
                    paymentSlip: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=500&q=80",
                    paidAt: new Date("2026-11-08T14:30:00+07:00"),
                    deliveryMethod: DELIVERY_METHODS.SHIPPING,
                    shippingFee: "50.00",
                })
            );

            await manager.save(
                manager.create(OrderShipping, {
                    orderId: order1.id,
                    recipientName: "รพีภัทร ศิษย์เก่าดีเด่น",
                    recipientPhone: "0855555555",
                    addressLine: "99/9 หมู่บ้านเทคโนวิลเลจ ถนนพหลโยธิน",
                    subDistrict: "เสนานิคม",
                    district: "จตุจักร",
                    province: "กรุงเทพมหานคร",
                    postalCode: "10900",
                    note: "ฝากไว้ที่นิติบุคคลได้เลยครับ",
                    status: SHIPPING_STATUSES.PREPARING,
                })
            );

            await manager.save([
                manager.create(Ticket, {
                    orderId: order1.id,
                    eventId: event1.id,
                    eventTicketId: t1Regular.id,
                    userId: user1.id,
                    unitPrice: "500.00",
                    ticketCode: "TKT-REU26-0001",
                    qrToken: "QR-DEMO-ACTIVE-001",
                    status: TICKET_STATUSES.ACTIVE,
                    firstName: "รพีภัทร",
                    lastName: "ศิษย์เก่าดีเด่น",
                    phone: "0855555555",
                    email: "user1@tuatua.com",
                    graduationYear: "2567",
                    receiveSouvenir: true,
                    souvenirSize: "L",
                }),
                manager.create(Ticket, {
                    orderId: order1.id,
                    eventId: event1.id,
                    eventTicketId: t1Regular.id,
                    userId: user1.id,
                    unitPrice: "500.00",
                    ticketCode: "TKT-REU26-0002",
                    qrToken: "QR-DEMO-USED-002",
                    status: TICKET_STATUSES.USED,
                    firstName: "ณัฐวุฒิ",
                    lastName: "เพื่อนซี้ไอที",
                    phone: "0899999999",
                    email: "friend@tuatua.com",
                    graduationYear: "2567",
                    checkedInAt: new Date("2026-11-09T18:15:00+07:00"),
                    checkedInById: staffUser.id,
                    receiveSouvenir: true,
                    souvenirSize: "XL",
                }),
            ]);

            // Order 2: User 2 ซื้อบัตร VIP 1 ใบ รับหน้างาน (PAID)
            const order2 = await manager.save(
                manager.create(Order, {
                    orderNo: "ORD-20261109-002",
                    userId: user2.id,
                    eventId: event1.id,
                    total: "1000.00",
                    status: ORDER_STATUSES.PAID,
                    paymentSlip: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=500&q=80",
                    paidAt: new Date("2026-11-09T10:00:00+07:00"),
                    deliveryMethod: DELIVERY_METHODS.PICKUP,
                    shippingFee: "0.00",
                })
            );

            await manager.save(
                manager.create(Ticket, {
                    orderId: order2.id,
                    eventId: event1.id,
                    eventTicketId: t1Vip.id,
                    userId: user2.id,
                    unitPrice: "1000.00",
                    ticketCode: "TKT-VIP26-0001",
                    qrToken: "QR-DEMO-VIP-001",
                    status: TICKET_STATUSES.ACTIVE,
                    firstName: "พิมพ์ชนก",
                    lastName: "ร่วมงานสนุก",
                    phone: "0866666666",
                    email: "user2@tuatua.com",
                    graduationYear: "2566",
                    receiveSouvenir: true,
                    souvenirSize: "M",
                })
            );

            // ==========================================
            // 7. สร้างประวัติธุรกรรมกระเป๋าเงิน (Wallet Histories)
            // ==========================================
            const u1Wallet = userWallets["user1@tuatua.com"];
            const u2Wallet = userWallets["user2@tuatua.com"];

            await manager.save([
                manager.create(WalletHistory, {
                    walletId: u1Wallet.id,
                    type: TRANSACTION_TYPES.TOPUP,
                    status: TRANSACTION_STATUSES.COMPLETED,
                    amount: "2000.00",
                    before: "0.00",
                    after: "2000.00",
                    ref: staffUser.id,
                    note: "เติมเงินหน้างานจุดลงทะเบียน #1",
                }),
                manager.create(WalletHistory, {
                    walletId: u1Wallet.id,
                    type: TRANSACTION_TYPES.PURCHASE,
                    status: TRANSACTION_STATUSES.COMPLETED,
                    amount: "120.00",
                    before: "2000.00",
                    after: "1880.00",
                    ref: store1.id,
                    note: "ซื้อเซ็ตหม่าล่ารวมมิตร 10 ไม้",
                }),
                manager.create(WalletHistory, {
                    walletId: store1Wallet.id,
                    type: TRANSACTION_TYPES.PURCHASE,
                    status: TRANSACTION_STATUSES.COMPLETED,
                    amount: "120.00",
                    before: "4440.00",
                    after: "4560.00",
                    ref: user1.id,
                    note: "รับชำระค่าสินค้าจากคุณรพีภัทร",
                }),
                manager.create(WalletHistory, {
                    walletId: u1Wallet.id,
                    type: TRANSACTION_TYPES.PURCHASE,
                    status: TRANSACTION_STATUSES.COMPLETED,
                    amount: "65.00",
                    before: "1880.00",
                    after: "1815.00",
                    ref: store2.id,
                    note: "ซื้อ Yuzu Honey Sparkling Soda",
                }),
                manager.create(WalletHistory, {
                    walletId: store2Wallet.id,
                    type: TRANSACTION_TYPES.PURCHASE,
                    status: TRANSACTION_STATUSES.COMPLETED,
                    amount: "65.00",
                    before: "2860.00",
                    after: "2925.00",
                    ref: user1.id,
                    note: "รับชำระค่าเครื่องดื่มจากคุณรพีภัทร",
                }),
                manager.create(WalletHistory, {
                    walletId: u2Wallet.id,
                    type: TRANSACTION_TYPES.TOPUP,
                    status: TRANSACTION_STATUSES.COMPLETED,
                    amount: "3500.00",
                    before: "0.00",
                    after: "3500.00",
                    ref: staffUser.id,
                    note: "เติมเงินผ่าน QR PromptPay",
                }),
                manager.create(WalletHistory, {
                    walletId: u2Wallet.id,
                    type: TRANSACTION_TYPES.REFUND,
                    status: TRANSACTION_STATUSES.COMPLETED,
                    amount: "300.00",
                    before: "3500.00",
                    after: "3200.00",
                    ref: savedUsers["admin@tuatua.com"].id,
                    note: "แลกคืนเงินสดหลังจบงาน",
                }),
            ]);
        });

        console.log("✅ สร้างข้อมูล Mockup สำเร็จครบทุกตาราง!");
        console.log("--------------------------------------------------");
        console.log("🔑 บัญชีทดสอบ (รหัสผ่านทุกบัญชีคือ: password123)");
        console.log("   - Admin   : admin@tuatua.com");
        console.log("   - Vendor 1: vendor1@tuatua.com (ร้านอาม่าหม่าล่า)");
        console.log("   - Vendor 2: vendor2@tuatua.com (ร้านชื่นใจ Craft Soda)");
        console.log("   - Staff   : staff@tuatua.com");
        console.log("   - User 1  : user1@tuatua.com");
        console.log("   - User 2  : user2@tuatua.com");
        console.log("🎫 QR Token สำหรับทดสอบสแกนบัตรเข้างาน:");
        console.log("   - บัตรพร้อมใช้ : QR-DEMO-ACTIVE-001, QR-DEMO-VIP-001");
        console.log("   - บัตรใช้แล้ว  : QR-DEMO-USED-002");
        console.log("--------------------------------------------------");
    } finally {
        await migrationDataSource.destroy();
    }
}

runSeed().catch((error) => {
    console.error("❌ เกิดข้อผิดพลาดระหว่าง Seed ข้อมูล:", error);
    process.exit(1);
});
