# Better Auth สำหรับ TUATUA

เอกสารนี้อธิบาย **ฉบับตัวอย่าง API/Auth เต็ม** ที่ `C:\Users\raphe\Desktop\YIERSANSIR-server-auth` ผู้ใช้ให้เก็บไว้เป็นแนวทาง ขณะนี้โฟลเดอร์ฝึก `YIERSANSIR` เอา route/service/Auth runtime ออกแล้ว เหลือ UI และ schema ไม่ได้ commit/push หรือรัน migration จริง

ผู้ใช้เลือก Better Auth แทน Supabase Auth โดยตรง (แทน decision D00 เดิม) ใช้ PostgreSQL เดิมของ Supabase ได้ แต่ไม่ใช้ Supabase Auth SDK, JWT หรือ browser Data API ใน flow นี้

## โครงสร้าง

```text
Browser ── HttpOnly cookie ──> /api/auth/* ──> Better Auth ──> PostgreSQL auth_*
        ── same cookie ─────> /api/v1/*  ──> getSession() ──> users.better_auth_user_id
                                                          └─> permissions / services
Kiosk   ── signed Bearer ───> /api/v1/* (ตรวจ session และการเพิกถอนแบบเดียวกัน)
```

| ไฟล์ | หน้าที่ |
| --- | --- |
| `server/auth/config.ts` | factory ของ Better Auth 1.7.15 + PostgreSQL adapter ทางการ, schema mapping, policy |
| `server/auth/index.ts` | lazy singleton, ตรวจ env, pool ของ auth แยกจาก TypeORM |
| `server/auth/email.ts` | ส่ง verification/reset ผ่าน SMTP เมื่อ endpoint ถูกเรียกจริง |
| `app/api/auth/[...all]/route.ts` | handler มาตรฐาน Next.js สำหรับ GET/POST; no-store |
| `server/http/identity.ts` | ตรวจ database session และแปลงเป็น VerifiedIdentity |
| `server/http/handler.ts` | API ธุรกิจตรวจ identity, suspended status และ role ใหม่ทุก request |
| `lib/auth-client.ts` | `authClient` สำหรับ Client Component; ใช้ origin ปัจจุบัน |
| `server/database/entities/Auth.ts` | metadata ตาราง auth เพื่อให้ TypeORM เป็นเจ้าของ migration เพียงชุดเดียว |
| `server/database/migrations/1793620333903-BetterAuthSchema.ts` | ตาราง auth 5 ตาราง + identity link + FK/unique/RLS |

Next.js ใช้ Node runtime โดยปริยาย ไม่ประกาศ `runtime` ใน route เพราะ `cacheComponents: true` ของ dev ไม่รองรับ segment option นี้

## ตารางและตัวตน

- `auth_users`: email, ชื่อ, email_verified; ไม่เก็บ role ธุรกิจ
- `auth_accounts`: credential/password hash ของ Better Auth; ห้ามคืนใน API DTO
- `auth_sessions`: token, expiry และอุปกรณ์; session token เป็นความลับ แม้จะไม่ได้เป็นรหัสผ่าน
- `auth_verifications`: verification/reset record ตาม Better Auth
- `auth_rate_limits`: ตัวนับร่วมหลาย instance; มี bigint สำหรับเวลาหน่วย milliseconds
- `users.better_auth_user_id`: UUID nullable, unique, FK ไป auth_users แบบ RESTRICT
- `users.id`: รหัสธุรกิจเดิม บัตร กระเป๋า ร้านค้า และออเดอร์ยังอ้างตัวนี้
- `users.auth_user_id`: Supabase ID เก่า เก็บค่าเดิมไว้ แต่ไม่ใช้ยืนยันตัวตนอีก
- `users.payload`: คอลัมน์ legacy ที่ยังไม่รู้ความหมาย ไม่ตีความเป็น auth ID

Better Auth จัดการการเขียนตาราง auth ส่วน TypeORM จัดการ migration ไม่เปิด `synchronize` และไม่รัน Better Auth CLI migrate ซ้อนกับ TypeORM

## ตั้งค่าและรัน

```powershell
cd C:\Users\raphe\Desktop\YIERSANSIR-server-auth
npm install
Copy-Item .env.example .env
```

หากมี `.env` ของตนอยู่แล้วให้แก้เฉพาะค่าที่ต้องเพิ่ม ไม่รัน Copy-Item ทับไฟล์นั้น ตั้งค่าตาม `.env.example`:

