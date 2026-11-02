# สถานะโค้ดและฐานข้อมูลปัจจุบัน

> **Snapshot ก่อน implement** — หลังเอกสารนี้ได้ implement ทุก Phase ใน working tree แล้ว (ยังไม่ commit)
> รวมถึงแก้ปัญหา enum ของ migration ในหัวข้อ 4 ด้วย migration prerequisite ใหม่ ดูสถานะล่าสุดที่ [06-implementation-status.md](06-implementation-status.md)

ตรวจจากโค้ดใน branch `feature/supabase-db-setup` ที่ commit `bc3cbc0` วันที่ 25 ตุลาคม 2026
เอกสารนี้บอกสิ่งที่มีอยู่จริงใน repository แยกจากสิ่งที่ต้องพัฒนาต่อในเอกสาร requirement
การตรวจครั้งนี้ไม่ได้เชื่อมต่อ Supabase หรือ PostgreSQL จึงไม่ยืนยันว่าฐานข้อมูลจริงตรงกับ entity หรือรัน migration ไปแล้วหรือยัง

อ่านต่อ: [สารบัญ](README.md), [Requirements](02-requirements.md), [API contract](03-api-contract.md), [ฐานข้อมูลและความปลอดภัย](04-database-and-security.md), [แผน implementation](05-implementation-plan.md)

## 1. Stack และโครงสร้างที่พบ

อ้างอิง [package.json](../package.json), [tsconfig.json](../tsconfig.json) และ [components.json](../components.json)

| ส่วน | ค่าที่ประกาศในโปรเจกต์ |
| --- | --- |
| Framework | Next.js `16.4.2`, App Router ที่ `app/` |
| UI runtime | React / React DOM `19.3.0` |
| ภาษา | TypeScript `^5`, เปิด strict และ decorator metadata |
| Database access | TypeORM `^1.1.2`, PostgreSQL driver `pg ^8.23.1` |
| Validation library | Zod `^4.6.7` มี dependency แต่ยังไม่พบ API schema |
| UI components | shadcn/ui preset `radix-nova`, Tailwind CSS `^4` |
| Alias | `@/*` ชี้ไปที่ root ของ repository |

ฐานข้อมูลอยู่ใน [server/database](../server/database/) และ export entity รวมจาก [entities/index.ts](../server/database/entities/index.ts)
พบ entity ทั้งหมด 8 ตารางใน schema `public`; ชื่อ property ใน TypeScript ใช้ camelCase แต่ชื่อ column ใน PostgreSQL ใช้ snake_case
ยังไม่พบ API Route Handler, auth/session implementation, service layer, seed หรือ Supabase SDK ในโค้ด branch นี้

## 2. โครงสร้างข้อมูลที่มีอยู่

ทุกตารางใช้ UUID สำหรับรหัสอ้างอิงหลัก; composite primary key ระบุไว้เป็นรายตาราง
`created_at` ใช้ `CreateDateColumn` และ `updated_at` ใช้ `UpdateDateColumn` เมื่อมีใน entity
ทั้งสองชนิดเก็บเป็น `timestamptz`; ยังไม่พบ trigger ฐานข้อมูลสำหรับปรับ `updated_at` เมื่อเขียน SQL ตรง

### 2.1 `users`

ที่มา: [User.ts](../server/database/entities/User.ts)

| Column | Type / เงื่อนไข |
| --- | --- |
| `id` | UUID, generated, primary key |
| `username` | varchar(100), not null, unique |
| `display_name` | varchar(255), not null |
| `payload` | UUID, not null; ยังไม่ได้ระบุความหมาย |
| `status` | enum `user_status`: `active`, `suspended`; default `active` |
| `created_at` | timestamptz, not null |
| `updated_at` | timestamptz, not null |

`uq_users_username` เป็น unique index ตามค่าที่เก็บ ไม่ได้กำหนด lower-case normalization หรือ case-insensitive uniqueness
`payload` ไม่มี unique constraint หรือ foreign key; ห้ามสรุปว่าคือ Supabase Auth user ID, JWT หรือ JSON payload
ต้องตัดสินใจ identity mapping และ migration ที่เหมาะสมก่อนใช้ field นี้ยืนยันตัวตน

### 2.2 `events`

ที่มา: [Event.ts](../server/database/entities/Event.ts)

