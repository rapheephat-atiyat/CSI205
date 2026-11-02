# 04: ฐานข้อมูล Transaction และความปลอดภัย

> สถานะล่าสุด 2 พ.ย. 2569: ผู้ใช้ให้เอา API ที่ AI เขียนออกจาก YIERSANSIR เพื่อฝึกเขียนเองแล้ว เอกสารนี้เป็นแนวทาง/ประวัติของฉบับเต็มใน C:\Users\raphe\Desktop\YIERSANSIR-server-auth ไม่ใช่รายการ endpoint ที่เปิดอยู่ในโฟลเดอร์ฝึก ดู [ER และ schema ปัจจุบัน](10-database-er-diagram.md)


สถานะทั้งหมดในเอกสารนี้คือ **DESIGN สำหรับพัฒนาต่อ** ยกเว้นส่วนที่ระบุว่า “มีแล้ว” และอ้างโค้ดจริง
ยังไม่ได้สร้างตารางใหม่ เปลี่ยน credential ตั้ง RLS หรือรัน migration จากงานเอกสารครั้งนี้
อ่าน [สถานะปัจจุบัน](01-current-state.md), [Requirements และ D00-D14](02-requirements.md) และ [API contract](03-api-contract.md) ประกอบ

## 1. สถาปัตยกรรมที่เสนอ

```text
Browser / Scanner / Kiosk
  -> Next.js Route Handler (Node.js runtime)
  -> verified identity + validation + authorization
  -> domain service + transaction
  -> TypeORM / pg
  -> PostgreSQL บน Supabase

Supabase Auth (ถ้า D00 ยืนยัน) -> verified identity -> app user
Transaction -> outbox -> worker / simulated email adapter
```

Route Handler รับผิดชอบ HTTP, validation และแปลง error; ไม่กระจายกฎการเงินหรือ SQL ไปตาม route
Service กลางรับ actor/context ที่ตรวจแล้ว และใช้ authorization อีกครั้งกับ resource ที่โหลดจริง
Repository/query ต้องมี event/store/owner scope ตามงาน ไม่เชื่อ `eventId` จาก body ว่าเป็นหลักฐานสิทธิ์
ให้โมดูลฐานข้อมูลและความลับเป็น server-only; endpoint ที่ใช้ TypeORM/pg ต้องรันบน Node.js ไม่ใช้ Edge runtime
ก่อนเขียน Route Handler ให้ตรวจเอกสาร Next.js เวอร์ชันที่ติดตั้งตาม [AGENTS.md](../AGENTS.md)

Supabase Auth เป็นข้อเสนอภายใต้ **D00** ไม่ใช่ระบบที่ติดตั้งแล้ว; ถ้าเลือก provider อื่นให้เปลี่ยน adapter โดยคง verified actor contract
แยก Supabase Auth client สำหรับ session ออกจาก TypeORM connection สำหรับ business data
การใช้ Supabase เป็นที่เก็บ PostgreSQL ไม่ได้ทำให้ TypeORM ได้ session หรือสิทธิ์ผู้ใช้อัตโนมัติ

## 2. Connection และ environment

**มีแล้ว:** [data-source.cli.ts](../server/database/data-source.cli.ts) อ่าน environment key `DATABASE`
และ [database.souce.ts](../server/database/database.souce.ts) ชื่อสะกดนี้จริง export `createDatabaseSource(databaseUrl)` แต่ยังไม่ได้ initialize
ห้ามเขียนคู่มือราวกับมี `DATABASE_URL`, Supabase client หรือ connection singleton ใช้งานอยู่แล้ว

DESIGN สำหรับ runtime:

