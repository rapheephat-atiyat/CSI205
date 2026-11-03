# 03: API Contract สำหรับ implementation

> สถานะล่าสุด 2 พ.ย. 2569: ผู้ใช้ให้เอา API ที่ AI เขียนออกจาก YIERSANSIR เพื่อฝึกเขียนเองแล้ว เอกสารนี้เป็นแนวทาง/ประวัติของฉบับเต็มใน C:\Users\raphe\Desktop\YIERSANSIR-server-auth ไม่ใช่รายการ endpoint ที่เปิดอยู่ในโฟลเดอร์ฝึก ดู [ER และ schema ปัจจุบัน](10-database-er-diagram.md)


**DESIGN ทั้งเอกสาร**: endpoint เหล่านี้เป็นแบบร่างสำหรับพัฒนาต่อ ยังไม่มี route ให้เรียกจริง ตรวจสถานะใน [01](01-current-state.md) และกฎ/คำถาม D00-D14 ใน [02](02-requirements.md) ก่อน implement

## 1. ข้อตกลงร่วม

- Base path: `/api/v1`; Route Handlers ที่ `app/api/v1/**/route.ts`; ใช้ Node.js runtime สำหรับ TypeORM/pg
- JSON ใช้ camelCase, UUID เป็น string, DB ใช้ snake_case ไม่ส่ง entity ตรง ๆ ให้ client ใช้ DTO แบบ allowlist
- ส่งเวลา ISO-8601 UTC เช่น `2026-11-14T11:00:00.000Z`; UI จัดรูปแบบ Asia/Bangkok/พ.ศ. เอง ปีรุ่นใช้ `graduationYearBE` ตามความหมาย ไม่ใช่ timestamp
- จำนวนเงินใช้ integer สตางค์ `priceSatang/totalSatang` และ `currency: "THB"`; Token ใช้ `tokenUnits` จำนวนเต็มในหน่วยฐานที่ยืนยัน D12 ไม่ใช้ float ในการคำนวณ ทุกจำนวนใน JSON รุ่นนี้เป็น number ที่ต้องผ่าน safe-integer และ business limit ตาม D12; delta ใน ledger ติดลบได้ตามชนิดรายการ หากต้องรองรับเกิน `Number.MAX_SAFE_INTEGER` ให้ปรับ contract เป็น decimal string ทั้งระบบอย่างชัดเจนก่อน implement ห้ามสลับชนิดเงียบ ๆ
- `eventId/storeId/userId` มาจาก path หรือ authenticated actor ที่ตรวจแล้ว ไม่เชื่อ scope/เจ้าของ/ราคา/status ที่ client ส่งมา
- POST สร้าง resource ตอบ 201, GET/PATCH/PUT ตอบ 200, DELETE ที่สำเร็จตอบ 204 ไม่มี body; action ที่คืน resource ใหม่ตอบ 201 เว้นแต่ระบุอย่างอื่น
- ทุก request ที่มี body ต้องเป็น `application/json`; malformed JSON = 400, content type ผิด = 415, schema ผิด = 422, method ไม่รองรับ = 405
- Protected response รวม QR/รายงาน/export ใช้ `Cache-Control: private, no-store` ไม่ใช้ shared cache; public event DTO เท่านั้นที่พิจารณา cache แยกได้
- Page list ใช้ `page` default 1, `pageSize` default 20, max 100, stable sort มี UUID เป็นตัวตัดสินเมื่อเวลาซ้ำ; query ที่ไม่รองรับต้องปฏิเสธ ไม่แทรกชื่อ SQL sort จาก input ตรง ๆ

### รูปแบบตอบสำเร็จ

```json
{
  "data": {
    "id": "11111111-1111-4111-8111-111111111111",
    "name": "TUATUA Reunion"
  },
  "meta": { "requestId": "req-example-01" }
}
```

List ใช้ `data: []` และ `meta: {requestId, page, pageSize, total}`; empty list = 200 กับ array ว่าง ไม่ใช่ 404