| Column | Type / เงื่อนไข |
| --- | --- |
| `id` | UUID, generated, primary key |
| `slug` | varchar(150), not null, unique ทั้งระบบ |
| `name` | varchar(255), not null |
| `description` | text, nullable |
| `venue` | varchar(255), nullable |
| `starts_at` | timestamptz, not null |
| `ends_at` | timestamptz, not null |
| `status` | enum `event_status`: `draft`, `published`, `completed`, `cancelled`; default `draft` |
| `created_at` | timestamptz, not null |
| `updated_at` | timestamptz, not null |

มี `uq_events_slug` และ check `ck_events_dates` ที่บังคับ `ends_at > starts_at`
ยังไม่มี field เจ้าของงานโดยตรง; สิทธิ์ดูแลงานอาศัย membership และ event role ซึ่งยังไม่มี service บังคับใช้

### 2.3 `user_events`

ที่มา: [UserEvent.ts](../server/database/entities/UserEvent.ts)

| Column | Type / เงื่อนไข |
| --- | --- |
| `user_id` | UUID, ส่วนหนึ่งของ primary key, FK → `users.id` |
| `event_id` | UUID, ส่วนหนึ่งของ primary key, FK → `events.id` |
| `created_at` | timestamptz, not null |

Primary key คือ `(user_id, event_id)` และมี index `ix_user_events_event_id`
จึงรองรับ User เชื่อมได้หลาย Event โดยเก็บ Event เป็นตารางแยกตามที่ผู้ใช้เลือกไว้
membership ยังไม่มี status, invite state, revoked timestamp หรือข้อมูลบัตรเข้างาน

### 2.4 `user_roles`

ที่มา: [UserRole.ts](../server/database/entities/UserRole.ts), [role.enum.ts](../server/database/enums/role.enum.ts)

| Column | Type / เงื่อนไข |
| --- | --- |
| `id` | UUID, generated, primary key |
| `user_id` | UUID, not null, FK → `users.id` |
| `role` | enum `user_role`: `superadmin`, `admin`, `vendor`, `staff`, `user` |
| `created_at` | timestamptz, not null |

เป็น role ระดับบัญชี ไม่มี `event_id`; unique index `uq_user_roles_global` ครอบ `(user_id, role)`
โค้ดยังไม่ได้กำหนดว่าบทบาทระดับบัญชีแต่ละตัวได้สิทธิ์อะไร โดยเฉพาะ `admin`, `staff`, `vendor` เมื่อไม่มี event scope

### 2.5 `user_event_roles`

ที่มา: [UserEventRole.ts](../server/database/entities/UserEventRole.ts)

| Column | Type / เงื่อนไข |
| --- | --- |
| `id` | UUID, generated, primary key |
| `user_id` | UUID, not null |
| `event_id` | UUID, not null |
| `role` | enum `user_role`; check อนุญาตเฉพาะ `admin`, `staff`, `vendor` |
| `created_at` | timestamptz, not null |

Composite FK `(user_id, event_id)` ต้องพบ membership ใน `user_events`
unique index `uq_user_event_roles_assignment` ครอบ `(user_id, event_id, role)`
บัญชีเดียวมีหลาย role ในงานเดียวได้; `superadmin` และ `user` ถูก check ปฏิเสธในตารางนี้

### 2.6 `user_permissions`

ที่มา: [UserPermission.ts](../server/database/entities/UserPermission.ts)

| Column | Type / เงื่อนไข |
| --- | --- |
| `id` | UUID, generated, primary key |
| `user_id` | UUID, not null, FK → `users.id` |
| `event_id` | UUID, not null, FK → `events.id` |
| `permission` | enum `event_permission_code`; รายการในหัวข้อ 3 ยกเว้น `event.create` |
| `effect` | enum `permission_effect`: `allow`, `deny` |
| `created_at` | timestamptz, not null |
| `updated_at` | timestamptz, not null |

มี Composite FK `(user_id, event_id)` ไป `user_events` เพิ่มจาก FK ของ User และ Event
unique index `uq_user_permissions_event_user_code` ครอบ `(event_id, user_id, permission)` จึงมี effect เดียวต่อสิทธิ์ใน scope เดียว
ยังไม่มีตัวประเมิน permission หรือกฎลำดับความสำคัญระหว่าง role, `allow`, `deny` และบัญชีที่ suspended

### 2.7 `stores`

ที่มา: [Store.ts](../server/database/entities/Store.ts)

| Column | Type / เงื่อนไข |
| --- | --- |
| `id` | UUID, generated, primary key |
| `event_id` | UUID, not null, FK → `events.id` |
| `slug` | varchar(150), not null |
| `name` | varchar(255), not null |
| `description` | text, nullable |
| `approval_status` | enum `store_approval_status`: `pending`, `approved`, `rejected`; default `pending` |
| `operating_status` | enum `store_operating_status`: `closed`, `open`; default `closed` |
| `created_at` | timestamptz, not null |
| `updated_at` | timestamptz, not null |