1. ตรวจ configuration เมื่อเริ่มใช้ connection โดยไม่แสดง URL/รหัสผ่านใน error
2. สร้าง DataSource ต่อ process และเก็บ initialization promise ที่ใช้ร่วมกัน
3. ทุก request ที่เข้าพร้อมกันรอ promise เดียว แทนการ initialize หลายครั้ง
4. ถ้า initialization ล้มเหลว ล้างเฉพาะ promise ที่เสียเพื่อให้ retry แบบมีขอบเขตได้ ไม่สร้าง reconnect loop
5. ไม่ `destroy()` connection หลังทุก request; ปล่อย query runner/transaction ที่ยืมมาทุกครั้งใน finally
6. ไม่เก็บ actor/session ใน DataSource ส่วนกลาง; session เป็นบริบทต่อ request

แต่ละ serverless instance มี pool ของตน จึงต้องกำหนดขนาด pool/timeout เทียบจำนวน instance และ limit ของ Supabase
เลือก direct/session pooler/transaction pooler ตามรูปแบบ deployment และความสามารถที่ ORM ใช้ แล้วทดสอบ transaction จริง
อย่าคัดลอกค่า connection mode หรือปิด certificate validation เพียงเพื่อให้ต่อผ่าน
แนวทางเลือก connection อ้างอิง [Supabase: Connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)

แยก runtime DB role ที่มีเฉพาะสิทธิ์จำเป็นออกจาก migration role ที่แก้ DDL ได้
ปัจจุบัน CLI ใช้ `DATABASE` เช่นเดียวกัน; ถ้าจะแยก environment key สำหรับ migration ต้องแก้ loader และเอกสารให้ตรงกันในงาน implementation
ไม่ใช้ owner/superuser เป็น runtime โดยปริยาย และไม่ใส่ DB password หรือ secret/service-role key ใน `NEXT_PUBLIC_*`
ถ้า D00 เลือก Supabase Auth ให้เพิ่มเฉพาะ public URL/publishable key ที่จำเป็นใน browser และเก็บ privileged key ฝั่ง server
ใช้ `.env.example` ที่ไม่มีค่าจริงเมื่อต้องส่งต่อ; `.gitignore` ปัจจุบัน ignore `.env*` จึงต้องมี exception ที่ตั้งใจเพิ่ม

## 3. Identity และอายุข้อมูล

**OPEN D00:** `users.payload` เป็น UUID บังคับ แต่ยังไม่มีความหมาย, unique constraint หรือ FK
ห้าม rename เป็น `auth_user_id`, เติมค่าเดา หรือลบคอลัมน์ก่อนทราบว่าข้อมูลเดิมคืออะไร
ข้อเสนอเมื่อเลือก Supabase Auth คือ app `users.id` คงรหัสธุรกิจแยก และเพิ่ม identity mapping ที่ unique กับ `auth.users.id`
ต้องกำหนดทั้งการ backfill, nullability ช่วงย้าย และการปฏิเสธ identity ที่ map ไม่ได้ ก่อนเปิด protected endpoint

