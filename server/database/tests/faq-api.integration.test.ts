import "reflect-metadata";
import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { after, before, test } from "node:test";
import { Pool } from "pg";
import { DataSource } from "typeorm";
import type { ApiResponse, FaqCategoryAdminItem, FaqCategoryItem, FaqQuestionAdminItem } from "@/lib/api-types";
import { createDatabaseOptions } from "../database.options";
import { Events, User, UserRole } from "../entities";
import { Role } from "../enums/role.enum";

// This runner creates its own new database. It never loads .env or resets DATABASE.
// TEST_DATABASE must name an unused localhost DB: tuatua_faq_api_test_<8 hex digits>.
if (!process.env.TEST_DATABASE) throw new Error("Set TEST_DATABASE to a new disposable local FAQ test database.");
const databaseUrl = new URL(process.env.TEST_DATABASE);
const databaseName = databaseUrl.pathname.slice(1);
assert.ok(["localhost", "127.0.0.1"].includes(databaseUrl.hostname), "FAQ tests require localhost.");
assert.match(databaseName, /^tuatua_faq_api_test_[a-f0-9]{8}$/);
const adminUrl = new URL(databaseUrl);
adminUrl.pathname = "/postgres";
const adminPool = new Pool({ connectionString: adminUrl.href, max: 1, connectionTimeoutMillis: 5000 });
const source = new DataSource({
    ...createDatabaseOptions(databaseUrl.href),
    migrations: [resolve(__dirname, "../migrations/*.ts")],
    migrationsTableName: "tuatua_migrations",
    migrationsTransactionMode: "all",
});
let createdDatabase = false;
let server: ChildProcess | undefined;
let serverLog = "";
let baseUrl = "";
let adminCookie = "";
let userCookie = "";
let scopedCookie = "";
let adminId = "";

type Reply<T> = { status: number; body: ApiResponse<T>; headers: Headers };

async function request<T>(path: string, method = "GET", body?: unknown, cookie?: string): Promise<Reply<T>> {
    const headers = new Headers({ Origin: baseUrl });
    if (cookie) headers.set("Cookie", cookie);
    if (body !== undefined) headers.set("Content-Type", "application/json");
    const response = await fetch(`${baseUrl}${path}`, {
        method, headers, body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
    });
    return { status: response.status, body: await response.json() as ApiResponse<T>, headers: response.headers };
}

function ok<T>(reply: Reply<T>, status = 200): T {
    assert.equal(reply.status, status, JSON.stringify(reply.body));
    if (!reply.body.success) assert.fail(JSON.stringify(reply.body));
    return reply.body.data;
}

function denied(reply: Reply<unknown>, status: number, code?: string) {
    assert.equal(reply.status, status, JSON.stringify(reply.body));
    if (reply.body.success) assert.fail("Expected API failure");
    if (code) assert.equal(reply.body.error.code, code);
}

async function signup(name: string) {
    const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: baseUrl },
        body: JSON.stringify({ name, firstName: name, lastName: "FAQ test", email: `${name}@example.test`, password: randomBytes(24).toString("hex") }),
    });
    assert.equal(response.status, 200, await response.clone().text());
    const body = await response.json() as { user: { id: string } };
    const cookie = response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
    assert.ok(cookie, "Signup must return a real session cookie");
    return { id: body.user.id, cookie };
}

