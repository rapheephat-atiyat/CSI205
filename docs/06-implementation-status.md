# 06: สถานะ implementation และผลตรวจ

> สถานะล่าสุด 2 พ.ย. 2569: ผู้ใช้ให้เอา API ที่ AI เขียนออกจาก YIERSANSIR เพื่อฝึกเขียนเองแล้ว เอกสารนี้เป็นแนวทาง/ประวัติของฉบับเต็มใน C:\Users\raphe\Desktop\YIERSANSIR-server-auth ไม่ใช่รายการ endpoint ที่เปิดอยู่ในโฟลเดอร์ฝึก ดู [ER และ schema ปัจจุบัน](10-database-er-diagram.md)


อัปเดต: 25 ตุลาคม 2569 (2026-10-25) บน branch `feature/supabase-db-setup` ต่อจาก commit `bc3cbc0`
สถานะ Git: **ยังไม่ commit / ยังไม่ push / ยังไม่เปิด PR / ยังไม่ deploy** ตามคำสั่งผู้ใช้
ฐานข้อมูล Supabase จริง: **ไม่ได้รัน migration และไม่ได้เขียนข้อมูล** (ดูหัวข้อ 6)

อ่านคู่กับ [01 สถานะเดิม](01-current-state.md) ซึ่งเป็น snapshot ก่อน implement, [02 Requirements](02-requirements.md), [03 API](03-api-contract.md), [04 ฐานข้อมูล](04-database-and-security.md) และ [05 แผน](05-implementation-plan.md)

## 1. Decision ที่ใช้ในรอบนี้

ผู้ใช้สั่ง “ทำทุก Phase ใช้ค่า DESIGN” และตอบคำถามเพิ่ม 3 ข้อในวันที่ 2026-10-25

| ID | สถานะ | ค่าที่ implement |
| --- | --- | --- |
| D00 | **ผู้ใช้ยืนยัน** | Supabase Auth; เพิ่ม `users.auth_user_id` (unique) แยกจาก `users.id`; `payload` เปลี่ยนเป็น nullable โดยไม่แตะค่าเดิมและไม่ใช้ยืนยันตัวตน |
| D04 | **ผู้ใช้ยืนยัน** | ผู้จัดงาน (event admin ที่มี `store.manage` หรือ superadmin) สร้างร้านเท่านั้น ร้านเริ่ม `pending/closed` |
| D11 | **ผู้ใช้ยืนยัน** | superadmin เป็น global อย่างเดียว; admin/staff/vendor มีผลเฉพาะงานผ่าน `user_event_roles`; deny ชนะ role grant และ allow; default deny; superadmin คนแรกสร้างด้วย CLI |
| D01 | ค่า DESIGN | attendee แยกจาก buyer; `tickets.holder_user_id` เริ่มเป็นผู้ซื้อ และผู้ซื้อออกรหัส claim (ใช้ครั้งเดียว อายุ 7 วัน) ให้ผู้เข้าร่วมผูกบัตรเข้าบัญชีตนเอง |
| D02 | ค่า DESIGN | กระเป๋าหนึ่งใบต่อบัตร (ต่อผู้เข้าร่วม) ในงาน; Token แถมเข้ากระเป๋าบัตรใบนั้น ไม่รวมเข้าผู้ซื้อ |
| D03 | ค่า DESIGN | ร้านมีสินค้าได้หลายรายการ; sale มีหลายรายการผ่าน `sale_items` |
| D05 | ค่า DESIGN | Staff/Admin ที่มี `token.topup` เติมให้แบบ manual/mock เท่านั้น ยังไม่มี flow ผู้ใช้ขอเติมเอง |
| D06 | ค่า DESIGN | รับเสื้อหน้างาน บันทึก `order_items.fulfilled_at` แยกจาก admission ไม่เก็บที่อยู่ |
| D07 | ค่า DESIGN | ขอคืนได้ถึง `events.ends_at + refund_window_days` (ค่าเริ่มต้น 7 วัน, เวลาแบบ absolute UTC); คืนได้เฉพาะ Token ที่เติม; ใช้ Token แถมก่อนเมื่อจ่าย; เรท Token ล็อกเมื่อมีรายการ ledger แล้ว |
| D08 | ค่า DESIGN | กันยอดตอนขอคืน (`held_units`); reject ปล่อยคืน, approve แล้ว completion ตัดยอดที่กัน |
| D09 | ค่า DESIGN | QR อายุ 45 วินาที หมุนทุก 30 วินาที เผื่อ clock skew 5 วินาที; admission ใช้ inside/outside และเข้าใหม่ได้หลังออก; QR หนึ่งใบใช้จ่ายได้ครั้งเดียว (nonce unique) แยกจาก admission |
| D10 | ค่า DESIGN | ชำระ/เติม/คืนเป็น mock ทั้งหมด (`settlement_mode = mock`) |
| D12 | ค่า DESIGN | เงินเป็นสตางค์ integer, Token เป็นหน่วย integer, เรทเป็นสตางค์ต่อ Token; กันบัตร/เสื้อ 15 นาทีระหว่างรอชำระ; ช่วงขายจาก `event_settings` |
| D13 | ค่า DESIGN | อีเมลจำลองผ่าน `email_outbox` สถานะ `queued/simulated/failed`; consent versioned ที่ server (`privacy_policy`, `terms_of_service` เวอร์ชัน `2026-10-25`) |
| D14 | **ยัง OPEN** | ไม่ได้กำหนดโหลด/uptime/retention/backup และยังไม่ได้วัด latency 3 วินาที |

