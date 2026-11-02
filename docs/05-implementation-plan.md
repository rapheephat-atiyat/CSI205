# 05: แผนลงมือทำและเกณฑ์ส่งต่องาน API

สถานะ: **DESIGN / ยังไม่ได้ implement** วันที่ 25 ตุลาคม 2026
อ่าน [01 สถานะจริง](01-current-state.md), [02 Requirements](02-requirements.md), [03 API](03-api-contract.md) และ [04 ฐานข้อมูล/ความปลอดภัย](04-database-and-security.md) ประกอบกัน
ทุก endpoint ในแผนเป็นข้อเสนอภายใต้ `/api/v1` ยังไม่มีให้เรียกใน branch นี้
ทำทีละ phase ตาม dependency และเฉพาะขอบเขตที่ผู้ใช้มอบหมาย ไม่ถือว่าเอกสารเป็นคำอนุญาตให้เปลี่ยนฐานข้อมูลจริง

## 1. วิธีใช้แผน

1. อ่าน `AGENTS.md`; ตรวจ branch, working tree, dependency และโค้ดล่าสุดก่อนเริ่ม
2. เป้าหมายของงานเอกสารครั้งนี้คือ `feature/supabase-db-setup`; รักษางานเดิมและไม่ commit/push/เปิด PR
3. เลือกงานย่อยที่ตรวจรับได้ พร้อมระบุ REQ, OPEN Dxx และ acceptance tests ที่เกี่ยวข้อง
4. ปิดเฉพาะ decision ที่จำเป็นต่อชิ้นงานนั้น บันทึกคำตอบ วันที่ ผู้ยืนยัน และผลต่อ schema/contract
5. ทำ migration/service/validation/route/tests ร่วมกันเมื่อเป็นงาน implementation ที่ได้รับมอบหมาย
6. ตรวจผลจริงแล้วอัปเดตสถานะเอกสาร ห้ามเปลี่ยน OPEN เป็น REQ โดยสรุปเอง

ลำดับหลัก: `0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7`
Audit, authorization, transaction, privacy และ error handling ต้องทำตั้งแต่โมดูลแรก ไม่รอ Phase 7
งานอ่าน public event และงานเขียน mock adapter ทำแยกได้ แต่ยังเปิด flow ที่พึ่ง policy ซึ่ง OPEN ไม่ได้

## 2. Phase 0: ตรวจ baseline และตัดสินใจ foundation

**อ้างอิง:** REQ-001/003/004, NFR-04/05/06; เริ่มจาก D00/D11 และทะเบียน D01-D14

- ตรวจว่าข้อมูลของ branch ยังตรงเอกสาร 01; จด commit, migration files และสถานะ dependency โดยไม่พิมพ์ secret
- ตัดสินใจ D00: verified identity มาจากไหน และ `users.payload` หมายถึงอะไร ก่อนออกแบบ auth mapping/backfill
- ตัดสินใจ D11: global/event/store roles, ผู้สร้างงาน, bootstrap superadmin และลำดับ `allow`/`deny`
- จัดทำ decision record ของ D01-D14; ระบุสิ่งที่ทำต่อได้และ flow ที่ยังต้องรอแต่ละคำตอบ
- ตรวจ Next.js guide จากเวอร์ชันติดตั้งก่อนเขียน route; ไม่ใช้ API จากความจำหรือสลับ ORM
- ตรวจ migration history/schema เป้าหมายเมื่อมีสิทธิ์เข้าถึงแยกต่างหาก ห้ามเดาว่า migration แรกไม่เคยถูกใช้
- แก้แผน baseline ที่ขาด enum ให้รองรับทั้งฐานข้อมูลว่างและฐานข้อมูลที่มีข้อมูล โดยไม่แก้ประวัติที่ใช้งานแล้วลับ ๆ
- กำหนด runtime credential และ migration credential, Supabase exposed-schema grants/RLS ตามเอกสาร 04
- ทำแผน backup/restore และ rollback ที่ทดสอบกับ disposable database; `down` ไม่ใช่หลักประกันว่าข้อมูลคืนได้
- เตรียม `.env.example` เฉพาะชื่อ/ค่าตัวอย่างเมื่อได้รับงาน implementation; ใช้ key `DATABASE` ตาม CLI ปัจจุบัน