ร้านหนึ่งอยู่ได้หนึ่ง Event; `uq_stores_event_slug` บังคับ slug ไม่ซ้ำภายในงาน แต่ใช้ slug เดิมต่างงานได้
มี unique constraint `uq_stores_id_event` บน `(id, event_id)` เพื่อรองรับ Composite FK จากสมาชิกของร้าน
check `ck_stores_open_requires_approval` อนุญาต `open` เฉพาะเมื่อ `approval_status = approved`
ยังไม่มีผู้อนุมัติ เวลาอนุมัติ เหตุผลปฏิเสธ หรือ constraint ว่าร้านต้องมี owner อย่างน้อยหนึ่งคน

### 2.8 `store_members`

ที่มา: [StoreMember.ts](../server/database/entities/StoreMember.ts)

| Column | Type / เงื่อนไข |
| --- | --- |
| `store_id` | UUID, ส่วนหนึ่งของ primary key |
| `user_id` | UUID, ส่วนหนึ่งของ primary key, FK → `users.id` |
| `event_id` | UUID, not null |
| `role` | enum `store_member_role`: `owner`, `staff`; default `staff` |
| `created_at` | timestamptz, not null |
| `updated_at` | timestamptz, not null |

Primary key `(store_id, user_id)` และ index `ix_store_members_user_event` บน `(user_id, event_id)`
Composite FK `(store_id, event_id)` → `stores(id, event_id)` และ `(user_id, event_id)` → `user_events(user_id, event_id)`
จึงป้องกันการเพิ่มคนเข้าร้านด้วย event ที่ไม่ตรงกัน และรองรับหนึ่ง User เป็นสมาชิกหลายร้าน
FK ทุกตัวใน entity ทั้ง 8 ตารางใช้ `ON DELETE RESTRICT`; ยังไม่มี workflow ลบหรือถอนสมาชิกที่จัดการ dependency เหล่านี้

## 3. Permission vocabulary ที่ประกาศไว้

ที่มา: [lib/permissions.ts](../lib/permissions.ts); เป็น constants เท่านั้น ยังไม่ใช่ authorization engine

| Constant | Code | จุดประสงค์ตามชื่อ/comment |
| --- | --- | --- |
| `EVENT_CREATE` | `event.create` | สร้างงาน; ไม่อยู่ใน enum สิทธิ์เฉพาะ event |
| `EVENT_UPDATE` | `event.update` | แก้ไขงาน |
| `TICKET_SCAN` | `ticket.scan` | สแกนบัตรเข้างาน |
| `TOKEN_TOPUP` | `token.topup` | เติมเงิน/โทเคนให้ผู้ใช้ |
| `TOKEN_REFUND_APPROVE` | `token.refund.approve` | พิจารณาคำขอคืนเงิน |
| `STORE_MANAGE` | `store.manage` | จัดการร้านค้า |
| `STORE_SELL` | `store.sell` | ขายสินค้า |
| `REPORT_READ` | `report.read` | ดูรายงาน |
| `REPORT_EXPORT` | `report.export` | ส่งออกรายงาน |
| `PERMISSION_MANAGE` | `permission.manage` | จัดการสิทธิ์ |

มี exported type ชื่อ `Permisson` ตามการสะกดในไฟล์ปัจจุบัน; อย่าเปลี่ยนชื่อโดยไม่ตรวจจุดใช้งาน
ยังไม่มี endpoint, ตารางธุรกรรม หรือ flow จริงที่ทำให้ ticket/token/report ทำงานเพียงเพราะมี constants เหล่านี้

## 4. การเชื่อมต่อและ migration

- [database.options.ts](../server/database/database.options.ts): PostgreSQL schema `public`, รับ connection URL เป็น argument
- ตั้ง `synchronize: false`, `migrationsRun: false`, `dropSchema: false`, `logging: false`
- ใช้ UUID extension setting `pgcrypto` และ `installExtensions: false`; ไม่ติดตั้ง extension ให้อัตโนมัติ
- [database.souce.ts](../server/database/database.souce.ts) มีชื่อสะกดนี้จริง; export `createDatabaseSource()` เพื่อสร้าง `DataSource` เท่านั้น ยังไม่ initialize หรือจัดการ shared connection
- [data-source.cli.ts](../server/database/data-source.cli.ts) ใช้ `@next/env` โหลด environment ที่ root แล้วอ่าน key **`DATABASE`**
- CLI โหลด migration `.ts` จาก `server/database/migrations`, ใช้ตาราง `tuatua_migrations` และ transaction mode `all`