ค่า DESIGN เปลี่ยนได้เมื่อผู้ใช้ยืนยันคำตอบจริง ห้ามอ้างว่าเป็น REQ ที่ยืนยันแล้ว

## 2. ฐานข้อมูลและ migration

| ไฟล์ | หน้าที่ |
| --- | --- |
| `1792597114487-BaselineEnums` | สร้าง enum 5 ชนิดที่ InitialFoundation อ้างแต่ไม่สร้าง แบบ create-if-missing; timestamp ก่อน InitialFoundation จึงทำให้ DB ว่าง bootstrap ได้ และเป็น no-op บน DB ที่มี enum อยู่แล้ว (TypeORM 1.1.2 รัน migration ที่ timestamp เก่ากว่าได้) |
| `1792597114488-InitialFoundation` | ไม่แก้ไฟล์เดิม |
| `1792923249607-DomainSchema` | ตารางใหม่ 22 ตาราง + คอลัมน์ identity/profile ของ `users` (generate จาก entity แล้วแก้ CREATE/DROP TYPE ที่ซ้ำของ enum ที่ใช้ร่วมกัน) |
| `1792923249608-AppendOnlyAndDataApiLockdown` | trigger กัน UPDATE/DELETE บน `wallet_ledger`, `audit_logs`, `admission_scans`, `user_consents`; เปิด RLS ทุกตาราง (ไม่มี policy) และ revoke สิทธิ์ `anon/authenticated` ถ้ามี role เหล่านั้น |

ตารางใหม่: `user_consents`, `event_settings`, `ticket_types`, `shirt_variants`, `orders`, `order_items`, `attendees`, `payments`, `tickets`, `wallets`, `wallet_ledger`, `topups`, `products`, `checkout_intents`, `sales`, `sale_items`, `admission_scans`, `refunds`, `idempotency_records`, `audit_logs`, `email_outbox`, `rate_limit_buckets`

ทุกตารางในงานผูก `event_id` ด้วย composite FK กับแม่ (`(x_id, event_id)`) จึงผูกข้อมูลข้ามงานไม่ได้ และมี check constraint กันยอดติดลบ/ราคา/จำนวนผิด

`down` ของ DomainSchema จะตั้ง `users.payload` กลับเป็น NOT NULL ซึ่งล้มเหลวโดยตั้งใจถ้ามีบัญชีที่สร้างหลัง migration นี้ ต้องมีแผนกู้คืนก่อน revert บนระบบจริง

## 3. โครงสร้างโค้ด

```text
app/api/v1/**/route.ts      Route Handlers (65 routes) บาง: auth/validation/แปลง error เท่านั้น
server/http/handler.ts      wrapper กลาง: request id, origin check, JSON/415/400/422, error envelope, no-store
server/http/supabase.ts     Supabase Auth adapter (cookie session + Bearer token) ตรวจด้วย getUser()
server/core/*               errors, validation (zod), transaction/SQL helpers, CSV, hash
server/services/*           domain services: access, users, events, catalog, stores, orders, tickets, qr,
                            admissions, wallets, sales, refunds, reports, email, idempotency, rate-limit, maintenance
server/database/scripts/    grant-superadmin.ts (bootstrap D11)
server/tests/integration/   integration tests บน PostgreSQL ที่ทิ้งได้
```