before(async () => {
    // CREATE fails if this database exists; only a database created here is removed below.
    await adminPool.query(`CREATE DATABASE "${databaseName}"`);
    createdDatabase = true;
    await source.initialize();
    await source.runMigrations();

    const probe = createServer();
    await new Promise<void>((resolve, reject) => { probe.once("error", reject); probe.listen(0, "127.0.0.1", resolve); });
    const address = probe.address();
    assert.ok(address && typeof address !== "string");
    const port = address.port;
    await new Promise<void>((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
    baseUrl = `http://127.0.0.1:${port}`;
    server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
        cwd: resolve(__dirname, "../../.."), windowsHide: true,
        env: {
            ...process.env, DATABASE: databaseUrl.href, APP_URL: baseUrl, BETTER_AUTH_URL: baseUrl,
            BETTER_AUTH_SECRET: randomBytes(32).toString("hex"), NEXT_TELEMETRY_DISABLED: "1",
        },
        stdio: ["ignore", "pipe", "pipe"],
    });
    const collect = (chunk: Buffer) => { serverLog = (serverLog + chunk.toString()).slice(-12000); };
    server.stdout?.on("data", collect);
    server.stderr?.on("data", collect);
    const deadline = Date.now() + 120000;
    let ready = false;
    while (Date.now() < deadline && server.exitCode === null) {
        try {
            const response = await fetch(`${baseUrl}/api/faq`, { signal: AbortSignal.timeout(5000) });
            if (response.ok) { ready = true; break; }
        } catch { /* wait for startup and compilation */ }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    assert.ok(ready, `FAQ server did not start:\n${serverLog}`);

    const admin = await signup("faq-admin");
    adminId = admin.id;
    adminCookie = admin.cookie;
    userCookie = (await signup("faq-user")).cookie;
    const scoped = await signup("faq-scoped-admin");
    scopedCookie = scoped.cookie;
    const event = await source.getRepository(Events).save(source.getRepository(Events).create({
        slug: "faq-test", title: "FAQ test", subTitle: "Test", banner: "", thumbnail: "", venue: "Test",
        description: "Test", buyAt: new Date("2026-01-01"), buyEndAt: new Date("2027-01-01"),
    }));
    await source.getRepository(UserRole).save([
        { userId: adminId, role: Role.ADMIN },
        { userId: scoped.id, role: Role.ADMIN, eventId: event.id },
    ]);
}, { timeout: 180000 });

after(async () => {
    if (server?.pid && server.exitCode === null) {
        if (process.platform === "win32") {
            spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
        } else {
            server.kill("SIGTERM");
            await new Promise<void>((resolve) => { server?.once("exit", resolve); setTimeout(resolve, 5000).unref(); });
        }
    }
    if (source.isInitialized) await source.destroy();
    if (createdDatabase) {
        assert.match(databaseName, /^tuatua_faq_api_test_[a-f0-9]{8}$/);
        await adminPool.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
    }
    await adminPool.end();
});

test("FAQ HTTP API with real sessions and an isolated migrated database", { timeout: 180000 }, async (t) => {
    const missingId = randomUUID();
    const protectedRoutes: [string, string][] = [
        ["GET", "/api/admin/faq"], ["POST", "/api/admin/faq/categories"], ["POST", "/api/admin/faq/questions"],
        ...["GET", "PATCH", "DELETE"].flatMap((method): [string, string][] => [
            [method, `/api/admin/faq/categories/${missingId}`], [method, `/api/admin/faq/questions/${missingId}`],
        ]),
    ];
    await t.test("every admin handler rejects missing sessions, users and event-scoped admins before reading input", async () => {
        for (const [method, path] of protectedRoutes) {
            denied(await request(path, method), 401, "UNAUTHORIZED");
            denied(await request(path, method, undefined, userCookie), 403, "FORBIDDEN");
            denied(await request(path, method, undefined, scopedCookie), 403, "FORBIDDEN");
        }
        assert.deepEqual(ok(await request<FaqCategoryAdminItem[]>("/api/admin/faq", "GET", undefined, adminCookie)), []);
    });

    let category: FaqCategoryAdminItem;
    let hiddenCategory: FaqCategoryAdminItem;
    let question: FaqQuestionAdminItem;
    await t.test("admin can create drafts; public reads omit both hidden categories and hidden questions", async () => {
        category = ok(await request<FaqCategoryAdminItem>("/api/admin/faq/categories", "POST", { name: " บัตร ", icon: "ticket", sortOrder: 2, isPublished: true }, adminCookie), 201);
        assert.equal(category.name, "บัตร");
        hiddenCategory = ok(await request<FaqCategoryAdminItem>("/api/admin/faq/categories", "POST", { name: "ฉบับร่าง", icon: "credit-card" }, adminCookie), 201);
        assert.equal(hiddenCategory.isPublished, false);
        question = ok(await request<FaqQuestionAdminItem>("/api/admin/faq/questions", "POST", {
            categoryId: category.id, question: "ดูบัตรที่ไหน?", answer: "เปิดหน้าบัตร", isPublished: true,
            keywords: ["บัตร", " บัตร ", ""], linkLabel: "ดูบัตร", linkHref: "/account/tickets",
        }, adminCookie), 201);
        assert.deepEqual(question.keywords, ["บัตร"]);
        ok(await request("/api/admin/faq/questions", "POST", { categoryId: category.id, question: "ยังไม่เผยแพร่", answer: "ร่าง" }, adminCookie), 201);
        ok(await request("/api/admin/faq/questions", "POST", { categoryId: hiddenCategory.id, question: "หมวดซ่อน", answer: "ห้ามแสดง", isPublished: true }, adminCookie), 201);
        const reply = await request<FaqCategoryItem[]>("/api/faq");
        const published = ok(reply);
        assert.equal(reply.headers.get("cache-control"), "no-store");
        assert.deepEqual(published.map((item) => item.id), [category.id]);
        assert.deepEqual(published[0].questions.map((item) => item.id), [question.id]);
        assert.equal("isPublished" in published[0], false);
        const all = ok(await request<FaqCategoryAdminItem[]>("/api/admin/faq", "GET", undefined, adminCookie));
        assert.equal(all.length, 2);
        assert.equal(all.flatMap((item) => item.questions).length, 3);
    });

    await t.test("partial edits preserve fields, support null links, publish changes immediately and move questions", async () => {
        const updated = ok(await request<FaqQuestionAdminItem>(`/api/admin/faq/questions/${question.id}`, "PATCH", { answer: "คำตอบใหม่", linkLabel: null, linkHref: null }, adminCookie));
        assert.equal(updated.question, question.question);
        assert.equal(updated.answer, "คำตอบใหม่");
        assert.equal(updated.linkHref, null);
        assert.deepEqual(updated.keywords, ["บัตร"]);
        ok(await request(`/api/admin/faq/categories/${category.id}`, "PATCH", { isPublished: false }, adminCookie));
        assert.deepEqual(ok(await request<FaqCategoryItem[]>("/api/faq")), []);
        ok(await request(`/api/admin/faq/categories/${category.id}`, "PATCH", { isPublished: true }, adminCookie));
        ok(await request(`/api/admin/faq/questions/${question.id}`, "PATCH", { categoryId: hiddenCategory.id }, adminCookie));
        assert.equal(ok(await request<FaqCategoryItem[]>("/api/faq"))[0].questions.length, 0);
        const moved = ok(await request<FaqQuestionAdminItem>(`/api/admin/faq/questions/${question.id}`, "GET", undefined, adminCookie));
        assert.equal(moved.categoryId, hiddenCategory.id);
        const detail = ok(await request<FaqCategoryAdminItem>(`/api/admin/faq/categories/${hiddenCategory.id}`, "GET", undefined, adminCookie));
        assert.ok(detail.questions.some((item) => item.id === question.id));
    });

    await t.test("bad input, malformed JSON, missing resources and unsafe links return explicit errors", async () => {
        for (const input of [{ name: "", icon: "ticket" }, { name: "x", icon: "constructor" }, { name: "x", icon: "ticket", sortOrder: -1 }, { name: "x", icon: "ticket", isPublished: "false" }]) {
            denied(await request("/api/admin/faq/categories", "POST", input, adminCookie), 422, "VALIDATION_ERROR");
        }
        const valid = { categoryId: category.id, question: "คำถาม", answer: "คำตอบ" };
        for (const input of [{ ...valid, keywords: [1] }, { ...valid, linkLabel: "ลิงก์" }, { ...valid, linkLabel: "ลิงก์", linkHref: "javascript:alert(1)" }]) {
            denied(await request("/api/admin/faq/questions", "POST", input, adminCookie), 422, "VALIDATION_ERROR");
        }
        denied(await request("/api/admin/faq/questions", "POST", { ...valid, categoryId: missingId }, adminCookie), 404, "FAQ_CATEGORY_NOT_FOUND");
        denied(await request("/api/admin/faq/categories/bad-id", "GET", undefined, adminCookie), 422, "VALIDATION_ERROR");
        denied(await request(`/api/admin/faq/questions/${missingId}`, "GET", undefined, adminCookie), 404, "FAQ_QUESTION_NOT_FOUND");
        denied(await request(`/api/admin/faq/categories/${category.id}`, "PATCH", {}, adminCookie), 422, "VALIDATION_ERROR");
        const response = await fetch(`${baseUrl}/api/admin/faq/categories`, { method: "POST", headers: { Cookie: adminCookie, "Content-Type": "application/json" }, body: "{" });
        assert.equal(response.status, 422);
    });

    await t.test("categories with questions cannot be deleted; deleting questions and empty categories works", async () => {
        denied(await request(`/api/admin/faq/categories/${hiddenCategory.id}`, "DELETE", undefined, adminCookie), 409, "FAQ_CATEGORY_HAS_QUESTIONS");
        const detail = ok(await request<FaqCategoryAdminItem>(`/api/admin/faq/categories/${hiddenCategory.id}`, "GET", undefined, adminCookie));
        for (const item of detail.questions) ok(await request(`/api/admin/faq/questions/${item.id}`, "DELETE", undefined, adminCookie));
        ok(await request(`/api/admin/faq/categories/${hiddenCategory.id}`, "DELETE", undefined, adminCookie));
        denied(await request(`/api/admin/faq/categories/${hiddenCategory.id}`, "GET", undefined, adminCookie), 404, "FAQ_CATEGORY_NOT_FOUND");
        denied(await request(`/api/admin/faq/questions/${question.id}`, "DELETE", undefined, adminCookie), 404, "FAQ_QUESTION_NOT_FOUND");
    });

    await t.test("suspending an admin invalidates access even with an existing session", async () => {
        await source.getRepository(User).update(adminId, { status: "SUSPENDED" });
        denied(await request("/api/admin/faq", "GET", undefined, adminCookie), 403, "ACCOUNT_SUSPENDED");
    });
});