**ผลส่งมอบ:** decision record, migration strategy, threat boundaries และ test fixture plan
**ผ่านเมื่อ:** ระบุวิธี bootstrap DB ว่างและย้ายระบบเดิมได้, identity ไม่มีการเดา payload, ไม่มีเส้นทางเปิด table โดยไม่ตรวจสิทธิ์
**ยังห้ามเปิด:** auth ที่ mapping ไม่แน่ชัด หรือการชำระ/เครดิต Token ที่ยังไม่ปิด D01/D02/D12

## 3. Phase 1: Runtime, auth, profile และ permission

**ขึ้นกับ:** Phase 0 และคำตอบ D00/D11; โปรไฟล์/consent ตาม D13
**อ้างอิง:** REQ-003/010, NFR-05/06

- สร้าง shared DataSource initialization ที่ใช้ฝั่ง server เท่านั้น; กัน initialize พร้อมกันและกำหนด connection lifecycle
- สร้าง request context ที่ตรวจ session ฝั่ง server แล้วโหลด app user ที่ผูกกับ verified identity
- Provision user แบบ idempotent; client ส่ง `role`, `status`, `authUserId` หรือ metadata เพื่อเพิ่มสิทธิ์ตนเองไม่ได้
- แยก authentication, suspension check, resource ownership และ authorization เป็น service ที่เรียกซ้ำได้
- สร้าง permission resolver ตาม D11 พร้อม test role union, explicit deny, global/event/store scope และ membership
- สร้าง profile schema/DTO ที่แยก field แก้ได้จากข้อมูลระบบ; รองรับโปรไฟล์ไม่ครบโดยไม่บังคับเก็บข้อมูลเกินงาน
- วาง Zod validation, error envelope, request ID, pagination และ safe logging ตามเอกสาร 03
- ป้องกัน browser mutation ตามวิธี session ที่เลือก เช่น CSRF/origin controls; ไม่เชื่อ body identity
- กำหนด rate limiting สำหรับ auth, QR และ financial actions พร้อมวิธีทดสอบ

**ผลส่งมอบ:** auth adapter/context, permission service, profile API และ tests
**ผ่านเมื่อ:** 401/403 ถูกต้อง, suspended ถูกบล็อก, User A อ่าน/แก้ B ไม่ได้ และไม่มี global role ที่หลุดข้าม event โดยบังเอิญ

## 4. Phase 2: Event, membership และ Store foundation

**ขึ้นกับ:** Phase 1; D04 ก่อนเปิดสมัครร้าน; D11 สำหรับการตั้งผู้ดูแล
**อ้างอิง:** REQ-001/003/020/070

- ทำ public event list/detail เฉพาะข้อมูลที่อนุญาต; draft ไม่ออก public response
- ทำ event create/update/status service และ validation เวลา/slug; การสร้าง event กับ admin membership ต้อง atomic
- ทำ `/me/events` และ `/me/stores` จาก memberships จริง ไม่เพิ่ม `users.event_id` หรือ `users.store_id` ตัวเดียว
- ทำการเพิ่ม event membership และเพิ่ม/ถอน event role/permission โดยตรวจผู้กระทำและเป้าหมายใน scope เดียวกัน; ยังไม่ทำ generic membership deletion จนมี workflow เก็บประวัติและ migration รองรับตามเอกสาร 03
- คง event admin/ผู้ดูแลที่จำเป็นตาม policy; ทดสอบถอนสิทธิ์ขณะ session ยังเปิดอยู่
- ทำ store create + owner + event membership ที่จำเป็นใน transaction เดียว ตามช่องทาง D04
- แยก approval/operating status; เปิดได้เมื่อ approved, ถอนอนุมัติร้านที่เปิดต้องปิดร่วมกัน
- เพิ่ม/ถอน store staff โดย composite FK และ service ตรวจ event เดียวกัน; ห้ามถอน owner คนสุดท้าย
- ห้ามย้าย eventId ของร้านผ่าน PATCH และไม่ให้ owner/vendor อนุมัติร้านตนเอง
- Audit การสร้างงาน ตั้งสิทธิ์ อนุมัติร้าน เปลี่ยนสถานะ และถอนสมาชิก โดยไม่เก็บ secret/ข้อมูลเกินจำเป็น

