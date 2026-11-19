"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { AdminStore } from "@/lib/api-types";
import { api } from "@/lib/api-client";
import { PERMISSIONS } from "@/lib/permissions";
import { useAdminAccess } from "@/components/admin/AdminAccess";
import { AdminFeedback, apiData } from "@/components/admin/AdminFeedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function VendorsPage() {
    const { eventId, eventTitle, slug, can } = useAdminAccess();
    const [stores, setStores] = useState<AdminStore[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [revision, setRevision] = useState(0);
    const [target, setTarget] = useState<AdminStore | "new" | null>(null);
    function reload() { setLoading(true); setRevision((value) => value + 1); }
    useEffect(() => {
        let cancelled = false;
        api.admin.stores.list(eventId).then(apiData).then((data) => { if (!cancelled) { setStores(data); setError(null); } })
            .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "โหลดร้านค้าไม่สำเร็จ"); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [eventId, revision]);
    const filtered = stores.filter((store) => store.name.toLowerCase().includes(query.trim().toLowerCase()));
    return <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6"><header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">ร้านค้า</h1><p className="mt-2 text-sm text-muted-foreground">{eventTitle}</p></div><div className="flex gap-3"><Button variant="outline" className="min-h-11" onClick={reload}>รีเฟรช</Button><Button className="min-h-11 bg-brand text-on-brand hover:bg-brand-hover" onClick={() => setTarget("new")}>สร้างร้านค้า</Button></div></header>
        <div className="space-y-2"><label htmlFor="store-search" className="text-sm font-medium">ค้นหาร้านค้า</label><Input id="store-search" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <AdminFeedback loading={loading} error={error} retry={reload} />
        {!loading && !error && <div className="rounded-xl border bg-background p-4"><Table><TableHeader><TableRow><TableHead>ร้านค้า</TableHead><TableHead>สินค้า</TableHead><TableHead>Token คงเหลือ</TableHead><TableHead>ผู้ดูแลร้าน</TableHead><TableHead>จัดการ</TableHead></TableRow></TableHeader><TableBody>{filtered.length ? filtered.map((store) => <TableRow key={store.id}><TableCell className="font-medium">{store.name}</TableCell><TableCell>{store.product ? `${store.product.title} · ${store.product.price} Token` : "ยังไม่มีสินค้า"}</TableCell><TableCell className="tabular-nums">{Number(store.walletBalance).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</TableCell><TableCell>{store.managers.map((manager) => manager.name).join(", ") || "ยังไม่ได้มอบหมาย"}</TableCell><TableCell><Button variant="outline" className="min-h-11" onClick={() => setTarget(store)}>แก้ไขร้านค้า</Button></TableCell></TableRow>) : <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">ไม่พบร้านค้า</TableCell></TableRow>}</TableBody></Table>{can(PERMISSIONS.PERMISSION_MANAGE) && <Button asChild variant="outline" className="mt-4 min-h-11"><Link href={`/admin/${encodeURIComponent(slug)}/users`}>จัดการผู้ดูแลร้านในหน้าผู้ใช้และสิทธิ์</Link></Button>}</div>}
        <Dialog open={target !== null} onOpenChange={(open) => { if (!open) setTarget(null); }}><DialogContent><DialogHeader><DialogTitle>{target === "new" ? "สร้างร้านค้า" : "แก้ไขร้านค้า"}</DialogTitle><DialogDescription>จัดการข้อมูลร้านค้าเฉพาะงานนี้ ร้านค้าที่มีประวัติธุรกรรมจะลบไม่ได้</DialogDescription></DialogHeader>{target && <StoreForm key={target === "new" ? "new" : target.id} store={target === "new" ? undefined : target} onSaved={() => { setTarget(null); reload(); }} />}</DialogContent></Dialog>
    </div>;
}

function StoreForm({ store, onSaved }: { store?: AdminStore; onSaved: () => void }) {
    const { eventId } = useAdminAccess();
    const [name, setName] = useState(store?.name ?? "");
    const [description, setDescription] = useState(store?.description ?? "");
    const [busy, setBusy] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    async function save(event: React.FormEvent) {
        event.preventDefault(); setBusy(true);
        try { apiData(await (store ? api.admin.stores.update(eventId, store.id, { name, description }) : api.admin.stores.create(eventId, { name, description }))); toast.success("บันทึกร้านค้าแล้ว"); onSaved(); }
        catch (cause) { toast.error(cause instanceof Error ? cause.message : "บันทึกร้านค้าไม่สำเร็จ"); }
        finally { setBusy(false); }
    }
    async function remove() {
        if (!store || !confirmed) return;
        setBusy(true);
        try { apiData(await api.admin.stores.delete(eventId, store.id)); toast.success("ลบร้านค้าแล้ว"); onSaved(); }
        catch (cause) { toast.error(cause instanceof Error ? cause.message : "ลบร้านค้าไม่สำเร็จ"); }
        finally { setBusy(false); }
    }
    return <form onSubmit={save} className="space-y-4"><fieldset disabled={busy} className="space-y-4"><div className="space-y-2"><label htmlFor="store-name" className="text-sm font-medium">ชื่อร้านค้า *</label><Input id="store-name" maxLength={255} required value={name} onChange={(event) => setName(event.target.value)} /></div><div className="space-y-2"><label htmlFor="store-description" className="text-sm font-medium">รายละเอียด</label><Textarea id="store-description" maxLength={5000} value={description} onChange={(event) => setDescription(event.target.value)} /></div><Button type="submit" disabled={busy} className="min-h-11 bg-brand text-on-brand hover:bg-brand-hover">{busy ? "กำลังบันทึก..." : "บันทึกร้านค้า"}</Button>{store && <div className="space-y-3 border-t pt-4"><label className="flex min-h-11 items-center gap-3 text-sm"><Checkbox checked={confirmed} onCheckedChange={(value) => setConfirmed(value === true)} />ยืนยันลบร้านค้า</label><Button type="button" variant="destructive" disabled={busy || !confirmed} onClick={remove}>ลบร้านค้า</Button></div>}</fieldset></form>;
}
