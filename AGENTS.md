<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Rules

## ก่อนเริ่มงาน

- อ่าน `package.json`, `components.json`, กฎของโฟลเดอร์ที่เกี่ยวข้อง และโค้ดเดิมก่อนแก้ไข
- ตรวจ branch และไฟล์ที่แก้ค้างไว้ด้วย `git status --short --branch`
- อ่านเอกสาร Next.js ที่มากับเวอร์ชันติดตั้ง ตามบล็อกด้านบนก่อนเขียนโค้ด Next.js
- ถ้าเอกสารในเครื่องไม่มี ให้ตรวจเวอร์ชันในโปรเจกต์และใช้เอกสารทางการที่ตรงเวอร์ชัน ห้ามเดา API
- ทำงานเฉพาะขอบเขตที่ได้รับมอบหมาย และรักษางานที่ผู้ใช้แก้ค้างไว้

## Branch และ Workflow

- `main` สำหรับ production เท่านั้น ห้ามพัฒนา commit หรือ push โดยตรง
- `dev` สำหรับรวมงานและทดสอบ ห้ามพัฒนา commit หรือ push โดยตรง
- ทุกงานต้องแยก branch จาก `dev` แล้วส่ง Pull Request กลับเข้า `dev`
- ใช้ `feature/<name>`, `fix/<name>`, `refactor/<name>`, `docs/<name>` หรือ `chore/<name>` ตามงาน
- ชื่อ branch ใช้ภาษาอังกฤษตัวพิมพ์เล็กและ kebab-case เช่น `feature/login-page`
- ถ้าอยู่บน branch ของงานนี้แล้ว ให้ทำต่อใน branch เดิม
- ถ้าอยู่บน `main` หรือ `dev` ให้สร้าง branch สำหรับงานก่อนเริ่มแก้ไฟล์
- เมื่อ working tree สะอาด ให้อัปเดต `dev` ด้วย `git pull --ff-only origin dev` ก่อนแยกงานใหม่
- ถ้า pull ไม่ผ่าน ให้ตรวจสาเหตุ ห้ามใช้ reset หรือ force เพื่อข้ามปัญหา
- ถ้ามีงานค้างที่ทำให้ย้าย branch ไม่ปลอดภัย ให้รักษางานไว้และแจ้งผู้ใช้ ห้ามทิ้งงานหรือ stash อัตโนมัติ

เส้นทางการรวมงาน:
`feature/* หรือ fix/* → PR เข้า dev → ทดสอบ → PR จาก dev เข้า main → production`

## ความปลอดภัยในการใช้ Git

- ห้าม force push, ลบ `main`/`dev`, rewrite ประวัติที่เผยแพร่แล้ว หรือใช้ `git reset --hard`
- ห้ามใช้คำสั่งล้างไฟล์ เช่น `git clean -fd` เพื่อแก้ปัญหาโดยพลการ
- ห้ามเขียนทับ ย้อนกลับ หรือรวมงานที่ไม่เกี่ยวข้องกับงานปัจจุบัน
- ตรวจ diff ก่อน commit และ stage เฉพาะไฟล์หรือส่วนของไฟล์ที่เกี่ยวข้อง
- Commit, push, เปิด/merge PR และ deploy เมื่อผู้ใช้มอบหมายหรือมี workflow ที่อนุญาตชัดเจนเท่านั้น
- ห้าม commit รหัสผ่าน token API key ไฟล์ `.env` ที่มีค่าจริง `node_modules` หรือ build output
- อนุญาต `.env.example` ที่มีแต่ชื่อและค่าตัวอย่าง โดยต้องไม่มีความลับ

## Commit Convention

ใช้รูปแบบ `type(scope): description` โดยละ scope ได้ถ้าไม่จำเป็น

- `feat`: เพิ่มความสามารถหรือ UI ใหม่
- `fix`: แก้พฤติกรรมหรือ UI ที่ผิด
- `refactor`: ปรับโครงสร้างโดยไม่เปลี่ยนพฤติกรรม
- `style`: ปรับรูปแบบโค้ดเท่านั้น เช่น formatting ไม่ใช้แทนงานเปลี่ยนหน้าตา UI
- `docs`: แก้เอกสาร
- `test`: เพิ่มหรือแก้การทดสอบ
- `chore`: งานตั้งค่า เครื่องมือ หรือ dependencies
- `build` / `ci`: แก้ระบบ build หรือ workflow อัตโนมัติ

ข้อความอธิบายใช้ภาษาไทยหรืออังกฤษได้ ต้องบอกสิ่งที่เปลี่ยนจริง
หนึ่ง commit ควรมีวัตถุประสงค์เดียว ห้ามใช้ข้อความกว้าง ๆ เช่น `update`, `test` หรือ `แก้แล้ว`
ถ้าเปลี่ยนแบบ breaking change ให้ใช้ `!` และอธิบายผลกระทบใน commit body

ตัวอย่าง:
- `feat(auth): เพิ่มหน้าเข้าสู่ระบบ`
- `fix(navbar): แก้เมนูบนมือถือกดไม่ได้`
- `docs: เพิ่มขั้นตอนติดตั้งโปรเจกต์`

## การเขียนโค้ด