กลไกกลาง:

- **Permission**: `server/services/access.ts` อ่านสิทธิ์จาก DB ทุก request (ไม่มี cache) จึงถอนสิทธิ์แล้วมีผลทันที
- **Transaction**: `transaction()` ใช้ manager ตัวเดียว retry เฉพาะ deadlock/serialization สูงสุด 3 ครั้ง; ลำดับ lock event/store → inventory/สินค้า → intent → wallet → refund
- **Idempotency**: `Idempotency-Key` บังคับสำหรับ order, mock payment, topup, scan, sale, refund request/decision/completion; บันทึกใน transaction เดียวกับผลธุรกิจ คีย์เดิม+เนื้อหาเดิมคืนผลเดิมพร้อม `Idempotency-Replayed: true` คีย์เดิม+เนื้อหาต่างได้ 409
- **Business uniqueness**: payment succeeded หนึ่งรายการต่อ order, ticket ต่อ order item, wallet ต่อ ticket, ledger ต่อ (ชนิด, reference), sale ต่อ checkout intent, sale ต่อ QR nonce, topup reference ต่องาน
- **Rate limit**: นับใน DB (`rate_limit_buckets`) ใช้ร่วมทุก instance: auth 10/นาที/IP-hash, QR 60/นาที/ผู้ใช้, รายการเงิน/สแกน 60/นาที/ผู้ใช้
- **CSRF/origin**: mutation ที่มี `Origin` ต่างโดเมนหรือ `Sec-Fetch-Site: cross-site` ได้ 403; body ต้องเป็น `application/json`
- **Audit**: เขียนใน transaction เดียวกับธุรกรรม; การปฏิเสธ 401/403/429 และ 5xx เขียน structured log ที่ไม่มี body/token/QR

## 4. Endpoint ที่มีแล้ว (`/api/v1`)

ตามเอกสาร 03 ทั้งหมด ยกเว้นที่ระบุในหัวข้อ 7 และเพิ่มดังนี้

| เพิ่มจาก 03 | เหตุผล |
| --- | --- |
| `GET /auth/confirm` | ยืนยันอีเมล Supabase แบบ `token_hash` |
| `POST /me/tickets/{ticketId}/claim-code`, `POST /me/ticket-claims` | flow claim ตาม D01 |
| `GET /events/{eventId}/stores/{storeId}/products` | หน้าร้านดูรายการสินค้าทั้งหมดรวมที่ปิดขาย |
| `POST /events/{eventId}/orders/{orderId}/items/{itemId}/fulfillment` | รับเสื้อหน้างาน D06 (ต้องมี `ticket.scan`) |
| `POST /admin/maintenance` | superadmin: expire order ค้าง, ลบ rate-limit bucket เก่า, จำลองส่งอีเมลใน outbox |

## 5. วิธีรันและตั้งค่า

1. คัดลอก [.env.example](../.env.example) เป็น `.env` แล้วใส่ `DATABASE`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `QR_SIGNING_SECRET` (≥ 32 bytes)
2. ตั้ง Email Template ของ Supabase ให้ลิงก์ยืนยันชี้ `/api/v1/auth/confirm?token_hash={{ .TokenHash }}&type=email`
3. ทดลอง migration บนฐานข้อมูลที่ทิ้งได้ก่อน แล้วจึง `npm run migration:show` / `migration:run` กับระบบจริงเมื่อได้รับอนุญาตและมี backup
4. ผู้ใช้ provision บัญชีผ่าน `POST /api/v1/me` แล้วผู้ดูแลระบบรัน `npm run superadmin:grant -- <username>` (CLI พิมพ์เฉพาะ hostname ของ DB)
5. เรียก `POST /api/v1/admin/maintenance` เป็นระยะ (เช่นทุก 5 นาที) เพื่อคืน stock ของ order ที่หมดอายุและประมวลผลอีเมลจำลอง

ทดสอบ integration ต้องมี PostgreSQL บน localhost (สคริปต์ปฏิเสธ host อื่น):

```bash
docker run -d --name tuatua-test-pg -e POSTGRES_USER=tuatua -e POSTGRES_PASSWORD=tuatua -e POSTGRES_DB=tuatua_test -p 127.0.0.1:54329:5432 postgres:17-alpine
```

```bash
npm run test:integration
```

## 6. ผลตรวจรอบนี้

