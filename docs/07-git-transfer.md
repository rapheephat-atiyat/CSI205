# ย้ายเฉพาะ server/API จากงานเก่ามาบน dev ล่าสุด

วันที่ตรวจ: 2 พฤศจิกายน 2569 (2026-11-02)

## สถานะปัจจุบันหลังรวมกลับโฟลเดอร์เดิม

ครั้งแรกนำ source ที่ตรวจ checksum แล้วครบ 162 ไฟล์กลับมาไว้ที่ `C:\Users\raphe\Desktop\YIERSANSIR` บน branch `feature/server-better-auth` จากนั้นผู้ใช้ให้เอา API ออกเพื่อฝึกเขียนเอง จึงนำโค้ด route/service/Auth/client/ชุดทดสอบ API รวม 101 ไฟล์ออกจากโฟลเดอร์ฝึก โดยคง schema และ UI ไว้ ไม่มีไฟล์ stage และไม่ได้ commit/push/PR/deploy

โฟลเดอร์ `C:\Users\raphe\Desktop\YIERSANSIR-server-auth` **ยังอยู่ครบ ไม่ได้ลบ** ตามที่ผู้ใช้ให้เก็บไว้เป็นแนวทาง และไม่ได้ผูก branch เดียวกับโฟลเดอร์ฝึก จึงไม่ขัดขวางการทำงานใน branch ปัจจุบัน

ไฟล์ API ที่นำออกเก็บซ้ำไว้ใน `removed-api-for-practice/files` ภายใต้ backup ด้านล่าง พร้อม manifest/checksums โดยไม่ได้เอาออกจากโฟลเดอร์ตัวอย่าง

งานแก้ค้างบน `feature/supabase-db-setup` ก่อนย้ายเก็บสำรองไว้ที่:

```text
C:\Users\raphe\Documents\tuatua-backups\2026-11-02-consolidate-8cb82864
```

`original-working-tree/files` เก็บไฟล์ก่อนย้าย พร้อม `changes.patch`, `git-status.txt`, `manifest.json` ส่วน `better-auth-working-tree/files` เก็บ source Better Auth ก่อนนำกลับ ไม่จำเป็นต้อง apply backup เหล่านี้กับงานปัจจุบัน เก็บไว้สำหรับอ้างอิงหรือกู้คืน

`.env` ของโฟลเดอร์เดิมไม่เปลี่ยน และ stash `supabase-work` ยังเป็นรายการเดิม ไม่ได้ pop/apply/drop หรือสร้าง stash เพิ่ม `feature/supabase-db-setup` ยังชี้ commit เดิมด้วย

ทำงานต่อจาก:

```powershell
cd C:\Users\raphe\Desktop\YIERSANSIR
git status --short --branch
```

## บันทึกการแยก worktree ก่อนรวมกลับ

- ก่อนย้าย ต้นฉบับ `C:\Users\raphe\Desktop\YIERSANSIR` อยู่ branch `feature/supabase-db-setup` และมีไฟล์แก้ค้างกับ `stash@{0}: supabase-work`
- `git fetch origin` แล้วสร้าง worktree `C:\Users\raphe\Desktop\YIERSANSIR-server-auth` บน branch `feature/server-better-auth` จาก `origin/dev` commit `93923c3`
- นำ `server/`, `app/api/`, `docs/`, `lib/permissions.ts`, `tsconfig.typeorm.json`, `.env.example` มาจาก **working tree ที่มีงานอยู่แล้ว** ไม่ได้ pop/apply/drop stash
- ใช้ `package.json` และ lockfile ของ dev เป็นฐาน เพิ่มเฉพาะ dependencies/scripts ของ server และ Better Auth ด้วย npm
- รักษา script `preview`, `deploy`, `upload`, `cf-typegen` และ dependency เดิมทั้งหมดของ dev; ตรวจด้วยสคริปต์เทียบค่าแล้ว ไม่มี version ของ package เดิมใน lockfile เปลี่ยน
- `wrangler.jsonc`, `open-next.config.ts`, UI ใน `app/` และ `components/` คงตาม dev; ไม่คัดลอก `.open-next`, `.wrangler`, `node_modules`, `.next`, `.env` จากงานเก่า
- `next.config.ts` คงค่าของ dev แล้วเพิ่มเพียง `experimental.serverMinification: false` เพราะ TypeORM ใช้ชื่อ class ตรวจ dependency และชื่อที่ถูกย่อซ้ำกันทำให้ production API ใช้ไม่ได้
- `tsconfig.json` เพิ่ม legacy decorator options สำหรับ TypeORM และ `.gitignore` ยกเว้น `.env.example` เท่านั้น
- ยังไม่ stage, commit, push, เปิด PR หรือ deploy; ไม่ได้แตะฐานข้อมูล Supabase จริง

worktree แยกใช้สำหรับจัดเตรียมงานในรอบแรกเท่านั้น ปัจจุบัน source อยู่ในโฟลเดอร์เดิมตามส่วนสถานะด้านบนแล้ว การนำกลับครั้งนี้ตรวจและคัดลอกไฟล์โดยไม่ commit เพราะไฟล์ที่ยังไม่ commit ไม่ได้ย้ายตามการ checkout branch

## หลักที่ใช้กับ stash ครั้งต่อไป

`git stash pop` พยายามนำ diff ทั้งชุดกลับมา รวมถึง package/config เก่า จึงเกิด conflict หรือคืนการเปลี่ยนแปลงที่ไม่ต้องการได้ ใช้ worktree ใหม่และเลือก path จาก snapshot แทน ถ้าทำตามตัวอย่างด้านล่าง ไม่ต้องทำซ้ำกับงานที่ย้ายให้แล้ว

```powershell
git fetch origin
git stash list
git stash show --name-status --include-untracked 'stash@{0}'
git worktree add -b feature/server-only ..\YIERSANSIR-server-only origin/dev
cd ..\YIERSANSIR-server-only

# ดึงเฉพาะ tracked files ใน server; ไม่เลือก package/config ทั้งไฟล์
git restore --source='stash@{0}' --worktree -- server lib/permissions.ts tsconfig.typeorm.json
```

ตรวจชื่อ path ใน stash ก่อนรันจริง ถ้า stash เก็บ untracked files ด้วย `-u` จะมี snapshot `stash@{0}^3` ให้เลือก **รายชื่อไฟล์ที่อยู่ใน snapshot นั้นจริง**:

```powershell
$savedFiles = @(git ls-tree -r --name-only 'stash@{0}^3' -- server app/api docs .env.example)
if ($savedFiles.Count -gt 0) {
    git restore --source='stash@{0}^3' --worktree -- $savedFiles
}
```

อย่า restore ทั้งโฟลเดอร์จาก snapshot ของ untracked เพราะ tracked files ที่ไม่มีใน snapshot อาจถูกลบจาก working tree ให้เก็บ stash ไว้จนตรวจผลการย้ายครบ และไม่ restore `.env`/build output จาก stash

เพิ่ม dependencies ที่ server import จริงลงใน package ปัจจุบันแล้วให้ npm ปรับ lockfile ห้ามคัดลอก lockfile เก่าทั้งก้อน ส่วน config ให้เทียบ `git diff` แล้วเพิ่มค่าที่จำเป็น ไม่คืนไฟล์เก่าทั้งไฟล์

## ขอบเขตการรวมงาน

branch ใหม่อิง dev แต่ยังไม่ได้รวมเข้า dev ผู้ใช้เป็นคนตัดสินใจ commit/push/PR ภายหลัง ไม่มีการแก้ branch dev หรือ main โดยตรง