- `DATABASE`: PostgreSQL URL ที่เข้าถึงได้จาก server; `DATABASE_POOL_MAX` สำหรับ TypeORM และ `AUTH_DATABASE_POOL_MAX` สำหรับ Better Auth ต้องนับรวม connection ต่อ instance
- `BETTER_AUTH_SECRET`: สุ่มอย่างน้อย 32 ตัวอักษร แยกจาก QR secret; สร้างด้วยคำสั่งใน env example
- `BETTER_AUTH_URL`: canonical origin เช่น `http://localhost:3000` หรือ HTTPS ของระบบจริง; ไม่อิง Host/X-Forwarded-Host จากผู้เรียก
- `AUTH_SMTP_URL`, `AUTH_EMAIL_FROM`: SMTP account และ sender ที่ส่งได้จริง ต้อง URL-encode username/password ใน URL
- `AUTH_REQUIRE_EMAIL_VERIFICATION=true`: ค่าเริ่มต้น; บังคับ true นอก localhost
- `AUTH_IP_HEADER`: header ที่ reverse proxy ที่เชื่อถือได้เขียนทับเอง เช่น `cf-connecting-ip` เมื่ออยู่หลัง Cloudflare หรือ `x-real-ip` หลัง proxy ที่ตั้งค่าเอง ไม่ควรเปิด origin ให้ caller ปลอม header นี้ได้
- `QR_SIGNING_SECRET`: ความลับของระบบบัตร ไม่ใช่ session secret

Localhost ที่ไม่มี SMTP สามารถใช้ `AUTH_REQUIRE_EMAIL_VERIFICATION=false` เพื่อฝึก flow ได้; verification และ forgot-password จะไม่มีอีเมลส่งในโหมดนี้ ห้ามแปลว่าทดสอบการส่งอีเมลจริงผ่านแล้ว

รัน migration **หลังตรวจว่า DATABASE เป็นฐานที่ตั้งใจและมีแผนสำรองข้อมูล**:

```powershell
npm run migration:show
npm run migration:run
npm run dev
```

ฐานว่างมี migration 5 ไฟล์ ส่วนฐานเดิมจะรันเฉพาะที่ยังไม่อยู่ใน `tuatua_migrations` migration ใหม่ไม่เปลี่ยน users.id และไม่ล้าง Supabase ID เก่า `down` ของ Better Auth ปฏิเสธเมื่อมีบัญชี auth อยู่แล้วเพื่อไม่ลบ credentials โดยเผลอ

## Flow และ endpoint

| ขั้นตอน | Endpoint | หมายเหตุ |
| --- | --- | --- |
| สมัคร | `POST /api/auth/sign-up/email` | `{name,email,password}` รหัสผ่าน 12–128 ตัวอักษร; ยังไม่สร้างบัญชีธุรกิจ |
| ส่งยืนยันอีกครั้ง | `POST /api/auth/send-verification-email` | `{email,callbackURL}` |
| ยืนยัน | `GET /api/auth/verify-email` | ใช้ URL ที่ Better Auth ส่งทางอีเมล |
| เข้าสู่ระบบ | `POST /api/auth/sign-in/email` | `{email,password,rememberMe}`; ต้องยืนยันอีเมลเมื่อเปิด policy |
| ดู session | `GET /api/auth/get-session` | session ปัจจุบันหรือ null; ไม่ใช่ DTO ของ `/me` |
| ตั้ง username | `POST /api/v1/me` | `{username,displayName}` รับ identity จาก session เท่านั้น; ครั้งแรก 201 เรียกซ้ำ 200 |
| อ่าน/แก้โปรไฟล์ | `GET/PATCH /api/v1/me` | ตรวจ suspended/role จาก DB; ก่อน provision ได้ 409 |
| ขอ reset | `POST /api/auth/request-password-reset` | `{email,redirectTo}`; redirect ต้องอยู่ใน trusted origin |
| reset | `POST /api/auth/reset-password` | `{token,newPassword}`; token ใช้ซ้ำไม่ได้และ revoke ทุก session เก่า |
| ออกจากระบบ | `POST /api/auth/sign-out` | ลบ session ปัจจุบันและ cookie |

`/api/auth/*` ใช้ response/error มาตรฐาน Better Auth ส่วน `/api/v1/*` ใช้ `{data,meta}` / `{error,meta}` ของระบบเดิม แยกชนิด response ให้ถูก

`/api/v1/auth/login`, `/signup`, `/logout`, `/confirm` ตอบ **410 AUTH_ENDPOINT_MOVED** เพื่อไม่คง Supabase Auth สองระบบไว้พร้อมกัน ให้เปลี่ยน caller ไป endpoint ตารางด้านบน

## ตัวอย่างต่อกับหน้า UI

หน้า login/register/profile ของ dev ยังเป็น UI เดิมและยังมี mock handler ไม่ได้ถูกเขียนทับในงานย้าย server/API นี้ ตัวอย่างสำหรับเชื่อมภายหลัง:

