import "reflect-metadata";
import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { after, before, test } from "node:test";
import { Pool } from "pg";
import { DataSource } from "typeorm";
import { createDatabaseOptions } from "../database.options";
import { AdminActivity, Events, Order, Store, Ticket, User, UserRole, UserRolePermission } from "../entities";
import { Role } from "../enums/role.enum";
import { EVENT_ADMIN_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { makeAdminCsv } from "@/lib/admin-export";
import type { AdminActivityItem, AdminExportReport, AdminOrderDetail, AdminOrderSummary, AdminStore, AdminUser, ApiResponse, EventDetail, EventOverviewReport, EventSouvenirItem, EventTicketItem, OrderDetail, Paginated, StoreDetail, TokenRate, WalletDetail } from "@/lib/api-types";

// Never loads .env. Only a fresh, unused localhost database created here may be dropped.
if (!process.env.TEST_DATABASE) throw new Error("Set TEST_DATABASE to a new disposable local admin test database.");
const databaseUrl = new URL(process.env.TEST_DATABASE);
const databaseName = databaseUrl.pathname.slice(1);
assert.ok(["127.0.0.1", "localhost"].includes(databaseUrl.hostname));
assert.match(databaseName, /^tuatua_admin_api_test_[a-f0-9]{8}$/);
const adminUrl = new URL(databaseUrl); adminUrl.pathname = "/postgres";
const adminPool = new Pool({ connectionString: adminUrl.href, max: 1, connectionTimeoutMillis: 5000 });
const source = new DataSource({ ...createDatabaseOptions(databaseUrl.href), migrations: [resolve(__dirname, "../migrations/*.ts")], migrationsTableName: "tuatua_migrations", migrationsTransactionMode: "all" });
let createdDatabase = false;
let server: ChildProcess | undefined;
let serverLog = "";
let baseUrl = "";
type Session = { id: string; cookie: string };
let owner: Session, scoped: Session, otherAdmin: Session, customer: Session, otherUser: Session, vendor: Session, teammate: Session;
let firstEvent: Events, secondEvent: Events;
let ticketType: EventTicketItem, souvenir: EventSouvenirItem;

type Reply<T> = { status: number; body: ApiResponse<T>; headers: Headers };
async function request<T>(path: string, method = "GET", body?: unknown, session?: Session): Promise<Reply<T>> {
    const response = await fetch(baseUrl + path, { method, headers: { Origin: baseUrl, ...(session ? { Cookie: session.cookie } : {}), ...(body !== undefined ? { "Content-Type": "application/json" } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(60000) });
    return { status: response.status, body: await response.json() as ApiResponse<T>, headers: response.headers };
}
function ok<T>(reply: Reply<T>, status = 200): T {
    assert.equal(reply.status, status, JSON.stringify(reply.body));
    if (!reply.body.success) assert.fail(JSON.stringify(reply.body));
    return reply.body.data;
}
function denied(reply: Reply<unknown>, status: number) { assert.equal(reply.status, status, JSON.stringify(reply.body)); assert.equal(reply.body.success, false); }
const path = (event = firstEvent) => `/api/admin/events/${event.id}`;

async function signup(name: string): Promise<Session> {
    const reply = await fetch(baseUrl + "/api/auth/sign-up/email", { method: "POST", headers: { "Content-Type": "application/json", Origin: baseUrl }, body: JSON.stringify({ name, firstName: name, lastName: "Test", email: `${name}@example.test`, password: randomBytes(24).toString("hex") }) });
    assert.equal(reply.status, 200, await reply.clone().text());
    const data = await reply.json() as { user: { id: string } };
    return { id: data.user.id, cookie: reply.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ") };
}
async function grant(user: Session, eventId: string | null, permissions = EVENT_ADMIN_PERMISSIONS) {
    const role = await source.manager.save(UserRole, { userId: user.id, role: Role.ADMIN, eventId, storeId: null });
    if (permissions.length) await source.manager.insert(UserRolePermission, permissions.map((permission) => ({ userRoleId: role.id, permission })));
}

before(async () => {
    await adminPool.query(`CREATE DATABASE "${databaseName}"`); createdDatabase = true;
    await source.initialize(); await source.runMigrations();
    [firstEvent, secondEvent] = await source.manager.save(Events, ["admin-first", "admin-other"].map((slug) => ({ slug, title: slug, subTitle: "Test", venue: "Test", description: "Test", banner: "", thumbnail: "", buyAt: new Date("2020-01-01"), buyEndAt: new Date("2030-01-01"), minTicketQTY: 1, maxTicketQTY: 5, allowShipping: true, shippingFee: "20.00" })));
    // Exercise an actual schema rollback/reapply and repair an older empty event ADMIN assignment.
    const legacy = await source.manager.save(User, { email: "legacy@example.test", name: "Legacy", firstName: "Legacy", lastName: "Test" });
    const role = await source.manager.save(UserRole, { userId: legacy.id, role: Role.ADMIN, eventId: firstEvent.id });
    await source.undoLastMigration();
    assert.equal((await source.query("SELECT to_regclass('public.token_pricing') AS name"))[0].name, null);
    await source.undoLastMigration();
    assert.equal((await source.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'review_decision'")).length, 0);
    await source.runMigrations();
    assert.equal(await source.manager.countBy(UserRolePermission, { userRoleId: role.id }), EVENT_ADMIN_PERMISSIONS.length);

    const probe = createServer();
    await new Promise<void>((resolve, reject) => { probe.once("error", reject); probe.listen(0, "127.0.0.1", resolve); });
    const address = probe.address(); assert.ok(address && typeof address !== "string");
    baseUrl = `http://127.0.0.1:${address.port}`;
    await new Promise<void>((resolve) => probe.close(() => resolve()));
    server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", String(address.port)], { cwd: resolve(__dirname, "../../.."), windowsHide: true, env: { ...process.env, DATABASE: databaseUrl.href, APP_URL: baseUrl, BETTER_AUTH_URL: baseUrl, BETTER_AUTH_SECRET: randomBytes(32).toString("hex"), PROMPTPAY_PHONE: "0812345678", NEXT_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", "pipe", "pipe"] });
    const collect = (chunk: Buffer) => { serverLog = (serverLog + chunk.toString()).slice(-16000); };
    server.stdout?.on("data", collect); server.stderr?.on("data", collect);
    const deadline = Date.now() + 120000;
    let ready = false;
    while (Date.now() < deadline && server.exitCode === null) {
        try { if ((await fetch(baseUrl + "/api/faq", { signal: AbortSignal.timeout(5000) })).ok) { ready = true; break; } } catch { /* wait for Next compilation */ }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    assert.ok(ready, serverLog);
    owner = await signup("owner"); scoped = await signup("scoped"); otherAdmin = await signup("other-admin");
    customer = await signup("customer"); otherUser = await signup("other-customer"); vendor = await signup("vendor"); teammate = await signup("teammate");
    await grant(owner, null, []); await grant(scoped, firstEvent.id); await grant(otherAdmin, secondEvent.id);
    ticketType = ok(await request<EventTicketItem>(path() + "/tickets", "POST", { name: "Test ticket", price: "100.25", quota: 20, maxTicketQTY: 5 }, owner), 201);
    souvenir = ok(await request<EventSouvenirItem>(path() + "/souvenirs", "POST", { name: "Test souvenir", sizes: [], extraPrice: "10.00", allTicketTypes: false, eligibleTicketTypeIds: [] }, owner), 201);
}, { timeout: 180000 });

after(async () => {
    if (server?.pid && server.exitCode === null) {
        if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
        else { server.kill("SIGTERM"); await new Promise<void>((resolve) => { server?.once("exit", resolve); setTimeout(resolve, 5000).unref(); }); }
    }
    if (source.isInitialized) await source.destroy();
    if (createdDatabase) await adminPool.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
    await adminPool.end();
});

// One-pixel PNG is a file-format fixture for this isolated DB, never real payment evidence.
const proof = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
async function createOrder(quantity = 1, shipping = false) {
    return ok(await request<OrderDetail>("/api/orders", "POST", { requestId: randomUUID(), eventId: firstEvent.id, items: [{ eventTicketId: ticketType.id, quantity, attendees: Array.from({ length: quantity }, () => ({ firstName: "Test", lastName: "Attendee" })) }], deliveryMethod: shipping ? "SHIPPING" : "NONE", ...(shipping ? { souvenirItems: [{ souvenirId: souvenir.id, size: null, quantity: 1 }], shipping: { recipientName: "Test Recipient", recipientPhone: "0812345678", addressLine: "1 Test Road", subDistrict: "Test", district: "Test", province: "Test", postalCode: "10110" } } : {}) }, customer), 201);
}
async function submit(order: OrderDetail) { return ok(await request<OrderDetail>(`/api/orders/${order.id}`, "PATCH", { action: "submit", proof }, customer)); }

test("admin workflows through real HTTP sessions and a migrated disposable database", { timeout: 300000 }, async (t) => {
    let approved: OrderDetail;
    let store: StoreDetail;
    await t.test("all new handlers require authentication, admin role, own event and explicit permission", async () => {
        const missing = randomUUID();
        const endpoints: [string, string][] = [["GET", "/orders"], ["GET", `/orders/${missing}`], ["GET", `/orders/${missing}/slip`], ["POST", `/orders/${missing}/review`], ["PATCH", `/orders/${missing}/shipping`], ["GET", "/overview"], ["GET", "/activities"], ["GET", "/reports"], ["GET", "/stores"], ["POST", "/stores"], ["PATCH", `/stores/${missing}`], ["DELETE", `/stores/${missing}`], ["GET", "/users"], ["POST", `/users/${missing}/roles`], ["PATCH", `/users/${missing}/roles/${missing}`], ["DELETE", `/users/${missing}/roles/${missing}`]];
        for (const [method, suffix] of endpoints) {
            denied(await request(path() + suffix, method), 401);
            denied(await request(path() + suffix, method, undefined, customer), 403);
            denied(await request(path() + suffix, method, undefined, otherAdmin), 403);
        }
        denied(await request(path(secondEvent) + "/orders", "GET", undefined, scoped), 403);
        const reply = await request<Paginated<AdminOrderSummary>>(path() + "/orders", "GET", undefined, scoped);
        assert.deepEqual(ok(reply).items, []); assert.match(reply.headers.get("cache-control") ?? "", /private.*no-store/);
    });
    await t.test("bad IDs, filters, input and proof-less approvals return explicit errors", async () => {
        denied(await request(path() + "/orders?page=0", "GET", undefined, owner), 422);
        denied(await request(path() + "/orders?status=FAKE", "GET", undefined, owner), 422);
        denied(await request(path() + "/orders/not-a-uuid", "GET", undefined, owner), 422);
        denied(await request(path() + "/stores", "POST", { name: "" }, owner), 422);
        denied(await request(path(), "PATCH", { title: false }, owner), 422);
        const unpaid = await createOrder();
        denied(await request(path() + `/orders/${unpaid.id}/review`, "POST", { decision: "APPROVE" }, owner), 409);
        await request(`/api/orders/${unpaid.id}`, "PATCH", { action: "cancel" }, customer);
    });
    await t.test("approve once activates paid tickets and preserves reviewer audit on duplicate requests", async () => {
        approved = await submit(await createOrder(2, true));
        assert.equal(approved.total, "230.50");
        const raw = await fetch(baseUrl + path() + `/orders/${approved.id}/slip`, { headers: { Cookie: scoped.cookie } });
        assert.equal(raw.status, 200); assert.equal(raw.headers.get("content-type"), "image/png"); assert.match(raw.headers.get("cache-control") ?? "", /no-store/);
        assert.equal(Buffer.from(await raw.arrayBuffer()).toString("hex", 0, 8), "89504e470d0a1a0a");
        const reviewed = ok(await request<AdminOrderDetail>(path() + `/orders/${approved.id}/review`, "POST", { decision: "APPROVE", actorId: customer.id }, scoped));
        assert.equal(reviewed.status, "PAID"); assert.equal(reviewed.review?.actorId, scoped.id); assert.ok(reviewed.tickets.every((ticket) => ticket.status === "ACTIVE" && ticket.qrToken));
        const duplicate = ok(await request<AdminOrderDetail>(path() + `/orders/${approved.id}/review`, "POST", { decision: "APPROVE" }, owner));
        assert.equal(duplicate.review?.at, reviewed.review?.at); assert.equal(duplicate.review?.actorId, scoped.id);
        assert.equal(await source.manager.countBy(AdminActivity, { action: "order.approve", targetId: approved.id }), 1);
        denied(await request(path() + `/orders/${approved.id}/review`, "POST", { decision: "REJECT", reason: "Wrong transition" }, owner), 409);
        denied(await request(`/api/orders/${approved.id}`, "GET", undefined, otherUser), 404);
        denied(await request(path(secondEvent) + `/orders/${approved.id}`, "GET", undefined, owner), 404);
        denied(await request(path(secondEvent) + `/orders/${approved.id}/slip`, "GET", undefined, owner), 404);
    });
    await t.test("reject requires reason and concurrent duplicates release quota only once", async () => {
        const order = await submit(await createOrder(3));
        const before = ok(await request<EventTicketItem>(path() + `/tickets/${ticketType.id}`, "GET", undefined, owner)).sold;
        denied(await request(path() + `/orders/${order.id}/review`, "POST", { decision: "REJECT" }, owner), 422);
        const replies = await Promise.all([request<AdminOrderDetail>(path() + `/orders/${order.id}/review`, "POST", { decision: "REJECT", reason: "Test rejection" }, scoped), request<AdminOrderDetail>(path() + `/orders/${order.id}/review`, "POST", { decision: "REJECT", reason: "Retry" }, owner)]);
        for (const reply of replies) assert.equal(ok(reply).status, "CANCELLED");
        const after = ok(await request<EventTicketItem>(path() + `/tickets/${ticketType.id}`, "GET", undefined, owner)).sold;
        assert.equal(after, before - 3); assert.equal(await source.manager.countBy(AdminActivity, { action: "order.reject", targetId: order.id }), 1);
        const customerOrder = ok(await request<OrderDetail>(`/api/orders/${order.id}`, "GET", undefined, customer));
        assert.ok(customerOrder.tickets.every((ticket) => ticket.status === "CANCELLED" && ticket.qrToken === ""));
        denied(await request(path() + `/orders/${order.id}/review`, "POST", { decision: "APPROVE" }, owner), 409);
    });
    await t.test("opposing concurrent reviews have one winner and leave consistent ticket/quota state", async () => {
        const order = await submit(await createOrder(2));
        const replies = await Promise.all([request<AdminOrderDetail>(path() + `/orders/${order.id}/review`, "POST", { decision: "APPROVE" }, scoped), request<AdminOrderDetail>(path() + `/orders/${order.id}/review`, "POST", { decision: "REJECT", reason: "Concurrent" }, owner)]);
        assert.deepEqual(replies.map((reply) => reply.status).sort(), [200, 409]);
        const saved = ok(await request<AdminOrderDetail>(path() + `/orders/${order.id}`, "GET", undefined, owner));
        assert.ok(saved.tickets.every((ticket) => ticket.status === (saved.status === "PAID" ? "ACTIVE" : "CANCELLED")));
        const all = await source.manager.findBy(Ticket, { eventId: firstEvent.id });
        const quota = ok(await request<EventTicketItem>(path() + `/tickets/${ticketType.id}`, "GET", undefined, owner));
        assert.equal(quota.sold, all.filter((ticket) => ticket.status !== "CANCELLED").length);
    });
    await t.test("shipping persists tracking for paid orders and rejects backward transitions", async () => {
        denied(await request(path() + `/orders/${approved.id}/shipping`, "PATCH", { status: "SHIPPED" }, scoped), 422);
        const shipped = ok(await request<AdminOrderDetail>(path() + `/orders/${approved.id}/shipping`, "PATCH", { status: "SHIPPED", carrier: "Test carrier", trackingNumber: "TEST-001" }, scoped));
        assert.equal(shipped.shipping?.trackingNumber, "TEST-001"); assert.ok(shipped.shipping?.shippedAt);
        ok(await request(path() + `/orders/${approved.id}/shipping`, "PATCH", { status: "DELIVERED" }, owner));
        denied(await request(path() + `/orders/${approved.id}/shipping`, "PATCH", { status: "PENDING" }, owner), 409);
    });
    await t.test("store CRUD uses admin scope and refuses to erase financial history", async () => {
        store = ok(await request<StoreDetail>(path() + "/stores", "POST", { eventId: secondEvent.id, name: "Admin store" }, scoped), 201);
        assert.equal(store.eventId, firstEvent.id);
        const updated = ok(await request<AdminStore>(path() + `/stores/${store.id}`, "PATCH", { name: "Updated store", description: "Actual data" }, scoped));
        assert.equal(updated.name, "Updated store");
        denied(await request(path(secondEvent) + `/stores/${store.id}`, "PATCH", { name: "Cross event" }, owner), 404);
        ok(await request(path() + `/users/${vendor.id}/roles`, "POST", { role: "VENDOR", storeId: store.id, permissions: [PERMISSIONS.STORE_SELL, PERMISSIONS.STORE_MANAGE] }, scoped), 201);
        ok(await request("/api/admin/wallet/topup", "POST", { userId: customer.id, amount: "100.00" }, owner));
        ok(await request(`/api/store/sell?storeId=${store.id}`, "POST", { customerUserId: customer.id, amount: "25.00" }, vendor));
        denied(await request(path() + `/stores/${store.id}`, "DELETE", undefined, scoped), 409);
        assert.equal((await source.manager.findOneByOrFail(Store, { id: store.id })).name, "Updated store");
        const removable = ok(await request<StoreDetail>(path() + "/stores", "POST", { name: "Unused store" }, scoped), 201);
        ok(await request(path() + `/stores/${removable.id}`, "DELETE", undefined, scoped));
    });
    await t.test("role edits are scoped, cannot grant global privileges, and revocation affects existing sessions", async () => {
        denied(await request(path() + `/users/${teammate.id}/roles`, "POST", { role: "ADMIN", eventId: secondEvent.id, permissions: [PERMISSIONS.EVENT_CREATE] }, scoped), 422);
        const assignment = ok(await request<{ id: string }>(path() + `/users/${teammate.id}/roles`, "POST", { role: "ADMIN", permissions: [PERMISSIONS.REPORT_READ] }, scoped), 201);
        ok(await request<EventOverviewReport>(path() + "/overview", "GET", undefined, teammate));
        denied(await request(path() + "/reports", "GET", undefined, teammate), 403);
        denied(await request(path(secondEvent) + `/users/${teammate.id}/roles/${assignment.id}`, "DELETE", undefined, owner), 404);
        denied(await request(path() + `/users/${teammate.id}/roles/${assignment.id}`, "PATCH", {}, scoped), 422);
        ok(await request(path() + `/users/${teammate.id}/roles/${assignment.id}`, "PATCH", { permissions: [PERMISSIONS.REPORT_READ, PERMISSIONS.REPORT_EXPORT] }, scoped));
        ok(await request(path() + "/reports", "GET", undefined, teammate));
        ok(await request(path() + `/users/${teammate.id}/roles/${assignment.id}`, "DELETE", undefined, scoped));
        denied(await request(path() + "/overview", "GET", undefined, teammate), 403);
        const users = ok(await request<AdminUser[]>(path() + "/users", "GET", undefined, scoped));
        assert.ok(users.every((user) => !("walletBalance" in user) && user.roles.every((role) => role.eventId === firstEvent.id)));
    });
    await t.test("dashboard/export use only this event and historical paid ticket prices", async () => {
        await source.manager.update(Events, secondEvent.id, { title: "Other private event" });
        await source.manager.save(Order, { id: randomUUID(), eventId: secondEvent.id, userId: otherUser.id, orderNo: "OTHER-PRIVATE", status: "PAID", total: "9999.00", shippingFee: "0.00" });
        ok(await request(path() + `/tickets/${ticketType.id}`, "PATCH", { price: "200.00" }, scoped));
        const report = ok(await request<AdminExportReport>(path() + "/reports", "GET", undefined, scoped));
        const expected = await source.query(`SELECT COALESCE(SUM(total), 0)::text AS total FROM orders WHERE event_id = $1 AND status = 'PAID'`, [firstEvent.id]) as { total: string }[];
        assert.equal(report.overview.totalTicketRevenue, expected[0].total); assert.equal(report.overview.totalStoreVolume, "25.00");
        assert.ok(report.stores.every((entry) => entry.eventId === firstEvent.id));
        const row = report.tickets.find((entry) => entry.id === ticketType.id)!;
        assert.equal(row.price, "200.00"); assert.equal(Number(row.paidRevenue), row.paidTickets * 100.25);
        const activities = ok(await request<AdminActivityItem[]>(path() + "/activities", "GET", undefined, scoped));
        assert.ok(activities.some((item) => item.action === "order.approve" && item.actorId === scoped.id));
        assert.ok(activities.every((item) => item.eventId === firstEvent.id));
        const other = ok(await request<Paginated<AdminOrderSummary>>(path(secondEvent) + "/orders", "GET", undefined, owner));
        assert.equal(other.total, 1); assert.equal(other.items[0].orderNo, "OTHER-PRIVATE");
    });
    await t.test("event CRUD persists schedule and cache invalidation remains functional", async () => {
        const created = ok(await request<EventDetail>("/api/admin/events", "POST", { slug: "admin-created", title: "Admin created", subTitle: "", venue: "Test", description: "<p>Real event</p>", banner: "", thumbnail: "", tags: [], buyAt: "2026-01-01T00:00:00Z", buyEndAt: "2027-01-01T00:00:00Z", minTicketQTY: 1, maxTicketQTY: 5, sessions: [{ title: "First session", startsAt: "2026-12-01T01:00:00Z", endsAt: "2026-12-01T02:00:00Z" }] }, owner), 201);
        assert.equal(created.sessions[0].title, "First session");
        const updated = ok(await request<EventDetail>(`/api/admin/events/${created.id}`, "PATCH", { title: "Saved title", sessions: [{ ...created.sessions[0], title: "Saved schedule" }] }, owner));
        assert.equal(updated.sessions[0].title, "Saved schedule");
        ok(await request(`/api/admin/events/${created.id}`, "DELETE", undefined, owner));
    });
    await t.test("a souvenir photo saved by the event admin is visible in public event details", async () => {
        const souvenirPath = path() + `/souvenirs/${souvenir.id}`;
        const image = "/images/demo-souvenirs/pin.webp";
        denied(await request(souvenirPath, "PATCH", { image }, otherAdmin), 403);
        denied(await request(souvenirPath, "PATCH", { image: "javascript:alert(1)" }, scoped), 422);
        const updated = ok(await request<EventSouvenirItem>(souvenirPath, "PATCH", { image: ` ${image} ` }, scoped));
        assert.equal(updated.image, image);

        const event = ok(await request<EventDetail>(`/api/events/${firstEvent.slug}`));
        assert.equal(event.souvenirs.find((item) => item.id === souvenir.id)?.image, image);
        const cleared = ok(await request<EventSouvenirItem>(souvenirPath, "PATCH", { image: null }, scoped));
        assert.equal(cleared.image, null);
    });
    await t.test("ticket rewards use the booked amount and concurrent approval credits only once", async () => {
        const ticketPath = path() + `/tickets/${ticketType.id}`;
        assert.equal(ticketType.tokenReward, 0);
        for (const tokenReward of [-1, 1.5, 100_000_000, null]) {
            denied(await request(ticketPath, "PATCH", { tokenReward }, scoped), 422);
        }
        denied(await request(ticketPath, "PATCH", { tokenReward: 12 }, otherAdmin), 403);
        assert.equal(ok(await request<EventTicketItem>(ticketPath, "PATCH", { tokenReward: 12 }, scoped)).tokenReward, 12);
        const order = await submit(await createOrder(2));
        assert.deepEqual(order.tickets.map((ticket) => ticket.tokenReward), [12, 12]);
        const walletPath = "/api/me/wallet";
        const pending = ok(await request<WalletDetail>(walletPath, "GET", undefined, customer));
        assert.ok(!pending.histories.some((entry) => entry.ref === order.id));

        ok(await request(ticketPath, "PATCH", { tokenReward: 4 }, scoped));
        const reviewPath = path() + `/orders/${order.id}/review`;
        const approvals = await Promise.all([scoped, owner].map((admin) =>
            request<AdminOrderDetail>(reviewPath, "POST", { decision: "APPROVE" }, admin)));
        for (const approval of approvals) assert.equal(ok(approval).status, "PAID");
        const approved = ok(await request<WalletDetail>(walletPath, "GET", undefined, customer));
        const rewards = approved.histories.filter((entry) => entry.ref === order.id);
        assert.equal(rewards.length, 1);
        assert.equal(rewards[0].type, "TICKET_REWARD");
        assert.equal(rewards[0].amount, "24.00");
        assert.equal(Number(approved.total) - Number(pending.total), 24);

        const rejected = await submit(await createOrder());
        assert.equal(rejected.tickets[0].tokenReward, 4);
        ok(await request(path() + `/orders/${rejected.id}/review`, "POST", { decision: "REJECT", reason: "Invalid slip" }, scoped));
        const afterRejection = ok(await request<WalletDetail>(walletPath, "GET", undefined, customer));
        assert.equal(afterRejection.total, approved.total);
        assert.ok(!afterRejection.histories.some((entry) => entry.ref === rejected.id));
    });
    await t.test("a free ticket grants its configured reward once and zero disables it", async () => {
        const freeType = ok(await request<EventTicketItem>(path() + "/tickets", "POST", {
            name: "Reward ticket", price: "0.00", quota: 10, tokenReward: 7,
        }, scoped), 201);
        const input = {
            requestId: randomUUID(),
            eventId: firstEvent.id,
            items: [{ eventTicketId: freeType.id, quantity: 1, attendees: [{ firstName: "Test", lastName: "Attendee" }] }],
            deliveryMethod: "NONE",
        };
        const reservations = await Promise.all([1, 2].map(() =>
            request<OrderDetail>("/api/orders", "POST", input, otherUser)));
        for (const reservation of reservations) assert.equal(ok(reservation, 201).status, "PAID");
        const wallet = ok(await request<WalletDetail>("/api/me/wallet", "GET", undefined, otherUser));
        const rewards = wallet.histories.filter((entry) => entry.ref === input.requestId);
        assert.deepEqual(rewards.map((entry) => [entry.type, entry.amount]), [["TICKET_REWARD", "7.00"]]);

        ok(await request(path() + `/tickets/${freeType.id}`, "PATCH", { tokenReward: 0 }, scoped));
        const zeroReward = ok(await request<OrderDetail>("/api/orders", "POST", { ...input, requestId: randomUUID() }, otherUser), 201);
        assert.equal(zeroReward.tickets[0].tokenReward, 0);
        const afterZero = ok(await request<WalletDetail>("/api/me/wallet", "GET", undefined, otherUser));
        assert.equal(afterZero.total, wallet.total);
    });
    await t.test("global admins set the top-up rate and stale staff quotes leave balances intact", async () => {
        const ratePath = "/api/admin/wallet/rate";
        const staffRatePath = "/api/staff/token-rate";
        const staff = await signup("token-clerk");
        const role = await source.manager.save(UserRole, { userId: staff.id, role: Role.STAFF, eventId: null, storeId: null });
        await source.manager.insert(UserRolePermission, { userRoleId: role.id, permission: PERMISSIONS.TOKEN_TOPUP });
        assert.equal(ok(await request<TokenRate>(staffRatePath, "GET", undefined, staff)).bahtPerToken, "1.00");
        denied(await request(staffRatePath, "GET", undefined, customer), 403);
        denied(await request(ratePath, "PATCH", { bahtPerToken: "2.50" }, scoped), 403);
        denied(await request(ratePath, "PATCH", { bahtPerToken: "2.50" }, staff), 403);
        for (const bahtPerToken of ["0", "-1", "2.505"]) {
            denied(await request(ratePath, "PATCH", { bahtPerToken }, owner), 422);
        }
        assert.equal(ok(await request<TokenRate>(ratePath, "PATCH", { bahtPerToken: "2.35" }, owner)).bahtPerToken, "2.35");
        assert.equal(ok(await request<TokenRate>(staffRatePath, "GET", undefined, staff)).bahtPerToken, "2.35");

        const paidOrder = ok(await request<OrderDetail>(`/api/orders/${approved.id}`, "GET", undefined, customer));
        const ticket = paidOrder.tickets[0];
        assert.ok(ticket.qrToken);
        const walletPath = "/api/me/wallet";
        const startingWallet = ok(await request<WalletDetail>(walletPath, "GET", undefined, customer));
        const input = { attendeeId: ticket.qrToken, amount: 3, expectedBahtPerToken: "1.00" };
        const stale = await request("/api/staff/top-up", "POST", input, staff);
        denied(stale, 409);
        if (!stale.body.success) assert.equal(stale.body.error.code, "TOKEN_RATE_CHANGED");
        const currentWallet = ok(await request<WalletDetail>(walletPath, "GET", undefined, customer));
        assert.equal(currentWallet.total, startingWallet.total);
        assert.equal(currentWallet.histories.length, startingWallet.histories.length);

        const topUp = ok(await request<{ ticketCode: string; balance: number }>("/api/staff/top-up", "POST", {
            ...input, expectedBahtPerToken: "2.35",
        }, staff));
        assert.equal(topUp.ticketCode, ticket.ticketCode);
        assert.equal(topUp.balance, Number(startingWallet.total) + 3);
        ok(await request(ratePath, "PATCH", { bahtPerToken: "4.00" }, owner));
        const afterTopUp = ok(await request<WalletDetail>(walletPath, "GET", undefined, customer));
        const entry = afterTopUp.histories.find((history) => history.type === "TOPUP" && history.ref === staff.id);
        assert.deepEqual([entry?.amount, entry?.bahtPerToken, entry?.bahtAmount], ["3.00", "2.35", "7.05"]);
    });
});

test("CSV preserves Thai data and quotes while neutralizing formula cells", () => {
    const csv = makeAdminCsv([["ชื่อ", "ค่า"], ['ชื่อ, "ไทย"', " \t=HYPERLINK(\"bad\")"], [null, -25.5]]);
    assert.ok(csv.startsWith("\uFEFFชื่อ,ค่า\r\n"));
    assert.ok(csv.includes('"ชื่อ, ""ไทย"""')); assert.ok(csv.includes("' \t=HYPERLINK"));
    assert.ok(csv.endsWith(",-25.5"));
});