พบ migration เดียวคือ [1792597114488-InitialFoundation.ts](../server/database/migrations/1792597114488-InitialFoundation.ts)
ไฟล์นี้อ้างถึง enum `public.user_role`, `public.user_status`, `public.event_status`, `public.event_permission_code`, `public.permission_effect` โดยไม่มีคำสั่งสร้าง enum ทั้งห้าก่อนใช้งาน
มีคำสั่งสร้างเฉพาะ `store_member_role`, `store_approval_status`, `store_operating_status`
ดังนั้น migration ชุดที่อยู่ใน repository ยัง bootstrap ฐานข้อมูลว่างที่ไม่มี enum เดิมไม่ได้

ยังไม่ตรวจ migration history หรือ schema บนฐานข้อมูลจริง จึงห้ามสรุปว่า migration นี้ไม่เคยถูกใช้ หรือแก้ baseline แล้วย่อมปลอดภัย
AI ที่พัฒนาต่อต้องตรวจสถานะและกำหนดกลยุทธ์สำหรับทั้งฐานข้อมูลว่างและระบบที่มีข้อมูลก่อนแก้ migration
การเพิ่ม migration ลำดับหลังอย่างเดียวไม่ช่วย clean install หาก migration แรกยังล้มเหลวจาก enum ที่ไม่มี

## 5. Scripts และผลตรวจในเครื่อง

อ้างอิง scripts ที่มีจริงใน [package.json](../package.json)

| คำสั่ง | หน้าที่ |
| --- | --- |
| `npm run dev` / `build` / `start` | เปิดพัฒนา / build / เปิด production server |
| `npm run lint` | เรียก ESLint |
| `npm run test:db` | เรียก metadata tests ผ่าน ts-node |
| `npm run typeorm -- ...` | เรียก TypeORM CLI ผ่าน tsconfig.typeorm.json |
| `npm run migration:generate -- <path>` | สร้าง migration จาก schema diff; ต้องตรวจ connection เป้าหมายก่อนใช้ |
| `npm run migration:show` | อ่าน migration status จากฐานข้อมูลเป้าหมาย |
| `npm run migration:run` | เปลี่ยน schema ฐานข้อมูลเป้าหมาย |
| `npm run migration:revert` | ย้อน migration ล่าสุด; อาจทำให้ข้อมูลสูญหาย |

[memberships.test.ts](../server/database/tests/memberships.test.ts) มี 5 tests ตรวจ metadata, SQL join และ composite relations โดยไม่ initialize หรือเชื่อมต่อฐานข้อมูล
ผลพยายามรัน `npm run test:db` ในการตรวจครั้งนี้: **รันไม่ได้** เพราะไม่พบ `ts-node` ใน checkout (`'ts-node' is not recognized`)
ไม่ได้ติดตั้ง dependency เพิ่ม; ห้ามรายงานว่า tests ผ่าน และ tests ชุดนี้ไม่ยืนยันว่า migration รันได้จริงแม้จะผ่านในภายหลัง
ไม่ได้รัน migration, เปลี่ยนข้อมูล remote, อ่านค่า secret ใน `.env`, commit หรือ push จากการตรวจครั้งนี้

## 6. ขอบเขตที่ยังต้องพัฒนา

- Identity provider และการผูกบัญชี `users` กับ verified identity รวมถึงความหมาย/การย้าย `payload`
- Login/session, provision profile, suspension checks และป้องกันการตั้ง role ให้ตัวเอง
- Authorization ที่แยก global/event/store scope พร้อม policy และ tests สำหรับ `allow`/`deny`
- API contracts, validation, transactions, shared database initialization และ error handling
- Supabase exposed-schema grants, RLS/policies และการแยกสิทธิ์ credential ของ server
- Store approval workflow, การคง owner/admin คนสุดท้าย และผลของการถอน membership
- Ticket, check-in, wallet/ledger, top-up, payment/refund, product/order/POS, report และ audit trail
- Seed ที่ปลอดภัย, integration/concurrency tests และขั้นตอน deploy/migrate ที่ตรวจสอบย้อนกลับได้

รายละเอียดเป้าหมายและขอบเขตแต่ละเฟสอยู่ใน [Requirements](02-requirements.md) และ [แผน implementation](05-implementation-plan.md)