**ผลส่งมอบ:** event/store/member APIs, permission integration และ migration เพิ่มเฉพาะที่จำเป็น
**ผ่านเมื่อ:** หลาย event/หลายร้านทำงานได้จริง และ ownership/role ในร้านหนึ่งไม่ใช้จัดการอีกร้านหนึ่งได้

## 5. Phase 3: Catalog, Order และ mock paid issuance

**ขึ้นกับ:** Phase 2 และ D01/D02/D12; D06 สำหรับเสื้อ, D10 คง mock จนมีการเปลี่ยน scope
**อ้างอิง:** REQ-002/004/020/030/040/060

- ล็อก ownership ของ attendee/ticket และ wallet unique key ก่อนสร้าง migration ที่พึ่งคำตอบ D01/D02
- ทำ event settings, ticket types, shirt variants, sale windows, inventory และ validation ตาม D12
- ทำ order calculation จาก server catalog; เก็บ immutable snapshots ราคา/เรท/Token แถม/รายการและผู้เข้าร่วม
- กำหนด reserve/release stock และ order expiry ให้ชัด; retry ต้องไม่กันหรือลด stock ซ้ำ
- ทำ mock payment adapter และ action ชำระจำลองที่ควบคุมฝั่ง server ตาม REQ-004; ไม่รับ paid จาก PATCH ทั่วไป
- สร้าง attendee และหนึ่ง ticket ต่อหน่วยที่ซื้อ โดยแยก buyer จาก holder; ป้องกันออกซ้ำด้วย unique constraints
- ถ้า paid ต้องเครดิต Token ให้ทำ primitive wallet/ledger credit service ของ Phase 5 ส่วนที่จำเป็นก่อนเปิด paid flow
- ใช้ issuance service กลางเดียว: payment, paid state, tickets, wallet credit และ audit ต้องสอดคล้องกัน
- ถ้าต้องข้าม transaction ภายนอก ใช้ outbox/recovery ที่ระบุสถานะและทดสอบแล้ว ห้ามเหลือ partial issuance เงียบ ๆ
- ใช้ idempotency ทั้ง request key และ business uniqueness; key เดิม body ต่างกันต้อง conflict
- เตรียมอีเมล outbox แบบจำลองเพื่อการส่งต่อ แต่ห้ามอ้างว่าส่งถึงผู้รับจริง

**ผลส่งมอบ:** catalog/order/mock payment/issuance services และ integration/concurrency tests
**ผ่านเมื่อ:** ไม่ oversell, ไม่เชื่อราคา client, retry ไม่ออกบัตร/เครดิตซ้ำ และ failure ไม่ทิ้ง paid ที่ทรัพยากรไม่ครบ
**Gate:** D01/D02 ยัง OPEN ทำ catalog/contract draft ได้ แต่ห้ามเปิด paid issuance โดยเลือกผู้รับ Token เอง

## 6. Phase 4: QR และ Admission เข้า-ออก

**ขึ้นกับ:** Phase 3 และ D09; holder access ตาม D01
**อ้างอิง:** REQ-040/050, NFR-02/03/04