### รูปแบบตอบผิดพลาด

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "กรุณาตรวจสอบข้อมูล",
    "details": [{ "field": "endsAt", "code": "MUST_BE_AFTER_START" }]
  },
  "meta": { "requestId": "req-example-02" }
}
```

Frontend แปลจาก `code` ไม่เทียบข้อความ `message`; ห้ามส่ง SQL/stack/connection URL/token หรือข้อมูลส่วนตัวของ resource ที่ไม่มีสิทธิ์ใน error

## 2. Authentication และ authorization

### Provider และบัญชี (ขึ้นกับ D00)

ข้อเสนอคือ Supabase Auth ยืนยันตัวตนด้วย cookie session แล้ว map ไป `users` ผ่าน identity mapping ที่ตกลง ไม่เก็บรหัสผ่านใน entity `User` และไม่ใช้ `payload` ยืนยันตัวตนจนรู้ความหมาย

| Method / path | Request / ผล | ข้อกำหนด |
| --- | --- | --- |
| `POST /auth/signup` | ถ้าเลือก email/password: `{email,password}` -> 202 `{verificationRequired}` | เรียก provider; ไม่รับ role/status; ไม่อ้างว่า signup คือสมัครเข้างานแล้ว |
| `POST /auth/login` | `{email,password}` -> 200 `{authenticated:true}` พร้อม session cookie | error ทั่วไปไม่บอกว่าอีเมลมีในระบบไหม; rate limit |
| `POST /auth/logout` | ไม่มี body -> 204 | ยกเลิก session ตาม scope ของ provider และล้าง cookie |
| `POST /me` | `{username,displayName}` -> 201 `MeDto`; บัญชีเดิม -> 200 | ต้องมี provider identity ที่ตรวจแล้ว; provision user/global user role ซ้ำได้โดยไม่ซ้ำบัญชี |
| `GET /me` | `MeDto` หรือ 409 `ACCOUNT_NOT_PROVISIONED` | ต้อง login; ข้อมูลยังไม่ครบส่ง `profileComplete:false` |
| `PATCH /me` | `{displayName?,profile?}` -> `MeDto` | แก้เฉพาะ field อนุญาต ไม่รับ role/permissions/payload/status/authUserId |
| `POST /me/consents` | `{purpose,version,accepted}` -> 201 consent record | version/purpose ต้องมีอยู่ฝั่ง server ตาม D13; actor จาก session; append ประวัติไม่แก้ record เก่า |

เส้นทาง verification/callback/password reset/refresh ต้องออกแบบตามวิธี auth ที่เลือก ไม่สร้าง callback สมมติที่ไม่ใช้จริง ถ้าไม่เลือก email/password ให้แก้ contract auth ส่วนนี้ก่อนทำ

`MeDto` ที่เสนอ: `{id,username,displayName,status,profileComplete,profile,globalRoles}`; `profile` มี `fullName,graduationYearBE,faculty,phone,email` ตามข้อมูลที่ต้องยืนยันและ consent ที่ใช้จริง Provider email ที่ยืนยันแล้วกับ contact email ต้องมีความหมายชัด ไม่อัปเดต provider identity ผ่าน PATCH profile เฉย ๆ

### Guard ของ protected operations

1. ตรวจ session กับ provider ฝั่ง server; ห้ามใช้ JWT decode อย่างเดียวหรือเชื่อ cookie ที่ยังไม่ verify
2. map identity -> app user และปฏิเสธ `suspended` ก่อนประเมิน role
3. ตรวจ resource ownership และ event membership; membership เฉย ๆ ไม่ใช่สิทธิ์ซื้อ/ถือบัตร/ดูข้อมูลคนอื่น
4. ประเมิน role grants + override; ข้อเสนอ `deny` ชนะ `allow` และ role grants ใน event เดียวกัน
5. ตรวจ store scope เพิ่มเมื่อเกี่ยวข้อง; vendor role อย่างเดียวเข้าร้านอื่นไม่ได้
6. ตรวจ business state และ policy ก่อน transaction โดย recheck state ที่เปลี่ยนพร้อมกันได้ภายใน transaction

สำหรับทรัพยากรของบัญชี/งานอื่นตอบ 404 เพื่อลดการเปิดเผยข้อมูล; เมื่อผู้เรียกรู้และเข้าถึง scope ได้แต่ไม่มีสิทธิ์ action ตอบ 403 ทั้งสองกรณีต้องไม่มี side effect

### Permission matrix ที่เสนอ (รอ D11)

| Permission / operation | Superadmin | Event admin | Staff | Vendor/store member | User |
| --- | --- | --- | --- | --- | --- |
| `event.create` | ได้ระดับระบบ | ไม่ให้โดยอัตโนมัติ | ไม่ได้ | ไม่ได้ | ไม่ได้ |
| `event.update` | ได้ | default ในงานตน | เมื่อ grant | ไม่ได้ | ไม่ได้ |
| `ticket.scan` | ได้ในบริบทงาน | default | default ในงานตน | ไม่ได้ | ไม่ได้ |
| `token.topup` | ได้ | default | เมื่อ grant | ไม่ได้จากหน้าที่ร้าน | ไม่ได้ |
| `token.refund.approve` | ได้ | default | เมื่อ grant และ policy อนุญาต | ไม่ได้จากหน้าที่ร้าน | ไม่ได้ |
| `store.manage` | ได้ | ทุก store ในงานตน | เมื่อ grant | owner: ร้านตนเท่านั้น | ไม่ได้ |
| `store.sell` | ได้ | default | ต้องมี store assignment | owner/staff: ร้านที่ผูก | ไม่ได้ |
| `report.read/export` | ได้ | default | เมื่อ grant | เฉพาะสรุปยอดร้านตน; export ต้อง grant | ไม่ได้ |
| `permission.manage` | ได้ | default แต่มีข้อจำกัดการมอบสิทธิ์ | ไม่ให้เอง | ไม่ได้ | ไม่ได้ |
| อ่าน/แก้ resource ของตน | ได้ตามงานดูแล | ไม่เหมารวมข้อมูลเกินหน้าที่ | ตามหน้าที่ | ตามร้าน | ได้เฉพาะตน |

DESIGN: superadmin ที่ active ใช้ policy ระดับระบบแยกจาก event overrides แต่ต้องระบุ event/store และ audit ทุก privileged action; event override ไม่ใช้ปิด superadmin ทั้งระบบ ข้อเสนอนี้ต้องยืนยันใน D11

ผู้มี `permission.manage` ห้ามยกระดับเป็น superadmin/global role ผ่าน event endpoint ห้ามมอบสิทธิ์เกินอำนาจตน ห้ามลบ admin คนสุดท้ายหรือเปิดช่องให้ self-escalation คำตอบ `GET access` ใช้ซ่อน/แสดง UI ได้ แต่ server ต้องตรวจใหม่ทุก action

## 3. Foundation: Events, memberships และร้าน

### Event และ membership

| Method / path | Request / response หลัก | Guard / ผลสำคัญ |
| --- | --- | --- |
| `GET /events` | `?q=&status=published&page=1` -> `PublicEventDto[]` | Public; เปิดได้เฉพาะ published/completed/cancelled ตาม policy ไม่รวม draft |
| `GET /events/{eventId}` | `PublicEventDto` | Public safe fields; draft = 404 |
| `GET /admin/events` | paginated events ที่มีสิทธิ์ | superadmin เห็นตามระบบ; event admin เห็นเฉพาะงานตน |
| `GET /admin/events/{eventId}` | `ManagedEventDto` รวม draft | event admin หรือ superadmin |
| `POST /admin/events` | `{slug,name,description?,venue?,startsAt,endsAt}` -> 201 Event | `event.create` ระดับระบบ; สร้าง draft + creator membership + event admin + audit ใน transaction |
| `PATCH /admin/events/{eventId}` | subset ของ fields เดียวกับ create | `event.update`; ไม่รับ status/ownerId ตรง ๆ; ห้ามเปลี่ยน eventId |
| `POST /admin/events/{eventId}/status` | `{status,reason?}` -> 200 Event | `event.update`; ตรวจ transition และผลต่อธุรกรรม; audit |
| `GET /me/events` | งานที่ผูก membership + roles ของตน | ไม่เอา roles ของงานอื่นมารวม; pagination |
| `PUT /me/events/{eventId}` | ไม่มี body -> 200 membership | DESIGN self-join งาน published ถ้า policy ยอม; ไม่สร้าง role/ตั๋ว/Token; vendor application ขึ้นกับ D04 |
| `GET /events/{eventId}/access` | `{roles,permissions,storeScopes}` ของ actor | login และ scope ถูกต้อง; ไม่คืนสิทธิ์ของคนอื่น |
| `GET /events/{eventId}/members` | `?q=&role=` -> member DTOs | `permission.manage`; จำกัด PII ที่จำเป็น |
| `PUT /events/{eventId}/members/{userId}` | ไม่มี body -> 200 membership | `permission.manage`; target app user ต้องมีอยู่; idempotent |
| `PUT /events/{eventId}/members/{userId}/roles` | `{roles:["staff"]}` -> assigned roles | แทนที่ทั้งชุดเฉพาะ admin/staff/vendor; ปฏิเสธ global roles; lock ป้องกันลบ admin คนสุดท้าย |
| `PUT /events/{eventId}/members/{userId}/permissions/{permission}` | `{effect:"allow"}` หรือ `deny` | `permission.manage`; membership ต้องมี; ไม่รับ `event.create` |
| `DELETE /events/{eventId}/members/{userId}/permissions/{permission}` | 204 คืนไปใช้ role default | สิทธิ์เดียวกับการตั้ง override; audit |

`PublicEventDto`: `{id,slug,name,description,venue,startsAt,endsAt,status}` ไม่มีรายชื่อสมาชิก เบอร์ อีเมล หรือสิทธิ์ ไม่คืน relation ทั้งก้อน

`ManagedEventDto` เพิ่ม settings/ตัวเลขที่มีสิทธิ์อ่านภายหลัง schema รองรับเท่านั้น ไม่มี field สมมติว่ามีแล้ว

ไม่เสนอ delete event/member แบบทั่วไปในรุ่นแรก เพราะ FK `RESTRICT` และผลต่อ ticket/store/ledger ต้องมี workflow ถอนสิทธิ์/เก็บประวัติที่ชัดเจน หากต้องถอนสมาชิกให้ทำ spec และ migration สำหรับสถานะ membership เพิ่มก่อน

### Store และ store membership

| Method / path | Request / response หลัก | Guard / ผลสำคัญ |
| --- | --- | --- |
| `GET /me/stores` | store DTO + eventId + membershipRole | เฉพาะร้านที่ actor เป็นสมาชิก |
| `POST /events/{eventId}/stores` | `{slug,name,description?,ownerUserId?}` -> 201 Store | ช่องทางสร้างตาม D04; vendor ระบุ owner ได้เฉพาะตน; admin ระบุคนอื่นได้ตามสิทธิ์; เริ่ม pending/closed |
| `GET /events/{eventId}/stores/{storeId}` | Store พร้อมข้อมูลจัดการที่อนุญาต | เจ้าของ/สมาชิกเห็นร้านตน; admin มี `store.manage` เห็นในงานตน |
| `PATCH /events/{eventId}/stores/{storeId}` | `{name?,description?}` -> Store | owner+store.manage หรือ event admin; ไม่รับ approvalStatus/operatingStatus/eventId |
| `POST /events/{eventId}/stores/{storeId}/approval` | `{approvalStatus:"approved"|"rejected",reason?}` -> 200 Store | event admin/superadmin + `store.manage`; vendor อนุมัติตนเองไม่ได้; reject ต้อง reason และปิดร้าน atomic |
| `POST /events/{eventId}/stores/{storeId}/operating-status` | `{operatingStatus:"open"|"closed"}` -> 200 Store | owner หรือ event admin + `store.manage`; open ต้อง approved และ event อนุญาตขาย |
| `GET /events/{eventId}/stores/{storeId}/members` | store membership DTOs | owner หรือ event admin + `store.manage` |
| `PUT /events/{eventId}/stores/{storeId}/members/{userId}` | `{role:"owner"|"staff"}` -> membership | owner/admin; ต้องมี user_events ของงานเดียวกันก่อน; ไม่ให้ event admin role อัตโนมัติ |
| `DELETE /events/{eventId}/stores/{storeId}/members/{userId}` | 204 | owner/admin; ห้ามลบ owner คนสุดท้าย; lock store ก่อนนับ/เปลี่ยน |

Store DTO ใช้ field ของ entity จริง: `{id,eventId,slug,name,description,approvalStatus,operatingStatus,createdAt,updatedAt}`; ผู้อนุมัติ/เหตุผล/เวอร์ชันเพิ่มเติมต้องมี migration หรือ audit ตามแบบที่ตกลง

## 4. Catalog และคำสั่งซื้อ (หลัง D01/D02/D06/D12)

| Method / path | Request / response หลัก | Guard / พฤติกรรม |
| --- | --- | --- |
| `GET /events/{eventId}/catalog` | ticketTypes, shirtVariants, public stores/products ตามที่เปิดใช้ | Public safe DTO; ไม่คืนยอด wallet/ต้นทุน/สมาชิก |
| `PATCH /admin/events/{eventId}/settings` | `{salesStartAt?,salesEndAt?,tokenRate?}` | event admin + `event.update`; snapshot policy; ห้ามเปลี่ยนย้อนหลังใน transaction เก่า |
| `POST /admin/events/{eventId}/ticket-types` | `{name,priceSatang,bonusTokenUnits,minPerOrder,maxPerOrder,capacity}` | event admin + `event.update`; จำนวน/ราคาไม่ติดลบและ max>=min |
| `PATCH /admin/events/{eventId}/ticket-types/{typeId}` | field ที่อนุญาตจาก create + `active?` | ห้ามลด capacity ต่ำกว่ายอดขาย/ยอดกันที่ยังใช้ได้ |
| `POST /admin/events/{eventId}/shirt-variants` | `{name,size,priceSatang,stock}` | event admin + `event.update`; รองรับขนาดหลายรายการ |
| `PATCH /admin/events/{eventId}/shirt-variants/{variantId}` | `{priceSatang?,stock?,active?}` | ไม่กระทบ snapshot เก่า; audit |
| `POST /events/{eventId}/orders` | ticketItems/shirtItems ตามตัวอย่าง | login + profile ครบ; server กำหนด buyer/ราคา/ยอด/สถานะ; Idempotency-Key |
| `GET /me/orders` | paginated order summaries | เฉพาะ buyer ของตน |
| `GET /me/orders/{orderId}` | order/items/payment/ticket references ที่อนุญาต | ownership; ไม่คืน QR เพียงเพราะเป็น buyer ถ้า D01 ไม่อนุญาต |
| `POST /events/{eventId}/orders/{orderId}/payments/mock` | `{result:"success"|"failure"}` -> 201 payment result | buyer ของ order ตน; mock mode เท่านั้น; Idempotency-Key; server ควบคุม transition |

ตัวอย่างสร้าง order; UUID และค่าทั้งหมดเป็นข้อมูลสมมติ `ticketItems` หนึ่งแถวต่อผู้เข้าร่วม ไม่มี client price:

```json
{
  "ticketItems": [
    {
      "ticketTypeId": "22222222-2222-4222-8222-222222222222",
      "attendee": {
        "fullName": "ผู้เข้าร่วมตัวอย่าง",
        "graduationYearBE": 2564,
        "faculty": "คณะตัวอย่าง",
        "contactEmail": "attendee@example.com"
      }
    }
  ],
  "shirtItems": [
    {
      "shirtVariantId": "33333333-3333-4333-8333-333333333333",
      "quantity": 1
    }
  ]
}
```

ฟิลด์สำหรับผูก attendee กับบัญชีต้องเพิ่มหลัง D01; ไม่ผูกสิทธิ์ด้วยอีเมลที่ client พิมพ์อย่างเดียว หาก D06 เลือกจัดส่งค่อยเพิ่ม shipping DTO และวัตถุประสงค์เก็บข้อมูล

Order response ที่เสนอ: `{id,eventId,status,currency,totalSatang,expiresAt,items,createdAt}`; item snapshot ระบุ `itemType,sourceId,name,quantity,unitPriceSatang,subtotalSatang,bonusTokenUnits` ตามชนิดและไม่มี field ที่ไม่มีความหมาย

Payment mock ที่สำเร็จต้องได้ order paid + tickets + wallet credit/issuance outcome ที่สอดคล้อง transaction เดียว ห้ามทำ provider network/email call ค้างใน transaction หรือคืน paid เมื่อทำได้เพียงบางส่วน ถ้าใช้ outbox ต้องมีสถานะ/recovery ชัดและทดสอบให้เป็นไปตาม REQ ออกบัตรทันที

## 5. Tickets, QR และ admissions (หลัง D01/D09)

| Method / path | Request / response หลัก | Guard / พฤติกรรม |
| --- | --- | --- |
| `GET /me/tickets` | paginated TicketDto | holder/ผู้ได้รับสิทธิ์ตาม D01; ไม่ใช่ `buyerUserId` อย่างเดียว |
| `GET /me/tickets/{ticketId}` | `{id,eventId,attendee,ticketType,status,admissionState}` | ownership; ต้องมาจาก payment สำเร็จ |
| `GET /me/tickets/{ticketId}/qr` | `{qrToken,expiresAt,serverTime,refreshAfterSeconds:30,allowedOperations}` | ตรวจ ownership/status; allowedOperations ตาม D09 เช่น admission/payment; no-store; ไม่ log qrToken |
| `POST /events/{eventId}/admissions/scans` | `{qrToken,action:"check_in"|"check_out",scannerId?}` -> 201 ScanResult | `ticket.scan`; scannerId เป็น label อุปกรณ์ ไม่ใช่ actor; Idempotency-Key |
| `GET /events/{eventId}/admissions` | `?action=&ticketId=&from=&to=` -> ประวัติ | `ticket.scan` สำหรับหน้าที่จำเป็น หรือ `report.read` ตาม policy |
| `GET /events/{eventId}/attendees` | `?q=&page=` -> attendee safe-for-staff DTOs | `ticket.scan` หรือ admin/read policy; จำกัดการค้นหาและ PII |

ScanResult: `{scanId,ticketId,eventId,action,result:"accepted",admissionState,scannedAt}`; ผลผิดพลาดใช้ error envelope เช่น `QR_EXPIRED`, `QR_INVALID`, `ALREADY_CHECKED_IN`, `NOT_CHECKED_IN`, `REENTRY_NOT_ALLOWED`

DESIGN: ตรวจลายเซ็น/nonce/อายุ/issuer/event/ticket ตาม format ที่ออกแบบ ไม่เชื่อเวลา client QR หนึ่งอาจมี allowed operations ทั้ง admission และ payment ตาม D09; server ตรวจว่า operation ที่เรียกอยู่ในขอบเขต credential นั้น แยก replay scope ของ admission และ payment ห้ามตั้ง `ticket.isUsed=true` แล้วบล็อกการซื้ออาหารหรือ checkout ไปด้วย ไม่บังคับให้ UI มี QR คนละใบโดยอ้างว่าเป็น REQ

ความซ้ำมีสองระดับ: retry คำขอเดิมคืน ScanResult เดิม; การสแกนใหม่ด้วย key ใหม่แต่ state ไม่อนุญาตต้อง 409 และไม่เพิ่ม accepted admission สองแถว ความพยายามที่ปฏิเสธอาจมี audit แยกได้

## 6. Wallets, topups, products และ sales

ต้องตอบ D02/D03/D05/D09/D12 ก่อนล็อก contract ที่เกี่ยวข้อง ทุก operation รับ event scope เสมอ

| Method / path | Request / response หลัก | Guard / พฤติกรรม |
| --- | --- | --- |
| `GET /me/events/{eventId}/wallets` | WalletDto[] ตามเจ้าของที่ตกลง | อาจมีมากกว่าหนึ่ง wallet ถ้า D02 เลือกต่อบัตร; ห้าม assume object เดียว |
| `GET /me/events/{eventId}/wallets/{walletId}/transactions` | paginated LedgerDto | ownership + event scope; ไม่รับ userId จาก client เพื่อสลับเจ้าของ |
| `POST /events/{eventId}/wallets/{walletId}/topups` | `{tokenUnits,reference,reason?}` -> 201 TopupResult | Staff/Admin + `token.topup`; server ตรวจ conversion/policy; Idempotency-Key; mock/manual mode ที่ยืนยัน |
| `POST /me/events/{eventId}/wallets/{walletId}/topup-requests` | `{tokenUnits}` -> pending request | เปิดเฉพาะ D05 เลือก request flow; ไม่ credit ตอนขอ |
| `POST /events/{eventId}/topup-requests/{requestId}/decision` | `{decision:"approve"|"reject",reason?}` -> 200 request | conditional D05; Staff/Admin + `token.topup`; credit approved ครั้งเดียว |
| `POST /events/{eventId}/stores/{storeId}/products` | `{name,priceTokenUnits,stock?,active}` -> 201 Product | owner + `store.manage` หรือ event admin; จำนวนสินค้าตาม D03 |
| `PATCH /events/{eventId}/stores/{storeId}/products/{productId}` | subset name/priceTokenUnits/stock/active | store scope; price snapshot เก่าคงเดิม |
| `POST /events/{eventId}/stores/{storeId}/checkout-intents` | `{items:[{productId,quantity}]}` -> 201 CheckoutIntent | `store.sell` + store assignment; server คำนวณ items/total/expiry ตาม D03 |
| `POST /events/{eventId}/stores/{storeId}/sales` | `{checkoutIntentId,qrToken}` -> 201 SaleDto | `store.sell` + store scope + fresh QR; Idempotency-Key; ยืนยันราคาที่ไม่เปลี่ยนเงียบ ๆ |
| `GET /events/{eventId}/stores/{storeId}/sales` | `?from=&to=&page=` -> SaleDto[] | member ร้านนั้นหรือ event admin ที่มี `report.read`; ไม่แสดงยอด/ประวัติร้านอื่น |

WalletDto: `{id,eventId,owner,availableTokenUnits,heldTokenUnits,totalTokenUnits}` โดย `owner` และการมี held ขึ้นกับ D02/D08 ต้องใช้ DTO แบบเดียวกันทั้ง User/Staff/Vendor หลังยืนยัน policy

LedgerDto: `{id,walletId,eventId,type,availableDeltaUnits,heldDeltaUnits,referenceType,referenceId,createdAt}` ไม่มี endpoint แก้/lบ ledger หรือ PATCH balance

CheckoutIntent: `{id,eventId,storeId,items,totalTokenUnits,expiresAt}` เก็บ snapshot ราคาและจำกัดอายุ หากราคาหรือ state เปลี่ยนก่อนยืนยันให้ปฏิเสธด้วย `CHECKOUT_CHANGED` หรือ `CHECKOUT_EXPIRED` ให้หน้าร้านแสดงยอดใหม่ก่อนสแกนใหม่ ห้ามเรียกเก็บยอดใหม่โดยไม่แจ้ง

SaleDto: `{id,eventId,storeId,checkoutIntentId,totalTokenUnits,amountSatang,rateSnapshot,items,createdAt}`; ไม่มีข้อมูล wallet ของผู้อื่นเกินที่ร้านต้องรู้

การระบุกระเป๋าจ่ายต้อง deterministic ฝั่ง server: QR -> ticket/event -> holder/attendee ตาม D01 -> wallet ตาม D02 ถ้าเลือกต่อบัญชีให้ใช้บัญชีผู้ถือที่ยืนยันแล้วต่องาน ถ้าต่อ attendee/บัตรให้ใช้รหัสนั้น ห้ามใช้ผู้ซื้อแทนผู้ถือหรือรับ walletId อิสระจากร้าน ถ้า resolve ไม่ได้/กำกวมต้องปฏิเสธ ไม่เลือก wallet แรกเอง

DESIGN ป้องกันสแกนจ่ายซ้ำ: checkoutIntent หนึ่งสำเร็จได้หนึ่ง sale; monetary authorization/QR nonce ต้องถูก consume แบบ atomic แยกจาก admission หากเฟรมเดิมสร้าง intent/key ใหม่ก็ห้าม debit อีกด้วย QR การจ่ายชุดเดิม นโยบายออก QR ใหม่/ซื้อหลายร้านภายใน 30 วินาทีต้องตกลงใน D09 ก่อนเปิดขาย

Sale transaction ต้องตรวจ event/store approved+open, products, intent snapshot, ticket/QR ownership, available funds แล้วสร้าง sale/items + debit ledger + เปลี่ยน balance/stock + consume authorization + audit พร้อมกัน `INSUFFICIENT_TOKEN` ต้องไม่เหลือรายการขายบางส่วน

## 7. Refunds (หลัง D07/D08/D10)

| Method / path | Request / response หลัก | Guard / พฤติกรรม |
| --- | --- | --- |
| `POST /me/events/{eventId}/wallets/{walletId}/refunds` | `{tokenUnits,reason?}` -> 201 RefundDto | ownership; policy/time/eligible sources; hold ถ้าเลือก; Idempotency-Key |
| `GET /me/refunds` | RefundDto[] เฉพาะผู้ขอ | filter event/status ที่อนุญาต |
| `GET /events/{eventId}/refunds` | paginated queue | `token.refund.approve` หรือ admin/read policy ที่ตกลง |
| `POST /events/{eventId}/refunds/{refundId}/decision` | `{decision:"approve"|"reject",reason?}` -> 200 RefundDto | `token.refund.approve`; Idempotency-Key; lock refund+wallet; transition ครั้งเดียว |
| `POST /events/{eventId}/refunds/{refundId}/completion` | `{mode:"mock",reference}` -> 200 RefundDto | ผู้มีสิทธิ์ settlement ตาม D10; บันทึกผลจำลอง ไม่ใช่โอนเงินจริง; Idempotency-Key |

RefundDto: `{id,eventId,walletId,tokenUnits,amountSatang,status,requestedAt,decidedAt,completedAt,reason}` คัดข้อมูลบัญชีรับเงินออกถ้ายังไม่ได้ตกลงให้เก็บ ไม่ตีความเวลา approved เป็นเวลาคืนสำเร็จ

ไม่มี endpoint ให้ User กด approved/completed เอง และไม่คืน Token แถมถ้า D07 ไม่อนุญาต

## 8. Reports, audit และ email mock

| Method / path | Response / request | Guard / พฤติกรรม |
| --- | --- | --- |
| `GET /events/{eventId}/reports/overview` | จำนวน registeredUsers, issuedTickets, distinctCheckedInTickets, admissionCount, order totals, sale totals, refund totals แยก metric | `report.read`; ไม่ใช้จำนวน membership แทนบัตร/เข้างาน |
| `GET /events/{eventId}/reports/reconciliation` | totals และ discrepancy records ที่ไม่มี secrets | `report.read`; ตัวเลขอ่านจาก snapshot/ledger ไม่ใช่ราคาปัจจุบัน |
| `GET /events/{eventId}/stores/{storeId}/reports/summary` | ยอดขาย Token/บาทของร้านนั้น | store member ในร้าน + report policy หรือ event admin; ไม่มีระบบรวมร้านอื่น |
| `GET /events/{eventId}/reports/exports/{reportType}` | CSV UTF-8 BOM; `reportType=attendees|sales|reconciliation` | `report.export` และสิทธิ์ read ของ dataset; จำกัดคอลัมน์; audit |
| `GET /events/{eventId}/audit-logs` | paginated append-only audit DTO | admin + `report.read` ตาม policy; ไม่รับ UPDATE/DELETE |
| `GET /events/{eventId}/email-jobs` | สถานะ mock jobs ที่มีสิทธิ์ | admin/read policy; `mode=mock`, `status=queued|simulated|failed`; ไม่แสดงเนื้อหา PII เกินจำเป็น |

ระบุ `from` inclusive / `to` exclusive ใน ISO UTC สำหรับรายงานทุกตัว ตรวจ from<to และจำกัดช่วง query ป้องกันโหลดไม่จำกัด หากมี pagination/export job ภายหลังต้องใช้ scope และนิยาม metric ชุดเดียวกัน

## 9. Validation และ errors ที่ต้องรองรับ

DESIGN: trim strings, ปฏิเสธ control characters, จำกัดความยาวตาม entity, canonical username กับ unique index ให้ตรงกัน, slug เป็น lowercase kebab-case ไม่เกิน 150 ตัวอักษร, name/displayName ไม่ว่างไม่เกิน 255

รองรับ PATCH เฉพาะ field ที่กำหนด ปฏิเสธ unknown/privileged fields ไม่ใช้ `repository.save(requestBody)` และไม่ spread input ใส่ entity โดยตรง `null` ใช้ล้างได้เฉพาะ nullable field; field หายหมายถึงไม่เปลี่ยน

| HTTP | error.code ตัวอย่าง | ผลที่ต้องเกิด |
| --- | --- | --- |
| 400 | `INVALID_JSON`, `INVALID_IDEMPOTENCY_KEY` | ไม่มี side effect |
| 401 | `UNAUTHENTICATED` | ไม่มี/หมดอายุ/verify session ไม่ผ่าน |
| 403 | `FORBIDDEN`, `ACCOUNT_SUSPENDED` | ไม่อนุญาต operation แม้รู้ scope |
| 404 | `NOT_FOUND` | ไม่มี resource หรืออยู่ต่าง ownership/scope |
| 409 | `SLUG_CONFLICT`, `USERNAME_CONFLICT`, `ACCOUNT_NOT_PROVISIONED`, `PROFILE_INCOMPLETE` | client แก้ conflict/onboarding ก่อนทำใหม่ |
| 409 | `INVALID_STATE`, `LAST_ADMIN`, `LAST_STORE_OWNER`, `STORE_NOT_READY` | transition/constraint ไม่ผ่าน |
| 409 | `ALREADY_CHECKED_IN`, `NOT_CHECKED_IN`, `REENTRY_NOT_ALLOWED` | ไม่เพิ่ม accepted scan ซ้ำ |
| 409 | `QR_EXPIRED`, `QR_INVALID`, `QR_REPLAYED` | ไม่ debit หรือรับ admission |
| 409 | `INSUFFICIENT_TOKEN`, `OUT_OF_STOCK`, `ORDER_EXPIRED`, `CHECKOUT_CHANGED`, `CHECKOUT_EXPIRED`, `REFUND_NOT_ELIGIBLE` | ไม่มีผลสำเร็จบางส่วน |
| 409 | `IDEMPOTENCY_CONFLICT`, `REQUEST_IN_PROGRESS` | ไม่รันคำขอต่าง body ด้วย key เดิม หรือทำซ้ำระหว่างคำขอเดิมยังไม่จบ |
| 415 / 422 | `UNSUPPORTED_MEDIA_TYPE` / `VALIDATION_ERROR` | details field errors ที่ไม่เปิดเผย PII |
| 429 | `RATE_LIMITED` | ระบุ Retry-After ที่เหมาะสม |
| 500 / 503 | `INTERNAL_ERROR` / `SERVICE_UNAVAILABLE` | rollback และคืน requestId เพื่อค้น log; ไม่ตอบสำเร็จเมื่อ DB ล้มเหลว |

## 10. Idempotency contract

บังคับ `Idempotency-Key` สำหรับ order, payment, topup, admission, sale, refund request/decision/completion รวมถึง retry ของ action ที่มีผลต่อยอด ขาดหรือรูปแบบผิดใช้ 400 พร้อม code ที่ชัดเจน เช่น UUID ที่ client สร้างต่อหนึ่ง intent

- Scope key อย่างน้อย `(actorUserId, operation, eventId, idempotencyKey)` พร้อม canonical request hash และ target resource
- key เดิม+body เดิม: หลังตรวจสิทธิ์ปัจจุบันแล้วคืน status/body ผลเดิม พร้อม `Idempotency-Replayed: true`; ไม่ทำ side effect ซ้ำ
- key เดิม+body ต่าง: 409 `IDEMPOTENCY_CONFLICT`; คำขอเดิมยังทำอยู่: รอแบบจำกัดเวลาหรือ 409 `REQUEST_IN_PROGRESS` ให้ retry ด้วย key เดิม
- บันทึก idempotency กับ business transaction โดย unique constraint; ไม่ใช้ in-memory map อย่างเดียว เพราะมีหลาย process/รีสตาร์ตได้
- มี business uniqueness แยกอีกชั้น เช่น payment success ต่อ order, ticket ต่อ order attendee item, grant ต่อ paid item, sale ต่อ intent, accepted scan state และ completed refund ต่อ request แม้ client เปลี่ยน key
- ยืนยัน retention ของ key ใน D14; การหมดอายุ cache ต้องไม่ทำให้ธุรกรรมเก่าสำเร็จซ้ำได้ ห้ามเก็บ raw QR/credentials ใน request hash payload หรือ response cache โดยไม่จำเป็น

## 11. หมายเหตุสำหรับผู้ implement

Endpoint ยาวในเอกสารเป็นการแบ่ง resource ไม่ใช่ให้คัดลอกเป็น service แยก process ทุกโมดูลใช้ auth, permission, transaction, error และ DTO กลางชุดเดียวกัน เริ่ม foundation ก่อน; ยังไม่ implement endpoint ที่ต้องรอคำตอบ Dxx

ข้อตกลงของ auth SDK ต้องตรวจเอกสารปัจจุบันเมื่อเริ่มงาน: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) และ [ความต่างของการตรวจ token กับ session](https://supabase.com/docs/guides/auth/server-side/advanced-guide) ตรวจอ้างอิงวันที่ 2026-10-25 ส่วน Next.js ให้ใช้เอกสารเวอร์ชันติดตั้งใน `node_modules/next/dist/docs/`
