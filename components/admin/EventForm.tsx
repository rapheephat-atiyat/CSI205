"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { EventDetail, EventInput, EventSessionInput } from "@/lib/api-types";
import { apiData } from "./AdminFeedback";
import { RichTextEditor } from "./RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const localDate = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^\p{L}\p{N}\p{M}]+/gu, "-").replace(/^-|-$/g, "");
const textFields = [{ key: "title", label: "ชื่องาน", required: true }, { key: "slug", label: "ชื่อใน URL (slug)", required: true }, { key: "subTitle", label: "คำโปรย" }, { key: "venue", label: "สถานที่", required: true }, { key: "thumbnail", label: "URL รูปปกย่อ" }, { key: "banner", label: "URL รูปโปสเตอร์" }] as const;

export default function EventForm({ initial, canDelete = false }: { initial?: EventDetail; canDelete?: boolean }) {
    const router = useRouter();
    const [fields, setFields] = useState<EventInput>(() => ({
        slug: initial?.slug ?? "", title: initial?.title ?? "", subTitle: initial?.subTitle ?? "", venue: initial?.venue ?? "",
        banner: initial?.banner ?? "", thumbnail: initial?.thumbnail ?? "", description: initial?.description ?? "", tags: initial?.tags ?? [],
        buyAt: localDate(initial?.buyAt), buyEndAt: localDate(initial?.buyEndAt), minTicketQTY: initial?.minTicketQTY ?? 1, maxTicketQTY: initial?.maxTicketQTY ?? 10,
        allowShipping: initial?.allowShipping ?? false, shippingFee: initial?.shippingFee ?? "0.00",
        sessions: initial?.sessions.map((session) => ({ ...session, startsAt: localDate(session.startsAt), endsAt: localDate(session.endsAt) })) ?? [],
    }));
    const [busy, setBusy] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);
    function field<K extends keyof EventInput>(key: K, value: EventInput[K]) { setFields((old) => ({ ...old, [key]: value })); }
    function session(index: number, input: Partial<EventSessionInput>) { field("sessions", (fields.sessions ?? []).map((value, position) => position === index ? { ...value, ...input } : value)); }
    async function save(event: React.FormEvent) {
        event.preventDefault(); setBusy(true);
        try {
            if (!(Date.parse(fields.buyAt) < Date.parse(fields.buyEndAt))) throw new Error("วันปิดขายต้องอยู่หลังวันเปิดขาย");
            const sessions = (fields.sessions ?? []).map((value) => {
                if ((value.startsAt || value.endsAt) && !(Date.parse(value.startsAt || "") < Date.parse(value.endsAt || ""))) throw new Error("เวลาเริ่มและสิ้นสุดของกำหนดการไม่ถูกต้อง");
                return { ...value, startsAt: value.startsAt ? new Date(value.startsAt).toISOString() : null, endsAt: value.endsAt ? new Date(value.endsAt).toISOString() : null };
            });
            const input = { ...fields, slug: fields.slug || slugify(fields.title), buyAt: new Date(fields.buyAt).toISOString(), buyEndAt: new Date(fields.buyEndAt).toISOString(), sessions };
            const saved = apiData(await (initial ? api.events.update(initial.id, input) : api.events.create(input)));
            toast.success(initial ? "บันทึกข้อมูลงานแล้ว" : "สร้างงานแล้ว");
            router.replace(`/admin/${encodeURIComponent(saved.slug)}/settings`); router.refresh();
        } catch (cause) { toast.error(cause instanceof Error ? cause.message : "บันทึกงานไม่สำเร็จ"); }
        finally { setBusy(false); }
    }
    async function remove() {
        if (!initial || !deleteConfirmed) return;
        setDeleting(true);
        try { apiData(await api.events.drop(initial.id)); toast.success("ลบงานแล้ว"); router.replace("/admin"); router.refresh(); }
        catch (cause) { toast.error(cause instanceof Error ? cause.message : "ลบงานไม่สำเร็จ"); }
        finally { setDeleting(false); }
    }
    return <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6"><header><h1 className="text-2xl font-semibold">{initial ? "ตั้งค่างาน" : "สร้างงาน"}</h1><p className="mt-2 text-sm text-muted-foreground">บันทึกข้อมูลงาน กำหนดการ และช่วงจำหน่ายบัตร</p></header>
        <form onSubmit={save} className="space-y-6"><fieldset disabled={busy || deleting} className="space-y-6">
            <section className="space-y-5 rounded-xl border bg-background p-4 sm:p-6"><h2 className="font-semibold">ข้อมูลงาน</h2><div className="grid gap-4 sm:grid-cols-2">{textFields.map(({ key, label, ...options }) => <div key={key} className="space-y-2"><label htmlFor={`event-${key}`} className="text-sm font-medium">{label}{"required" in options && options.required ? " *" : ""}</label><Input id={`event-${key}`} required={"required" in options && options.required} maxLength={["thumbnail", "banner"].includes(key) ? 2_800_000 : 255} value={key === "slug" ? fields.slug || slugify(fields.title) : fields[key]} onChange={(event) => field(key, event.target.value)} /></div>)}</div>
                <div className="space-y-2"><label htmlFor="event-tags" className="text-sm font-medium">แท็ก (คั่นด้วยเครื่องหมายจุลภาค)</label><Input id="event-tags" value={fields.tags.join(",")} onChange={(event) => field("tags", event.target.value.split(","))} /></div>
                <div className="space-y-2"><p className="text-sm font-medium" id="event-description-label">รายละเอียดงาน *</p><div aria-labelledby="event-description-label"><RichTextEditor value={fields.description} onChange={(value) => field("description", value)} /></div></div>
            </section>
            <section className="space-y-4 rounded-xl border bg-background p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">กำหนดการ</h2><Button type="button" variant="outline" className="min-h-11" onClick={() => field("sessions", [...fields.sessions ?? [], { title: "", startsAt: "", endsAt: "" }])}>เพิ่มรอบกิจกรรม</Button></div><p className="text-sm text-muted-foreground">วันเวลาแสดงตามเวลาของเครื่องที่คุณใช้งาน</p>
                {fields.sessions?.length ? fields.sessions.map((value, index) => <div key={value.id ?? `new-${index}`} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><label htmlFor={`session-title-${index}`} className="text-sm">ชื่อรอบ *</label><Input id={`session-title-${index}`} required maxLength={255} value={value.title} onChange={(event) => session(index, { title: event.target.value })} /></div>{(["startsAt", "endsAt"] as const).map((key) => <div key={key} className="space-y-2"><label className="text-sm" htmlFor={`session-${key}-${index}`}>{key === "startsAt" ? "เริ่ม" : "สิ้นสุด"}</label><Input id={`session-${key}-${index}`} type="datetime-local" value={value[key] || ""} onChange={(event) => session(index, { [key]: event.target.value })} /></div>)}<Button type="button" variant="outline" onClick={() => field("sessions", fields.sessions?.filter((_, position) => position !== index))}>นำรอบนี้ออก</Button></div>) : <p className="text-sm text-muted-foreground">ยังไม่มีกำหนดการ สามารถเพิ่มภายหลังได้</p>}
            </section>
            <section className="space-y-4 rounded-xl border bg-background p-4 sm:p-6"><h2 className="font-semibold">การจำหน่ายบัตรและจัดส่ง</h2><div className="grid gap-4 sm:grid-cols-2">{(["buyAt", "buyEndAt"] as const).map((key) => <div key={key} className="space-y-2"><label htmlFor={key} className="text-sm font-medium">{key === "buyAt" ? "เปิดขาย" : "ปิดขาย"} *</label><Input id={key} type="datetime-local" required value={fields[key]} onChange={(event) => field(key, event.target.value)} /></div>)}{(["minTicketQTY", "maxTicketQTY"] as const).map((key) => <div key={key} className="space-y-2"><label htmlFor={key} className="text-sm font-medium">{key === "minTicketQTY" ? "บัตรขั้นต่ำต่อคำสั่งซื้อ" : "บัตรสูงสุดต่อคำสั่งซื้อ"}</label><Input id={key} type="number" min={1} step={1} required value={fields[key]} onChange={(event) => field(key, Number(event.target.value))} /></div>)}</div>
                <label className="flex min-h-11 items-center gap-3 text-sm"><Checkbox checked={fields.allowShipping} onCheckedChange={(checked) => field("allowShipping", checked === true)} />เปิดจัดส่งของที่ระลึก</label>{fields.allowShipping && <div className="space-y-2"><label htmlFor="shipping-fee" className="text-sm">ค่าจัดส่ง (บาท)</label><Input id="shipping-fee" type="number" min={0} step="0.01" required value={fields.shippingFee} onChange={(event) => field("shippingFee", event.target.value)} /></div>}
                <p className="text-sm text-muted-foreground">การรับเงินใช้พร้อมเพย์ส่วนกลางของระบบ อัตรา Token ของระบบคงที่ 1 บาทต่อ 1 Token</p>
            </section>
            <Button type="submit" className="min-h-11 bg-brand px-6 text-on-brand hover:bg-brand-hover">{busy ? "กำลังบันทึก..." : initial ? "บันทึกงาน" : "สร้างงาน"}</Button>
        </fieldset></form>
        {initial && canDelete && <section className="space-y-3 rounded-xl border border-destructive/30 bg-background p-4"><h2 className="font-semibold">ลบงาน</h2><p className="text-sm text-muted-foreground">ลบได้เฉพาะงานที่ยังไม่มีคำสั่งซื้อหรือร้านค้า การลบไม่สามารถย้อนกลับได้</p><label className="flex min-h-11 items-center gap-3 text-sm"><Checkbox checked={deleteConfirmed} onCheckedChange={(checked) => setDeleteConfirmed(checked === true)} />ยืนยันว่าต้องการลบงานนี้</label><Button variant="destructive" disabled={!deleteConfirmed || busy || deleting} onClick={remove}>{deleting ? "กำลังลบ..." : "ลบงาน"}</Button></section>}
    </div>;
}