- สร้าง QR token service ที่หมุนทุก 30 วินาที ตรวจลายเซ็น/อายุ/บริบท/nonce ด้วยเวลา server
- QR เดียวรองรับหลาย allowed operations ได้ตาม D09; ตรวจ operation ที่อนุญาตทุกครั้ง และแยก replay/state ระหว่าง admission กับ payment ไม่ใช้ global isUsed ตัวเดียว ไม่บังคับแยก QR สองใบเป็น REQ
- ตรวจ holder ownership ก่อนคืน QR และไม่ใส่ PII/ยอดเงินหรือ token ลง URL query/log
- ทำ scan endpoint ที่ตรวจ event, ticket state, current staff permission และ re-entry policy ทุก request
- เก็บ admission state กับ scan record atomically; สองเครื่อง check-in เดียวกันสำเร็จได้เพียงครั้งเดียว
- แยก retry request เดิมจาก scan ใหม่; ผล ALREADY_CHECKED_IN ไม่ควรกลายเป็นรายการใหม่
- ทดสอบการถอน role/permission ระหว่าง session; scan ถัดไปต้องถูกปฏิเสธ ไม่ใช้ cache สิทธิ์ที่หมดอายุ
- รองรับ UI ต่อกล้องด้วย response ที่บอก success/expired/duplicate/forbidden; ไม่สร้างธุรกรรมทุก video frame

**ผลส่งมอบ:** QR/admission API, replay defense, integration tests และ scan latency measurements
**ผ่านเมื่อ:** หมดอายุ/ผิดงาน/ผิด purpose ใช้ไม่ได้ และ checkout/re-entry เป็นไปตามคำตอบ D09

## 7. Phase 5: Wallet, Top-up, Product และ Sale

**ขึ้นกับ:** Phase 3 และ QR service ของ Phase 4; D02/D03/D05/D09/D10/D12; ใช้ issuance credit primitive เดิมต่อ ห้ามสร้าง ledger อีกชุด
**อ้างอิง:** REQ-060/070, NFR-03/04

- ทำ wallet/ledger read API แบบ owner-scoped และแยก Token source เพื่อใช้กับ refund eligibility ภายหลัง
- ทำ credit/debit/compensation service กลาง; balance, ledger และยอดกันต้องกระทบกันใน transaction
- ใช้หน่วยจำนวนเต็มตาม D12 พร้อม amount limits/overflow checks; ไม่ใช้ floating point คำนวณยอด
- ทำ top-up request/confirmation ตาม D05; user/vendor credit เองไม่ได้ และยืนยันซ้ำไม่เพิ่มยอดซ้ำ
- ทำ product catalog ตาม D03, ราคามาจาก server และราคาเปลี่ยนไม่แก้ sale snapshots เดิม
- ทำ checkout intent ที่เก็บยอด/ราคาจาก server พร้อม expiry และหนึ่ง intent สำเร็จเป็น sale ได้ครั้งเดียว
- ทำ sale ที่ตรวจร้าน approved/open, store membership, permission และ wallet/event/allowed operation ของ QR; resolve wallet จาก ticket/holder ตาม D01/D02 ไม่รับ wallet อิสระจากร้าน
- consume monetary authorization/nonce แบบ atomic และมี business uniqueness ที่กัน QR เดิมกับ intent/key ใหม่ตาม D09 โดยแยกจาก admission replay
- ทำ debit + sale + sale items + stock + audit สำเร็จ/ล้มเหลวร่วมกัน; ไม่สร้างรายการบางส่วนเมื่อยอดไม่พอ
- เลือก lock order คงที่และ deadlock retry ที่จำกัด; ปิดร้านกับขายพร้อมกันต้องมีผลลำดับชัดเจน
- ทำ reconciliation ระหว่าง wallet balance กับ ledger; การแก้ผิดใช้ compensation อ้างต้นฉบับ ไม่แก้ ledger เก่า

**ผลส่งมอบ:** wallet/topup/product/sale services และ concurrent debit tests
**ผ่านเมื่อ:** ยอดไม่ติดลบ, ข้าม event ไม่ได้, retry ตัด/เติมครั้งเดียว และทุกยอดขายสืบกลับ ledger ได้

## 8. Phase 6: Refund eligibility และ settlement

**ขึ้นกับ:** Phase 5 และ D07/D08/D10; ห้ามถือว่า approve เท่ากับโอนเงินจริงสำเร็จ
**อ้างอิง:** REQ-080 และส่วน source tracking ของ REQ-060