Provision profile ต้อง idempotent: callback หรือ request แรกที่มาพร้อมกันสร้าง app user เดียว และไม่ได้รับ role สูงจาก client metadata
ถ้าใช้ auth trigger ต้องทดสอบความล้มเหลวของ trigger ที่อาจทำให้ signup ล้มเหลวด้วย
อย่าอ้าง column/index ภายใน managed Auth schema นอกเหนือ identifier ที่ provider รับรอง
แนวทางแยก profile และอ้างอิง Auth ดู [Supabase: Managing User Data](https://supabase.com/docs/guides/auth/managing-user-data)

ตัวอย่าง cascade ในคู่มือ provider ไม่ได้เป็นคำตัดสินเรื่องอายุ order/ledger ของ TUATUA
ห้ามเพิ่ม `ON DELETE CASCADE` จาก Auth จนธุรกรรม ตั๋ว หรือ audit ถูกลบตามโดยไม่ตั้งใจ
ต้องออกแบบการปิดบัญชี/ตัด identity/จัดการข้อมูลส่วนตัวตาม D13 โดยรักษาหลักฐานธุรกรรมและ FK ที่จำเป็น
การ suspend บัญชีต้องมีผลต่อ protected operation แม้ session ที่เคยออกยังไม่หมดอายุ

## 4. Migration และการ bootstrap

**มีแล้ว:** ใช้ TypeORM migrations, ตาราง history `tuatua_migrations`, transaction mode `all`
คง `synchronize: false`, `migrationsRun: false`, `dropSchema: false`; ไม่ซิงก์ schema หรือรัน migration เมื่อ API รับ request

ปัญหาที่ตรวจพบใน [InitialFoundation](../server/database/migrations/1792597114488-InitialFoundation.ts):

- อ้าง `user_role`, `user_status`, `event_status`, `event_permission_code`, `permission_effect` ก่อนมีคำสั่งสร้าง
- มีคำสั่งสร้างเฉพาะ enum ฝั่งร้านสามชนิด จึงใช้ bootstrap ฐานข้อมูลว่างที่ไม่มี type เดิมไม่ได้
- เพิ่ม migration ลำดับหลังเพียงอย่างเดียวไม่แก้กรณี migration แรกหยุดก่อนถึงไฟล์ใหม่

Branch นี้ติดตาม origin และมี migration อยู่ใน commit แล้ว จึงไม่ถือว่าเป็น draft ที่แก้ประวัติได้ตามใจ
ยังไม่ได้ตรวจประวัติ remote DB; ห้ามสรุปว่า migration เคย/ไม่เคยถูก apply และห้ามเขียนทับ migration ที่เผยแพร่แล้วเงียบ ๆ
ก่อนทำงานที่ต้องแตะฐานข้อมูล ให้รับขอบเขตที่ผู้ใช้มอบหมายและตรวจ target/history แบบอ่านอย่างปลอดภัย
แยกแผน clean install กับแผนอัปเกรดระบบที่มีข้อมูล เช่น prerequisite baseline ที่ชัดเจน และ forward correction ตามสถานะจริง
ต้องให้ทุก environment มีขั้นตอนที่ทำซ้ำได้ ไม่สร้าง enum ด้วยมือครั้งเดียวแล้วปล่อยให้ repo อธิบายระบบไม่ครบ

Checklist ของ migration แต่ละชุด:

1. สร้าง dependency/type ก่อน table และสร้าง constraint ตามลำดับ FK ที่ถูกต้อง
2. ตรวจ schema diff ว่าไม่มี drop/rename จากการ map entity ผิด และไม่แตะ managed Auth objects โดยไม่จำเป็น
3. ทดสอบบน PostgreSQL ที่ทิ้งได้ ทั้งฐานข้อมูลว่างและ fixture ที่แทนข้อมูลเวอร์ชันก่อน
4. ตรวจ up/down หรือระบุชัดว่า down ทำให้ข้อมูลเสียหาย พร้อมแผนกู้คืน/forward fix ที่ทดสอบแล้ว
5. ทดสอบ backup/restore ตาม D14 ก่อนเปลี่ยนฐานข้อมูลจริง; transaction ไม่แทน backup
6. บันทึก version ที่ติดตั้งและผลตรวจหลัง migration โดยไม่บันทึก secret

เอกสารนี้ไม่อนุญาตให้รัน `migration:run` หรือ `migration:revert` กับ Supabase จริง

## 5. Roadmap ตารางและความสัมพันธ์

ตารางด้านล่างเป็นชื่อ/โครงสร้างเสนอ ไม่ใช่ SQL executable และยังไม่ใช่ migration ที่สร้างแล้ว
รักษา 8 ตารางเดิมและ composite FK ที่ป้องกันการผูกสมาชิกข้ามงาน; อย่าลดเหลือ `users.event_id/store_id` ตัวเดียว
ตารางที่ยังไม่มีและ policy ที่เกี่ยวข้องต้องได้รับการตัดสินใจก่อนล็อก schema

| Domain | ตารางเดิม/ตารางที่เสนอ | ข้อมูลสำคัญและ dependency |
| --- | --- | --- |
| Identity/profile | เดิม `users`; identity mapping/profile fields/consents เสนอเพิ่ม | verified provider ID unique หลัง D00, รุ่น/คณะ/ข้อมูลติดต่อ, consent version/time ตาม D13 |
| Membership | เดิม `user_events`, `user_roles`, `user_event_roles`, `user_permissions` | คง global/event scope; D11 กำหนด resolver และสิทธิ์ bootstrap |
| Events | เดิม `events`; เสนอ `event_settings` | sales window, rate policy/version, refund policy; D07/D12 |
| Catalog | เสนอ `ticket_types`, `shirt_variants` | event, price, included Token, min/max, inventory/version; D06/D12 |
| Orders | เสนอ `orders`, `order_items`, inventory reservations | buyer, event, status, expiry, quantity, immutable price/rate/product snapshots; D12 |
| Payments | เสนอ `payments` | order, amount, mode `mock`, attempt/result, unique success/source reference; D10 |
| Attendees/tickets | เสนอ `attendees`, `tickets` | attendee แยก buyer, order item, event, identity/claim ตาม D01; ไม่ใช้ membership แทนตั๋ว |
| Admission/QR | เสนอ admission state, `admission_scans`, nonce/replay state | ticket/event/action/actor/result, freshness และ inside/outside; D09 |
| Wallet | เสนอ `wallets`, `wallet_ledger`, source allocations | event + owner ที่ D02 เลือก, integer units ตาม D12, available/held ตาม D08 |
| Top-up | เสนอ `topups` | request/confirmation actor, source, amount/rate snapshot, ledger reference; D05/D10 |
| Stores | เดิม `stores`, `store_members` | คง approval/operating แยก; owner/admin invariants; D04 |
| Products/sales | เสนอ `products`, `checkout_intents`, `sales`, `sale_items`, payment authorization/replay records | store/event, intent expiry/price snapshot, wallet mapping ตาม D02, QR allowed operations/nonce ตาม D09, unique consumption; รูปแบบสินค้ารอ D03 |
| Refunds | เสนอ `refunds`, reservations/hold references | wallet/source, requested/approved/settled units, policy snapshot, decision actors; D07/D08/D10 |
| Cross-cutting | เสนอ `idempotency_records`, `audit_logs`, `email_outbox` | actor/scope/operation identity, result references, retry/simulation states |

ทุก resource ที่อยู่ในงานมี `event_id` โดยตรงหรือความสัมพันธ์ที่พิสูจน์ scope ได้
ใช้ composite unique/FK เมื่ออ้างคู่ identifier ที่ต้องอยู่ event เดียวกัน เช่น `(ticket_id,event_id)` หรือ `(store_id,event_id)`
การ join/find ด้วย UUID อย่างเดียวไม่แทนเงื่อนไข event/owner; FK ป้องกันข้อมูลเสียแต่ไม่แทน authorization
field สำคัญต้องมี NOT NULL/check/unique ตาม invariant และมี request validation เพิ่มอีกชั้น
ข้อมูลราคา/เรท/ชื่อสินค้าใน transaction ต้องเป็น snapshot ไม่ join ราคาปัจจุบันมาเปลี่ยนอดีต
เวลาใช้ `timestamptz`, ส่ง API เป็น ISO-8601 UTC; กฎวันสิ้นสุดและช่วง 7 วันต้องระบุ timezone ตาม D07
เพิ่ม index ตาม query จริง เช่น `(event_id,status,created_at,id)`, owner/event และ FK ที่ใช้ค้น ไม่เพิ่มทุก field โดยไม่มีเหตุผล

## 6. หน่วยเงิน เรท และเจ้าของกระเป๋า

**D02 เป็น gate:** ยังไม่เลือกว่ากระเป๋าเป็นของบัญชี/ผู้เข้าร่วม/ตั๋ว จึงยังล็อก owner unique key ไม่ได้
อย่าเลือก nullable `user_id/attendee_id/ticket_id` หลายช่องโดยไม่กำหนดว่าต้องมี owner ชนิดเดียวและบังคับด้วย constraint
การออกบัตรที่ต้องเครดิต Token ต้องรอ policy นี้ ไม่เครดิตทุกใบไปกระเป๋าผู้ซื้อโดยอัตโนมัติ

**D12 เป็น gate:** เสนอเงินบาทเก็บเป็นสตางค์ integer และ Token เก็บ integer base unit ที่ระบุ scale ชัดเจน
ไม่คำนวณยอดเงินด้วย binary floating-point; เลือก integer/numeric precision และขอบเขตที่รองรับอย่างชัดเจน
API รุ่นที่เสนอในเอกสาร 03 ใช้ JSON number ที่ตรวจ safe-integer และ business limit; ถ้า DB ใช้ bigint ให้แปลงเฉพาะค่าที่อยู่ในช่วงปลอดภัยและตรวจ overflow
ถ้าจำเป็นต้องรองรับยอดเกินช่วงดังกล่าว ต้องปรับ API/DTO/validation ทั้งระบบเป็น decimal string อย่างชัดเจนก่อนเปิดใช้ ห้ามแปลง bigint เป็น Number จนเสียความแม่นยำหรือส่ง number/string สลับกัน
เก็บอัตราแปลงเป็นจำนวนเต็ม numerator/denominator หรือ exact decimal ที่กำหนด precision และวิธีปัดเศษ
snapshot เรท/เวอร์ชัน/หน่วยใน credit, sale และ refund; ห้ามนำเรทใหม่มาคำนวณประวัติเดิม
Token แถมและเติมต้องมี source allocation ที่ตรวจย้อนกลับได้เพื่อคำนวณส่วนคืนตาม D07

## 7. Ledger และ available/held

DESIGN แนะนำภายใต้ **D08**: แยก `available` ที่ใช้จ่ายได้ กับ `held` ที่กันไว้ระหว่างรอคืน
หากยังไม่ตกลง D08 ห้ามเปิด refund workflow ที่สมมติว่าการกันยอดมีแล้ว
ใช้ ledger append-only เป็นประวัติ และอาจเก็บยอดสรุปใน wallet เพื่อ lock/อ่านเร็ว โดยต้องกระทบยอดกันได้เสมอ
ตัวอย่างต่อไปนี้อธิบายหลักการ delta ไม่ใช่ DDL และไม่ใช่ข้อสรุปว่า Token แถมคืนได้:

| การทำรายการ | Δ available | Δ held | ผลรวม Token |
| --- | --- | --- | --- |
| เครดิตที่ยืนยันแล้ว `c` | `+c` | `0` | เพิ่ม `c` |
| ขายสินค้า `s` | `-s` | `0` | ลด `s` |
| ขอคืนและกันยอด `r` | `-r` | `+r` | เท่าเดิม |
| ปฏิเสธคำขอ/ปล่อยกัน `r` | `+r` | `-r` | เท่าเดิม |
| คืนสำเร็จจากยอดที่กัน `r` | `0` | `-r` | ลด `r` |

บังคับ available/held ไม่ติดลบ และ unique source reference ต่อผลทางบัญชี เช่น payment/ticket/topup/sale/refund action
ทุก ledger entry มี event/wallet/source/type/delta/actor/time และ reversal reference เมื่อเป็นการชดเชย
ห้าม UPDATE/DELETE ledger เพื่อแก้ยอด; การผิดพลาดใช้ compensating entry อ้างต้นฉบับพร้อมเหตุผลและสิทธิ์
ยอด summary, ledger และ source allocation ต้องเปลี่ยนภายใน transaction เดียวกัน
กระทบยอดแยก event และ wallet: ยอดตั้งต้น + ผลรวม delta = ยอด summary และรายการ held ต้องมี reservation รองรับ
ห้ามโอน balance ข้าม event หรือใช้ wallet คนละ event แม้ UUID ของเจ้าของจะเหมือนกัน

## 8. Transaction และ concurrency

ทุกขั้นใน transaction ต้องใช้ TypeORM transaction manager/query runner ตัวเดียว ห้ามบาง repository หลุดไปใช้ global manager
กำหนดลำดับ lock ที่คงที่ เช่น event/store -> order/inventory -> wallet -> refund เพื่อลด deadlock
ใช้ row lock หรือ atomic conditional update พร้อม constraint; อย่าอ่านยอดแล้วค่อย update ด้วยค่าที่คำนวณนอก transaction
กำหนด retry เฉพาะ deadlock/serialization ที่ยอมรับได้ มีขอบเขต และทำงานร่วมกับ idempotency

| Operation | สิ่งที่ต้องสำเร็จ/ล้มเหลวร่วมกัน |
| --- | --- |
| Create event | event + creator membership + scoped admin ตาม D11 + audit |
| Create store | store pending/closed + membership ที่จำเป็น + owner + audit |
| Order | validate sales/price + inventory strategy D12 + order/items/snapshots |
| Mock payment success | ตรวจ ownership/order + payment transition + paid order + ออกตั๋ว + credit ตาม D02 + audit/outbox |
| Admission | lock ticket admission state + ตรวจ QR/scope/action + บันทึกผล/state เดียว |
| Top-up confirm | ตรวจ confirmer/policy + transition + wallet credit/source allocation + audit |
| Sale | lock ร้าน/สินค้า/checkout intent ตามลำดับ + ตรวจ QR/allowed operation/ผู้จ่าย + stock + wallet debit + sale/items + consume intent/payment authorization + audit |
| Refund decision | lock refund/wallet + ตรวจ policy/transition + hold/release/debit + decision/audit/outbox |

ไม่เรียกบริการภายนอกขณะถือ DB lock นาน; งานที่ต้องส่งต่อใช้ outbox หลัง commit พร้อม unique delivery identity
สำหรับ mock payment ใน scope นี้ทำผลสำเร็จและ issuance แบบ atomic ได้; ห้ามเหลือ order paid แต่ตั๋ว/Token ออกครึ่งหนึ่ง
ถ้าอนาคตใช้ gateway จริงต้องออกแบบ external settlement/recovery แยก ไม่อ้างว่า DB transaction rollback การจ่ายเงินจริงได้
race ระหว่างร้านปิด/ถอนอนุมัติกับ sale ต้องใช้การตรวจภายใต้ lock ที่เกี่ยวข้อง ไม่อาศัยค่าจากหน้าจอ
สองเครื่องสแกนหรือใช้จ่ายพร้อมกันต้องได้ผลตาม invariant แม้ใช้คนละ application instance

## 9. Idempotency

DESIGN: คำสั่งที่สร้างผลถาวรรับ idempotency key ตาม [API contract](03-api-contract.md)
unique key อย่างน้อยประกอบ actor, event/scope, operation และ client key; ไม่ใช้ key รวมทั้งระบบโดยไม่มีขอบเขต
เก็บ canonical request fingerprint ที่ไม่เปิดเผย secret พร้อมสถานะ processing/completed และ result/resource reference
key เดิม + เนื้อหาคำสั่งเดิมคืนผลเดิม; key เดิม + คำสั่งต่างกันได้ conflict ไม่รันคำสั่งใหม่
reserve/complete idempotency record และผลทางธุรกิจต้องผูก transaction หรือใช้ recovery protocol ที่ทดสอบแล้ว
request ที่พร้อมกันต้องชน unique constraint/lock เดียวกัน ไม่อาศัย Map ใน memory เพื่อกันซ้ำ

เสริม unique business reference เช่น paid issuance ต่อ order item/seat, credit ต่อ source และ debit ต่อ sale
checkout intent ต้องมี event/store scope, expiry และ immutable item/price snapshots โดยหนึ่ง intent มี successful sale ได้ครั้งเดียว
QR ต้อง resolve wallet จาก ticket/holder ตาม D01/D02 ฝั่ง server; แยก replay record สำหรับ monetary authorization ตาม D09 และ consume ใน transaction เดียวกับ debit/sale
unique authorization consumption ต้องกันการใช้ QR payment ชุดเดิมกับ intent/key ใหม่ด้วย ไม่เพียง unique sale ต่อ intent; admission state ใช้อีก scope จึงไม่เสียเพราะ QR เคยจ่ายสินค้าแล้ว
การกดจ่ายใหม่หลัง network timeout ไม่ทำ payment/ledger ซ้ำ แม้ client ไม่รู้ว่า request แรก commit แล้ว
QR freshness และ idempotency เป็นคนละเรื่อง; ไม่เก็บ QR ดิบใน fingerprint/log และไม่ใช้ QR อายุ 30 วินาทีเป็น transaction ID
กำหนด retention/replay window ใน D14 โดยไม่ลบ business uniqueness ที่ยังจำเป็นต่อการกันรายการซ้ำ

## 10. Authentication และ authorization

1. ตรวจ session/token ด้วยวิธีที่ provider รับรองและ SDK เวอร์ชันที่ติดตั้ง ไม่เชื่อ cookie/body หรือ JWT ที่แค่ decode
2. map verified identity เป็น app user และตรวจ `status = active`
3. โหลด resource ที่จะทำงานด้วย event/store/owner scope ที่พิสูจน์ได้
4. ประเมิน scoped roles + individual permission และ operation-specific invariants
5. ตรวจซ้ำภายใน transaction เมื่อ role/status/resource อาจเปลี่ยนระหว่างทำงาน

ถ้า D00 เลือก Supabase ให้ตรวจ server-side session/cookie และ caching ตาม [Supabase: SSR Client](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
ห้ามใช้ user-editable metadata เป็นแหล่ง role/permission; การเป็น Vendor ไม่ให้สิทธิ์เติมหรือคืน Token
DESIGN ที่รอ D11: deny ที่ตรง scope ชนะ role grant, default deny, global superadmin มีขอบเขต bypass ที่กำหนดและ audit ได้
การมี `permission.manage` ไม่ควรอนุญาตยกระดับตนหรือมอบสิทธิ์เกินอำนาจผู้มอบ; กำหนดกฎนี้และ last-admin guard ให้ชัด
Store owner/staff ต้องมี membership ร้านนั้นจริง ไม่อนุมานจาก event vendor role เพียงอย่างเดียว
Membership removal และ last owner/admin ต้อง lock scope ที่ตรวจและบันทึก audit; ไม่ลบแล้วค่อยพบ FK error โดยไม่มี workflow
Cookie-based mutation ต้องป้องกัน CSRF/origin ตาม auth design; endpoint อ่านข้อมูลส่วนตัวไม่ใช้ shared public cache

## 11. Database grants, Data API และ RLS

TypeORM ต่อ DB ด้วย PostgreSQL role ของ connection; JWT ผู้ใช้ใน browser ไม่ถูกส่งเป็น `auth.uid()` ให้อัตโนมัติ
service-role/owner/bypass role อาจข้าม RLS ได้ จึงห้ามถือว่าเปิด RLS แล้ว server query ทุกตัวปลอดภัยทันที
เลือกให้ชัดว่าจะให้ business data เข้าผ่าน Route Handlers เท่านั้น หรือเปิด Data API บางส่วน พร้อมตรวจสิทธิ์ทั้งสองทาง
แนวทางที่เสนอคือ server เป็น write boundary สำหรับธุรกรรม และปิดสิทธิ์ Data API ที่ไม่ได้ตั้งใจเปิด

Supabase ใช้ grants ควบคู่ RLS สำหรับ Data API; ตรวจ project default/exposed schemas ที่มีจริง ไม่เดาตาม project อายุอื่น
คุม table/view/function/sequence ที่ expose และ default privileges สำหรับ object ใหม่ด้วย
RLS ต้องระบุ owner/event/store ของ operation จริง รวม `WITH CHECK` สำหรับการเขียน ไม่ใช้ policy `USING (true)` กว้าง ๆ เพื่อแก้ 403
ถ้าจะให้ ORM อาศัย RLS ต้องออกแบบ verified context, DB role และ transaction-local settings โดยไม่ให้ pooled connection รั่วบริบทข้าม request
ไม่ตั้ง session identity ที่ client ส่งมาเอง และทดสอบทั้ง query ผ่าน API กับ DB role ที่ runtime ใช้จริง
รายละเอียด provider: [Supabase: Securing Your API](https://supabase.com/docs/guides/api/securing-your-api)

## 12. Audit, outbox และการติดตามผล

`audit_logs` เสนอให้ append-only สำหรับ runtime: actor, event/store, action, target, result, request ID, timestamp และ diff ที่คัด field
บันทึก successful mutation ใน transaction เดียวกับธุรกิจ; failed/denied attempts ส่ง security log ที่แยกจาก transaction ที่ rollback
จำกัดผู้แก้สิทธิ์/ลบ audit และกำหนด retention ตาม D13/D14; append-only ไม่ได้หมายความว่า DB owner แก้ไม่ได้โดยเทคนิค
ไม่บันทึก password, session/access token, DB URL, QR ดิบ หรือข้อมูลส่วนตัวทั้ง request ลง log
outbox เขียนพร้อม transaction ธุรกิจ; worker มี claim/retry/attempt count และ unique job identity เพื่อไม่สร้างผลซ้ำ
mock email ใช้สถานะ `queued/simulated/failed` ตาม API contract และผลจำลอง ไม่อ้าง `delivered` หรือส่งจริงก่อน D13 ยืนยัน

เก็บ latency, error code, transaction conflict, pool saturation, duplicate requests และ reconciliation failures โดยไม่ใส่ PII ใน metric labels
เป้าหมาย 3 วินาทีต้องวัดตาม workload/percentile/network ที่ D14 ตกลง ไม่รับรองจากการรันเครื่องเดียว
รายงานแยกจำนวน buyer/attendee/ticket/admission/order และป้องกัน aggregate ซ้ำจาก joins หลายแถว
Export ใช้ scope เดียวกับ query รายงาน มี audit และป้องกัน CSV formula injection ตามเอกสาร 02

## 13. เกณฑ์ตรวจรับด้านข้อมูล

- Clean bootstrap และ upgrade fixture ผ่าน; constraint ปฏิเสธสมาชิกข้าม event และร้าน open ที่ยังไม่ approved
- Permission tests ครอบคลุมผู้ใช้สองคน สองงาน สองร้าน, suspended, deny override และ privilege escalation
- Concurrent payment/scan/sale/refund ไม่ออกตั๋ว เครดิต ตัด stock หรือคืนยอดซ้ำ และไม่มียอดติดลบ
- Error/timeout ระหว่างทุกขั้นทำให้ rollback ครบ หรือ recovery คืนผลเดิมที่พิสูจน์ได้
- Ledger/source allocations/available/held กระทบยอดตรงกัน และเปลี่ยนเรทใหม่ไม่แก้ประวัติเดิม
- ทดสอบ unauthenticated/ordinary user ผ่าน Data API แล้วไม่อ่านหรือแก้ข้อมูลที่ปิดไว้
- Auth deletion/suspension ไม่ลบหลักฐานการเงินโดย cascade เงียบ ๆ; backup/restore ตรวจตาม D14

เอกสาร provider ทั้งสี่ลิงก์ตรวจเมื่อ 2026-10-25 เป็นข้อมูลอ้างอิงด้าน platform; กฎธุรกิจและโครงสร้างใหม่ข้างต้นเป็น DESIGN ของ TUATUA
ลำดับลงมือทำและ gates อยู่ใน [05-implementation-plan.md](05-implementation-plan.md)