```tsx
import { authClient } from "@/lib/auth-client";

const { error } = await authClient.signUp.email({
    name: "รพีภัทร",
    email: "alumni@example.com",
    password: passwordFromForm,
    callbackURL: "/login",
});
// แสดงข้อความให้ตรวจอีเมลเมื่อ require verification เป็น true

const login = await authClient.signIn.email({
    email: emailFromForm,
    password: passwordFromForm,
    rememberMe: true,
});
if (!login.error) {
    // หาก GET /api/v1/me ได้ ACCOUNT_NOT_PROVISIONED ให้ไปหน้าตั้ง username
    const response = await fetch("/api/v1/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "alumni-53", displayName: "รพีภัทร" }),
    });
    // ตรวจ response.ok และ error.code ก่อนแสดงว่าสำเร็จ
}

const { data: session, isPending } = authClient.useSession();
await authClient.signOut();
```

ไม่เก็บ session token ใน localStorage และไม่เอา role จาก form/localStorage มาตัดสินสิทธิ์ รูปแบบ cookie ของ Better Auth เป็น HttpOnly/SameSite ส่วน Secure ใช้เมื่อ origin เป็น HTTPS

สำหรับ kiosk ให้ใช้ค่า signed token จาก response header `set-auth-token` ของการ sign-in ใน `Authorization: Bearer ...` และเก็บในพื้นที่ปลอดภัยของอุปกรณ์ ไม่ใช้ Supabase JWT เดิมหรือ raw unsigned token

## บัญชี Supabase เดิม

session/รหัสผ่าน Supabase เดิมใช้กับ Better Auth ไม่ได้ การเพิ่ม migration ไม่ได้ย้าย credentials หรือผูกคนเก่าด้วย email อัตโนมัติ ซึ่งอาจทำให้ยึดบัญชีได้

ก่อนใช้กับข้อมูลสมาชิกจริง ต้องมี flow พิสูจน์เจ้าของบัญชีและ mapping จาก users.id เดิมไป Better Auth user ที่ยืนยันแล้ว ตรวจความซ้ำและ audit การผูกบัญชี ห้ามให้ client ส่ง users.id เก่าเพื่อ claim เอง งานนี้ยังไม่ย้ายบัญชีจริงและไม่สร้าง mapping ด้วยการเดาจาก email

## ผลตรวจและข้อจำกัด

- metadata tests 5 เคส, integration ธุรกิจ/migrations 28 เคส, auth integration 7 เคส ผ่านบน PostgreSQL 18 แยกสำหรับทดสอบ
- Auth tests ใช้ Better Auth handler + PostgreSQL จริง ตรวจ password hash, cookie/signed Bearer, revoke/expiry, suspended, CSRF, rate limit ใน DB, verification/reset พร้อม email capture ในหน่วยความจำ ไม่ส่งอีเมลภายนอก
- ใช้ migrations bootstrap/upgrades/revert/re-apply และตรวจ schema ตรง entity metadata รวมตารางใหม่
- `npm run build` ผ่าน; ตรวจ Next.js production HTTP เพิ่มต่างหากเพื่อให้เจอปัญหา bundling
- full-project lint ยังมี error เดิมจาก dev ที่ `app/vendor/page.tsx:131` และ `hooks/use-mobile.ts:14` ส่วน lint เฉพาะ server/API ผ่าน
- `npm audit` รายงาน 31 รายการ (high 7) เท่ากับ package/lockfile ของ origin/dev ที่ตรวจแยกไว้ ไม่พบ package ในรายงานเพิ่มจากงานนี้ ไม่รัน audit fix/force เพราะจะเปลี่ยน dependencies นอกขอบเขต โดยเฉพาะ Cloudflare
- ยังไม่ได้ทดสอบ SMTP จริง, Supabase จริง หรือ Cloudflare Workers preview; โดยเฉพาะ global connection pools ต้องทบทวนเมื่อเลือก Workers/Hyperdrive เพราะผล Node test ไม่ยืนยัน workerd lifecycle
- payment/topup/refund ธุรกิจยังเป็น mock ตาม scope เดิม; auth email ใช้ SMTP จริงได้เมื่อกำหนด แต่ business order email outbox ยังเป็น simulated

อ้างอิง API ทางการ: [Next.js integration](https://www.better-auth.com/docs/integrations/next), [PostgreSQL adapter](https://www.better-auth.com/docs/adapters/postgresql), [database/schema mapping](https://www.better-auth.com/docs/concepts/database), [Email/password](https://www.better-auth.com/docs/authentication/email-password), [rate limits](https://www.better-auth.com/docs/concepts/rate-limit), [signed Bearer](https://www.better-auth.com/docs/plugins/bearer)