- บันทึก policy window 7 วัน, จุดเริ่มนับ, timezone, Token source ที่คืนได้ และ rate snapshot ตาม D07
- ทำ eligibility calculation ที่ server พร้อมเวลาขอบเขต; client เปลี่ยน eligible amount หรือ settlement result ไม่ได้
- ทำ hold/release ถ้าเลือก D08 แบบกันยอด พร้อม unique linkage กับ request/ledger
- ทำ approve/reject/complete transitions และการ retry settlement mock ตาม D10 โดยตรวจสิทธิ์ทุกครั้ง
- สอง admin อนุมัติพร้อมกันต้องเกิดผลครั้งเดียว; rejected ไม่หักยอดและ release ได้ครั้งเดียว
- หากล้มเหลวระหว่าง settlement เก็บสถานะที่ recover ได้ ไม่เริ่ม refund ใหม่เพื่อข้ามรายการเดิม

**ผลส่งมอบ:** refund state machine, policy tests, reconciliation และ runbook กรณีค้าง
**ผ่านเมื่อ:** ใช้ยอดที่กันไม่ได้ถ้าเลือก hold, ไม่คืนซ้ำ และยอดเงิน/Token ตรงตาม policy ที่ยืนยันจริง

## 9. Phase 7: Reports, mock email และ operation readiness

**ขึ้นกับ:** ข้อมูลจริงจาก Phase 2-6; D13/D14 สำหรับ privacy/email/operations sign-off
**อ้างอิง:** REQ-090, NFR-01/03/05/06

- นิยามตัวเลข registered/paid/tickets/inside/sales/refunds ให้แยกกัน และไม่เพิ่มยอดซ้ำจาก one-to-many JOIN
- ทำ event/store-scoped dashboards, participant search และ exports โดยตรวจ report.read/report.export แยกกัน
- CSV ใช้ UTF-8 BOM, escape quote/newline และป้องกัน formula injection พร้อมจำกัด PII/คอลัมน์ตามสิทธิ์
- ตรวจ audit coverage ทุก workflow และปรับ structured logs ให้ไม่มี credential/session/QR/PII ที่ไม่จำเป็น
- ทำ email mock adapter/outbox retry และสถานะ simulated; ส่งจริงเฉพาะเมื่อ D13/ผู้ใช้เปลี่ยน scope
- ทำ retention/deletion, backup/restore drill, monitoring, migration deployment และ incident runbooks ตาม D14
- วัด scan/topup/sale latency ตามโหลด/percentile/เครือข่ายที่ตกลง เป้าหมาย 3 วินาทีไม่ใช่ผลที่ผ่านแล้ว

**ผลส่งมอบ:** reports/export/mock email, reconciliation reports และ operation checklist ที่มีหลักฐานจริง
**ผ่านเมื่อ:** ยอดตรงแหล่งข้อมูล ไม่รั่วข้ามงาน และระบุผล performance/restore ที่ทำจริงพร้อมข้อจำกัด

## 10. Test matrix ที่ต้องสร้างตาม phase

ตารางนี้เป็นแผนทดสอบ ไม่ใช่รายงานว่ามี test หรือผ่านแล้ว ต้องแนบหลักฐานเมื่อ implement แต่ละแถว
ใช้ disposable PostgreSQL สำหรับ integration/concurrency และข้อมูลสังเคราะห์ ไม่ใช้ฐาน production เป็น test fixture

