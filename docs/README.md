# TUATUA: Auth และสิทธิ์รายผู้ใช้

อัปเดต 2 พฤศจิกายน 2569 (2026-11-02) บน branch `feat/backend-mock` งานยังไม่ commit/push/PR/deploy

โฟลเดอร์ทำงานคือ `C:\Users\raphe\Desktop\YIERSANSIR` ปัจจุบันมี **6 entities และ 4 Foreign Keys** สำหรับ auth/profile และสิทธิ์ส่วนตัว ไม่มี API/Auth runtime ที่ AI เคยเขียนใน app/api หรือ server/services

## โครงสร้างปัจจุบัน

```text
User -> UserRole -> UserRolePermission
User -> Session
User -> Account
Verification (ไม่มี FK ไป User)
```

User มีหลาย Role ได้ แต่ Permission ชี้ไปที่ UserRole ของคนนั้น คนละ User แม้ชื่อ Role เหมือนกันก็มีสิทธิ์ต่างกันได้ ไม่มี role_permissions กลางที่แจกสิทธิ์ให้ทั้ง Role

- `users`, `sessions`, `accounts`, `verifications`: schema สำหรับ auth ที่ผู้ใช้กำลังพัฒนา
- `user_roles`: UNIQUE (user_id, role)
- `user_role_permissions`: UNIQUE (user_role_id, permission), FK -> user_roles.id, ON DELETE CASCADE
- `UserRole.permissions` โหลดสิทธิ์ของ assignment นั้น โดยคงกลุ่ม Role

## เริ่มอ่านและตรวจ

| เอกสาร | ใช้ทำอะไร |
| --- | --- |
| [10-database-er-diagram.md](10-database-er-diagram.md) | ER ปัจจุบัน คอลัมน์ทั้งหมด ตัวอย่าง ownership และการโหลด relation |
| [database-er.mmd](database-er.mmd) | Mermaid ปัจจุบัน 6 ตาราง / 4 FK |
| [02-requirements.md](02-requirements.md) | requirement เดิม ส่วน Role/Permission ใช้คำตอบล่าสุดตามเอกสาร 10 |
| [07-git-transfer.md](07-git-transfer.md) | ประวัติการย้ายกลับและที่สำรองงานก่อนหน้า |
| [08-better-auth.md](08-better-auth.md) | คู่มือของฉบับตัวอย่างเต็ม ไม่ใช่ runtime ของ schema ใหม่ |

```powershell
npm run test:db
```

คำสั่งนี้ไม่เชื่อม DB ส่วน `npm run test:db:integration` ใช้ฐานทดสอบแยกเท่านั้น ดูการตั้งค่าและข้อจำกัดในเอกสาร 10

ยังไม่สร้าง/รัน migration กับฐานจริง ไม่เปลี่ยน .env หรือ stash และไม่เพิ่ม API ที่ผู้ใช้ต้องการฝึกเขียนเองกลับมา โฟลเดอร์ `C:\Users\raphe\Desktop\YIERSANSIR-server-auth` ยังคงฉบับเดิมสำหรับอ้างอิง

เอกสาร 01, 03–06 และ 09 เป็น snapshot/แนวทางของ schema เก่า ไม่ใช้เป็นหลักฐานว่ามีตารางธุรกิจ 35 ตารางหรือสิทธิ์แบบกลางในโฟลเดอร์นี้ ให้ดู entities และเอกสาร 10 เป็นหลัก