- ใช้ TypeScript และกำหนด type ให้ข้อมูลที่รับส่ง หลีกเลี่ยง `any` และการปิดกฎตรวจสอบเพื่อซ่อนปัญหา
- ทำตามโครงสร้าง การตั้งชื่อ และ formatter/linter ที่มีอยู่ในโปรเจกต์
- ชื่อ React component ใช้ PascalCase ส่วนตัวแปรและฟังก์ชันใช้ camelCase
- รักษาชื่อไฟล์พิเศษตาม Next.js เช่น `page.tsx`, `layout.tsx` และ `route.ts`
- ใช้ Server Component ตามค่าเริ่มต้น เพิ่ม `"use client"` เฉพาะส่วนที่ต้องใช้ state, event หรือ browser API
- ใช้ component และ utility เดิมก่อนสร้างใหม่ แยกส่วนเมื่อช่วยลดความซ้ำหรือทำให้โค้ดเข้าใจง่ายขึ้น
- เพิ่ม dependency เฉพาะเมื่อจำเป็น พร้อมระบุเหตุผล และใช้ package manager ตาม lockfile เดิม
- ห้ามสร้าง lockfile ของ package manager อื่นเพิ่มหรือแก้ generated output โดยตรง
- ลบ import ที่ไม่ใช้และ debug log ของงานนี้ก่อนส่งงาน
- แยกความลับและโค้ดฝั่ง server ออกจาก client ห้ามใส่ความลับในตัวแปร `NEXT_PUBLIC_*`

## UI และ Design Rules

- เว็บใช้แบรนด์แดง–ขาว โดยมีสีเทาเข้มสำหรับข้อความและสีกลางสำหรับเส้นขอบ
- เก็บค่าเริ่มต้นของธีม shadcn/ui ไว้ ห้ามเปลี่ยน token เดิมเพื่อใส่สีแบรนด์ทั้งระบบ
- เพิ่มสีแบรนด์แยกเป็น token เช่น `brand`, `brand-hover`, `brand-soft` และ `on-brand`
- ใช้คลาสจาก token เช่น `bg-brand text-on-brand hover:bg-brand-hover` แทนการใส่รหัสสีซ้ำใน component
- ใช้สีแดงกับปุ่มหลักและจุดเน้น ไม่ใช้สีแดงกับข้อความทุกส่วน
- ใช้ฟอนต์ที่กำหนดใน layout และ token กลาง ไม่กำหนดฟอนต์ซ้ำเป็นราย component โดยไม่มีเหตุผล
- ใช้ shadcn/ui component ที่มีอยู่ และตรวจ `components.json` กับ implementation จริงก่อนเลือก API
- ใช้เอกสารและตัวอย่างให้ตรงกับฐานที่ติดตั้ง: Radix UI, Base UI หรือ React Aria
- ห้ามสลับฐาน component เปลี่ยน preset หรือรันคำสั่ง overwrite component เดิมนอกขอบเขตงาน
- ถ้าต้องใช้รูปแบบแบรนด์ซ้ำ ให้เพิ่ม variant หรือ wrapper ที่ชัดเจน โดยรักษา default เดิม
- ออกแบบให้ใช้ได้ทั้งมือถือและเดสก์ท็อป พร้อม label, focus ที่เห็นชัด และการใช้งานด้วยคีย์บอร์ด
- อย่าใช้สีอย่างเดียวสื่อสถานะ และต้องจัดการ loading, error และ empty state เมื่อเกี่ยวข้อง

## การตรวจสอบก่อนส่งงาน

- ตรวจ scripts ใน `package.json` ก่อนเลือกคำสั่ง ห้ามสมมติว่ามี lint/test/typecheck script
- รัน build และ checks ที่โปรเจกต์กำหนดตามผลกระทบของงาน
- ถ้ามีการเปลี่ยนพฤติกรรมหรือแก้บั๊ก ให้เพิ่มหรือปรับ test ที่ตรวจผลลัพธ์จริงเมื่อเหมาะสม
- งาน UI ให้ตรวจหน้าจอมือถือและเดสก์ท็อป รวมถึงสถานะที่เกี่ยวข้อง
- ตรวจ diff และ conflict markers ก่อนส่งงาน
- หากรัน check ไม่ได้หรือไม่ผ่าน ให้รายงานสาเหตุ ห้ามอ้างว่าผ่านหรือลดการตรวจสอบเพื่อให้ผ่าน

## Pull Request และ Production

- PR ของงานย่อยเข้า `dev` ต้องระบุสิ่งที่เปลี่ยน เหตุผล และวิธีตรวจสอบ
- แนบภาพก่อนและหลังเมื่อมีการเปลี่ยน UI และสามารถเก็บภาพได้
- รวมงานย่อยเข้า `dev` ด้วย Squash merge โดยใช้ข้อความตาม Commit Convention
- ปล่อย production ผ่าน PR จาก `dev` เข้า `main` หลัง checks ที่กำหนดผ่านแล้ว
- PR จาก `dev` เข้า `main` ใช้ Merge commit เพื่อรักษาประวัติร่วมกัน
- ลบ branch ของงานย่อยหลัง merge สำเร็จ ไม่ลบ `dev`
- Deploy production จาก `main` เท่านั้น ส่วน branch อื่นใช้ preview หรือ staging
- ไฟล์นี้เป็นแนวทางสำหรับผู้พัฒนาและ AI; การบังคับ PR และห้าม push ตรงต้องตั้ง GitHub ruleset/protection เพิ่ม

## การรายงานผลงาน

- สรุปว่าเปลี่ยนอะไรและตรวจสอบอย่างไร
- ระบุชื่อ branch ที่ทำงาน และข้อจำกัดหรือสิ่งที่ยังไม่เสร็จ
- แจ้งตามจริงว่า commit, push, PR หรือ deploy ไปแล้วหรือยัง