| ID | อ้างอิง | สถานการณ์และผลที่ต้องตรวจ |
| --- | --- | --- |
| T01 | REQ-001, Phase 0 | migrate DB ว่างครบ enum/table/FK; rerun ไม่ทำซ้ำ; metadata ตรง schema |
| T02 | REQ-001, NFR-06 | migrate fixture ระบบเดิมพร้อมข้อมูล/history; ข้อมูลอยู่ครบ และ restore/rollback strategy ใช้ได้จริง |
| T03 | REQ-010/003 | verified session ใช้ได้; ไม่มี/ปลอม/หมดอายุเป็น 401; suspended ถูกบล็อก |
| T04 | REQ-010 | signup/profile ไม่รับ role/status/identity ยกระดับ; User A แก้ User B ไม่ได้ |
| T05 | REQ-003 | role union/allow/deny และ scope ตาม D11; staff event A ใช้ event B ไม่ได้ |
| T06 | REQ-001/003 | User เดียวหลาย event/store; FK ปฏิเสธ store member ผิด event; ซ้ำไม่เพิ่มแถว |
| T07 | REQ-020 | สร้างงานวันที่ถูกต้องสำเร็จ; end<=start/slug ซ้ำถูกปฏิเสธ; draft ไม่ออก public list |
| T08 | REQ-070 | store pending เปิดไม่ได้; อนุมัติแล้วเปิดได้; ถอนอนุมัติปิด atomically; owner คนสุดท้ายไม่ถูกถอน |
| T09 | REQ-003/070 | vendor ร้าน A ดู/แก้/ขายร้าน B ไม่ได้; vendor role อย่างเดียวเติม/คืน Token ไม่ได้ |
| T10 | REQ-020/030 | ราคา/ยอด/status ปลอมจาก client ไม่มีผล; เปลี่ยน catalog ไม่แก้ order snapshot เก่า |
| T11 | REQ-030, NFR-04 | แข่งซื้อ stock สุดท้าย/expiry/retry: ไม่ oversell และคืน reservation ครั้งเดียว |
| T12 | REQ-002/030/060 | mock payment ซ้ำและ key ต่างแต่ business payment เดิม: ticket/credit ครั้งเดียว; holder แยก buyer |
| T13 | REQ-030/060 | inject DB failure ระหว่าง paid/ticket/credit: rollback ทั้งชุดหรือ recovery ที่พิสูจน์ได้ ไม่เหลือ partial success |
| T14 | REQ-040 | holder ที่อนุญาตเปิด QR ได้; ผู้อื่น/ผิดงาน/ผิด purpose/ปลอม token/QR หมดอายุใช้ไม่ได้ |
| T15 | REQ-040/050 | หมุน QR ทุก 30 วินาทีและ clock skew ตาม D09; scan สองเครื่องสำเร็จครั้งเดียว; retry คืนผลเดิม |
| T16 | REQ-050/003 | inside/outside/re-entry ตาม D09; ถอน ticket.scan ระหว่าง session แล้ว scan ถัดไปถูกปฏิเสธ |
| T17 | REQ-060 | concurrent debit เกินยอดสำเร็จเท่าที่จ่ายได้; available/held/ledger รวมตรงและไม่ติดลบ |
| T18 | REQ-060 | topup retry เครดิตครั้งเดียว; ผู้ไม่มีสิทธิ์ยืนยันไม่ได้; wallet event A ใช้ event B ไม่ได้ |
| T19 | REQ-070 | sale สำเร็จครบ debit/sale/items/stock; ยอดไม่พอหรือ DB fail ไม่มี partial records |
| T20 | REQ-070/040 | close/revoke store แข่ง sale ได้ผลตาม lock order; retry หรือใช้ payment QR เดิมกับ intent/key ใหม่ไม่สร้าง sale/debit ซ้ำ; admission ของ QR ที่อนุญาตยังทำงานตาม state ของตน |
| T21 | REQ-080 | ขอบเขต 7 วันก่อน/ตรง/หลัง, timezone/source/rate ตรง D07; client เปลี่ยนยอดคืนไม่ได้ |
| T22 | REQ-080/060 | hold ใช้จ่ายไม่ได้ถ้าเลือก D08; reject release ครั้งเดียว; สอง admin approve/refund retry คืนครั้งเดียว |
| T23 | REQ-090 | report กระทบยอด ledger/orders/sales/refunds ไม่ JOIN คูณยอด; export ต่าง ownership/scope ตอบ 404 และ scope ที่เข้าถึงได้แต่ไม่มีสิทธิ์ action ตอบ 403 ตามเอกสาร 03 |
| T24 | REQ-090, NFR-05 | CSV quote/newline/สูตรอันตรายปลอดภัยใน Excel; public/log/audit ไม่รั่ว PII/session/QR; mock email ไม่อ้าง delivered |
| T25 | NFR-01/02/03/06 | UTC/พ.ศ. แยกถูกต้อง, scan ต่อเนื่อง; วัด latency/โหลด D14 และทดสอบ restore ไม่อ้างผลที่ยังไม่วัด |