| คำสั่ง | ผล |
| --- | --- |
| `npm install @supabase/ssr @supabase/supabase-js` | ติดตั้ง dependency ที่ขาดตาม lockfile และเพิ่ม 2 แพ็กเกจสำหรับ D00 |
| `npm run lint` (eslint app server lib) | 0 error; warning 2 รายการใน `app/layout.tsx` ที่มีอยู่เดิม |
| `tsc --noEmit` ทั้ง `tsconfig.json` และ `tsconfig.typeorm.json` | ผ่าน |
| `npm run test:db` | ผ่าน 5/5 (metadata) |
| `npm run test:integration` | ผ่าน 28/28 บน PostgreSQL 17 (Docker) รันซ้ำ 3 รอบผ่านทุกครั้ง |
| `npm run build` | ผ่าน; ทุก route `/api/v1` เป็น dynamic ไม่เชื่อม DB ตอน build |
| HTTP smoke test ด้วย `next dev` + DB ทดสอบ | public events/catalog 200, path ผิด 404, query ไม่รู้จัก 422, 415, 400 INVALID_JSON, field เกิน 422, Origin ต่างโดเมน 403, method ไม่รองรับ 405, `/me` ไม่มี Supabase env 503, `x-request-id` และ `Cache-Control: private, no-store` ถูกต้อง |

เหตุการณ์ที่ต้องรายงาน: ระหว่าง smoke test ครั้งแรก การ override `DATABASE` ผ่าน launch command ไม่มีผล ทำให้ `GET /api/v1/events` หนึ่งครั้งอ่านจากฐานข้อมูลใน `.env` (Supabase) ด้วยคำสั่ง SELECT อย่างเดียว (นับและอ่านรายการ `events` ที่ published) ไม่มีการเขียนหรือรัน migration หยุด server ทันทีแล้วรันใหม่ผ่าน `.env.development.local` ชั่วคราวที่ยืนยันจาก log ก่อนเรียก DB และลบไฟล์นั้นแล้ว

แผนที่ Test ID ในเอกสาร 05 กับไฟล์ทดสอบ:

| Test ID | ผล | หมายเหตุ |
| --- | --- | --- |
| T01, T02 | ผ่าน | `migrations.test.ts`: DB ว่าง, rerun, schema ตรง entity, fixture ระบบเดิมพร้อมข้อมูล, revert/re-apply migration ใหม่ |
| T03 | ผ่านบางส่วน | ทดสอบ map identity/ยังไม่ provision/suspended แล้ว แต่การตรวจ session กับ Supabase จริง (ไม่มี/ปลอม/หมดอายุ) ยังไม่ได้ทดสอบเพราะไม่มี Supabase project ทดสอบ |
| T04–T24 | ผ่าน | `foundation.test.ts`, `commerce.test.ts` รวม concurrency (oversell, scan สองเครื่อง, debit พร้อมกัน, อนุมัติพร้อมกัน, topup คีย์เดียวพร้อมกัน) และ failure injection ระหว่างออกบัตร |
| T25 | ไม่ได้ทำ | ต้องรอ D14; ไม่ได้วัด latency/โหลด/restore |

## 7. สิ่งที่ยังไม่ทำหรือข้อจำกัด

- ยังไม่มี UI ใด ๆ ทั้งหน้าเว็บ ฟอร์ม และหน้าสแกน งานนี้เป็น backend/API เท่านั้น
- ยังไม่ได้รัน migration บน Supabase จริง ต้องตรวจ `migration:show` และ backup ก่อน
- ยังไม่มีการถอนสมาชิกงาน (DELETE membership) ตามข้อห้ามในเอกสาร 03
- ไม่มี compensating ledger entry แบบ manual และไม่มี flow ผู้ใช้ขอเติม Token (D05)
- RLS เปิดโดยไม่มี policy: server ต่อด้วย role เจ้าของตารางซึ่งข้าม RLS ได้ ต้องตรวจว่า runtime role บน Supabase เป็นเจ้าของตาราง และแยก runtime role กับ migration role ภายหลัง
- `POST /admin/maintenance` ต้องตั้ง scheduler เอง; ถ้าไม่เรียก order ที่หมดอายุจะคืน stock เมื่อมีคนสั่งซื้อหรือชำระในงานนั้นครั้งถัดไป
- ข้อความ `message` ใน error เป็นภาษาไทย; frontend ควรแปลจาก `error.code`