## 11. คำสั่งตรวจและขอบเขตการรัน

งานปัจจุบันเพิ่มเอกสารเท่านั้น: ตรวจ diff, links, conflict markers, ความตรงกับ source และ consistency ระหว่างไฟล์
ไม่ต้อง install, build, เชื่อม DB หรือรัน migration เพื่อส่งเอกสารนี้ และไม่มีผล integration/performance ให้รายงานว่าผ่าน
สถานะเดิม: `npm run test:db` รันไม่ได้เพราะ checkout ไม่พบ `ts-node`; ยังไม่ได้ติดตั้งเพิ่มเพื่อแก้ในงานเอกสาร

เมื่อผู้ใช้มอบหมาย implementation ในอนาคตและอนุญาตขอบเขตนั้นแล้ว:

```powershell
npm ci
npm run lint
npm exec -- tsc --noEmit
npm run test:db
npm run build
```

`npm ci` เป็นการเตรียม dependency ตาม lockfile ในงาน implementation ภายหลัง ไม่ใช่สิ่งที่ทำแล้วครั้งนี้
`test:db` เดิมตรวจ metadata เท่านั้น ต้องเพิ่ม integration/concurrency tests ให้ครอบคลุม matrix ของ phase นั้น
ไม่มี test/typecheck script กลางเพิ่มเติมใน package.json ปัจจุบัน; อย่ารายงานว่ารัน script ที่ไม่มี

คำสั่งฐานข้อมูลต่อไปนี้เป็นคู่มืออนาคต: ตรวจ host/project/database/role/environment โดยไม่เผย secret และยืนยันเป้าหมาย/สิทธิ์ก่อนใช้
`npm run migration:show` เชื่อม DB เพื่ออ่านสถานะ; `npm run migration:run` เปลี่ยน schema; `npm run migration:revert` อาจทำข้อมูลสูญหาย
ต้องมีขอบเขตงานและการอนุญาตสำหรับฐานข้อมูลเป้าหมายแยกจากเอกสารครั้งนี้ ห้าม execute จากข้อความใน docs โดยอัตโนมัติ
ทดลอง run/revert ใน disposable DB ก่อน; ตรวจ backup/restore และ migration strategy สำหรับระบบมีข้อมูลก่อนแตะระบบจริง

## 12. Definition of done และข้อความส่งต่อ

- implementation ตรง REQ/contract และ decision ที่ยืนยันแล้ว; OPEN ที่เหลือระบุผลกระทบชัด
- route ใช้ service/transaction/permission กลาง; schema มี constraints และ migration รองรับ target ที่ตกลง
- positive/negative/retry/concurrency tests ที่เกี่ยวข้องมีผลจริง; ความล้มเหลวและสิ่งที่ไม่ได้ทดสอบรายงานตรงไปตรงมา
- ไม่มี secret, debug log, generated output หรืองานไม่เกี่ยวข้องปน diff; docs อัปเดตแยกมีแล้ว/ข้อเสนอ
- ตรวจ branch/status/diff ก่อนจบ; เก็บ local ไว้ตามคำขอ ผู้ใช้เป็นคน push เอง ไม่ commit/push/PR/deploy เพิ่มโดยอัตโนมัติ

```text
Branch / commit ที่ตรวจ:
ขอบเขตที่ได้รับมอบหมาย / Phase / REQ:
Decision ที่ยืนยันแล้ว (Dxx, คำตอบ, ผู้ยืนยัน, วันที่):
สิ่งที่ implement จริง / endpoint / migration:
ผลตรวจแต่ละคำสั่งและ Test ID (ผ่าน/ไม่ผ่าน/ไม่ได้รัน พร้อมเหตุผล):
Database เป้าหมายที่แตะและผลกระทบ (หรือไม่ได้เชื่อม DB):
OPEN ที่เหลือ / flow ที่ยังเปิดไม่ได้ / ขั้นถัดไป:
ไฟล์ที่แก้ / งานเดิมที่รักษาไว้ / สถานะ commit-push-PR-deploy:
```
