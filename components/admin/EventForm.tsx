"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { EventDetail, EventInput, EventSessionInput } from "@/lib/api-types";
import { RichTextEditor } from "./RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

// แปลงวันเวลาเป็นรูปแบบสำหรับ input type="datetime-local" (YYYY-MM-DDTHH:mm)
function toInputDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

// สร้าง slug ง่ายๆ จากชื่องาน
function makeSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export default function EventForm({
  initial,
  canDelete = false,
}: {
  initial?: EventDetail;
  canDelete?: boolean;
}) {
  const router = useRouter();

  // ข้อมูลงาน
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [isSlugCustom, setIsSlugCustom] = useState(Boolean(initial?.slug));
  const [subTitle, setSubTitle] = useState(initial?.subTitle ?? "");
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [thumbnail, setThumbnail] = useState(initial?.thumbnail ?? "");
  const [banner, setBanner] = useState(initial?.banner ?? "");
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(","));
  const [description, setDescription] = useState(initial?.description ?? "");

  // กำหนดการ (sessions)
  const [sessions, setSessions] = useState<EventSessionInput[]>(() =>
    initial?.sessions
      ? initial.sessions.map((s) => ({
          ...s,
          startsAt: toInputDate(s.startsAt),
          endsAt: toInputDate(s.endsAt),
        }))
      : []
  );

  // การจำหน่ายบัตรและจัดส่ง
  const [buyAt, setBuyAt] = useState(toInputDate(initial?.buyAt));
  const [buyEndAt, setBuyEndAt] = useState(toInputDate(initial?.buyEndAt));
  const [minTicketQTY, setMinTicketQTY] = useState(initial?.minTicketQTY ?? 1);
  const [maxTicketQTY, setMaxTicketQTY] = useState(initial?.maxTicketQTY ?? 6);
  const [allowShipping, setAllowShipping] = useState(
    initial?.allowShipping ?? false
  );
  const [shippingFee, setShippingFee] = useState(initial?.shippingFee ?? "0.00");

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  // เมื่อผู้ใช้พิมพ์ชื่องาน ถ้ายังไม่ได้แก้ slug เอง จะ auto-generate slug ให้
  function handleTitleChange(val: string) {
    setTitle(val);
    if (!isSlugCustom) {
      setSlug(makeSlug(val));
    }
  }

  function handleSlugChange(val: string) {
    setIsSlugCustom(true);
    setSlug(val);
  }

  // จัดการรอบกิจกรรม
  function addSession() {
    setSessions([...sessions, { title: "", startsAt: "", endsAt: "" }]);
  }

  function updateSession(index: number, patch: Partial<EventSessionInput>) {
    const updated = [...sessions];
    updated[index] = { ...updated[index], ...patch };
    setSessions(updated);
  }

  function removeSession(index: number) {
    setSessions(sessions.filter((_, idx) => idx !== index));
  }

  // บันทึกข้อมูลงาน (สร้างใหม่ หรือแก้ไข)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // ตรวจสอบค่าพื้นฐาน
    if (!title.trim()) {
      toast.error("กรุณากรอกชื่องาน");
      return;
    }
    const finalSlug = (slug || makeSlug(title)).trim();
    if (!finalSlug) {
      toast.error("กรุณากรอกชื่อใน URL (slug)");
      return;
    }
    if (!venue.trim()) {
      toast.error("กรุณากรอกสถานที่จัดงาน");
      return;
    }
    if (!description.trim()) {
      toast.error("กรุณากรอกรายละเอียดงาน");
      return;
    }
    if (!buyAt || !buyEndAt) {
      toast.error("กรุณากรอกวันเปิดขายและปิดขายบัตร");
      return;
    }
    if (new Date(buyAt) >= new Date(buyEndAt)) {
      toast.error("วันปิดขายต้องอยู่หลังวันเปิดขาย");
      return;
    }
    if (minTicketQTY < 1 || maxTicketQTY < minTicketQTY) {
      toast.error("จำนวนบัตรขั้นต่ำต้องไม่เกินจำนวนบัตรสูงสุด");
      return;
    }

    setLoading(true);

    try {
      // แปลงรอบกิจกรรมเป็น ISO format
      const formattedSessions: EventSessionInput[] = sessions.map((s) => ({
        id: s.id,
        title: s.title.trim(),
        description: s.description?.trim() || null,
        startsAt: s.startsAt ? new Date(s.startsAt).toISOString() : null,
        endsAt: s.endsAt ? new Date(s.endsAt).toISOString() : null,
      }));

      // แปลงแท็กที่คั่นด้วยจุลภาคเป็น array
      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: EventInput = {
        title: title.trim(),
        slug: finalSlug,
        subTitle: subTitle.trim(),
        venue: venue.trim(),
        thumbnail: thumbnail.trim(),
        banner: banner.trim(),
        tags,
        description,
        buyAt: new Date(buyAt).toISOString(),
        buyEndAt: new Date(buyEndAt).toISOString(),
        minTicketQTY,
        maxTicketQTY,
        allowShipping,
        shippingFee: allowShipping ? shippingFee : "0.00",
        sessions: formattedSessions,
      };

      if (initial) {
        // แก้ไขงานเดิม
        const res = await api.events.update(initial.id, payload);
        if (res.success) {
          toast.success("บันทึกข้อมูลงานแล้ว");
          router.replace(`/admin/${encodeURIComponent(res.data.slug)}/settings`);
          router.refresh();
        } else {
          toast.error(res.error.message);
        }
      } else {
        // สร้างงานใหม่
        const res = await api.events.create(payload);
        if (res.success) {
          toast.success("สร้างงานเรียบร้อยแล้ว");
          router.push(`/admin/${encodeURIComponent(res.data.slug)}`);
        } else {
          toast.error(res.error.message);
        }
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  }

  // ลบงาน
  async function handleDelete() {
    if (!initial || !deleteConfirmed) return;
    setDeleting(true);

    try {
      const res = await api.events.drop(initial.id);
      if (res.success) {
        toast.success("ลบงานเรียบร้อยแล้ว");
        router.replace("/admin");
        router.refresh();
      } else {
        toast.error(res.error.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการลบงาน");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">
          บันทึกข้อมูลงาน กำหนดการ และช่วงจำหน่ายบัตร
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={loading || deleting} className="space-y-6">
          {/* ข้อมูลงาน */}
          <section className="space-y-5 rounded-xl border bg-card p-6 shadow-xs">
            <h2 className="text-lg font-semibold">ข้อมูลงาน</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="event-title" className="text-sm font-medium">
                  ชื่องาน *
                </FieldLabel>
                <Input
                  id="event-title"
                  required
                  maxLength={255}
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="ระบุชื่องาน"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="event-slug" className="text-sm font-medium">
                  ชื่อใน URL (slug) *
                </FieldLabel>
                <Input
                  id="event-slug"
                  required
                  maxLength={255}
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="เช่น indie-short-film-festival-2026"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="event-subtitle" className="text-sm font-medium">
                  คำโปรย
                </FieldLabel>
                <Input
                  id="event-subtitle"
                  maxLength={255}
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  placeholder="ระบุคำโปรยสั้นๆ ของงาน"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="event-venue" className="text-sm font-medium">
                  สถานที่ *
                </FieldLabel>
                <Input
                  id="event-venue"
                  required
                  maxLength={255}
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="ระบุสถานที่จัดงาน"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="event-thumbnail" className="text-sm font-medium">
                  URL รูปขนาดย่อ
                </FieldLabel>
                <Input
                  id="event-thumbnail"
                  type="url"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="event-banner" className="text-sm font-medium">
                  URL รูปโปสเตอร์
                </FieldLabel>
                <Input
                  id="event-banner"
                  type="url"
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="event-tags" className="text-sm font-medium">
                แท็ก (คั่นด้วยเครื่องหมายจุลภาค)
              </FieldLabel>
              <Input
                id="event-tags"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="ภาพยนตร์,หนังสั้น,นักศึกษา"
              />
            </Field>

            <Field>
              <FieldLabel id="event-description-label" className="text-sm font-medium">
                รายละเอียดงาน *
              </FieldLabel>
              <div aria-labelledby="event-description-label">
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="พิมพ์รายละเอียดงานที่นี่..."
                />
              </div>
            </Field>
          </section>

          {/* กำหนดการ */}
          <section className="space-y-4 rounded-xl border bg-card p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">กำหนดการ</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  วันเวลาแสดงตามเวลาของเครื่องที่คุณใช้งาน
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="min-h-10 cursor-pointer"
                onClick={addSession}
              >
                เพิ่มรอบกิจกรรม
              </Button>
            </div>

            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                ยังไม่มีกำหนดการ สามารถเพิ่มภายหลังได้
              </p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session, index) => (
                  <div
                    key={session.id ?? `new-${index}`}
                    className="rounded-xl border bg-background p-4 space-y-4"
                  >
                    <Field>
                      <FieldLabel
                        htmlFor={`session-title-${index}`}
                        className="text-sm font-medium"
                      >
                        ชื่อรอบ *
                      </FieldLabel>
                      <Input
                        id={`session-title-${index}`}
                        required
                        maxLength={255}
                        value={session.title}
                        onChange={(e) =>
                          updateSession(index, { title: e.target.value })
                        }
                        placeholder="เปิดลงทะเบียน"
                      />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel
                          htmlFor={`session-startsAt-${index}`}
                          className="text-sm font-medium"
                        >
                          เริ่ม
                        </FieldLabel>
                        <Input
                          id={`session-startsAt-${index}`}
                          type="datetime-local"
                          value={session.startsAt || ""}
                          onChange={(e) =>
                            updateSession(index, { startsAt: e.target.value })
                          }
                        />
                      </Field>

                      <Field>
                        <FieldLabel
                          htmlFor={`session-endsAt-${index}`}
                          className="text-sm font-medium"
                        >
                          สิ้นสุด
                        </FieldLabel>
                        <Input
                          id={`session-endsAt-${index}`}
                          type="datetime-local"
                          value={session.endsAt || ""}
                          onChange={(e) =>
                            updateSession(index, { endsAt: e.target.value })
                          }
                        />
                      </Field>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-foreground/80 hover:text-foreground cursor-pointer"
                      onClick={() => removeSession(index)}
                    >
                      นำรอบนี้ออก
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* การจำหน่ายบัตรและจัดส่ง */}
          <section className="space-y-4 rounded-xl border bg-card p-6 shadow-xs">
            <h2 className="text-lg font-semibold">การจำหน่ายบัตรและจัดส่ง</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="event-buyAt" className="text-sm font-medium">
                  เปิดขาย *
                </FieldLabel>
                <Input
                  id="event-buyAt"
                  type="datetime-local"
                  required
                  value={buyAt}
                  onChange={(e) => setBuyAt(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="event-buyEndAt" className="text-sm font-medium">
                  ปิดขาย *
                </FieldLabel>
                <Input
                  id="event-buyEndAt"
                  type="datetime-local"
                  required
                  value={buyEndAt}
                  onChange={(e) => setBuyEndAt(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="event-minTicketQTY"
                  className="text-sm font-medium"
                >
                  บัตรขั้นต่ำต่อคำสั่งซื้อ
                </FieldLabel>
                <Input
                  id="event-minTicketQTY"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={minTicketQTY}
                  onChange={(e) => setMinTicketQTY(Number(e.target.value))}
                />
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="event-maxTicketQTY"
                  className="text-sm font-medium"
                >
                  บัตรสูงสุดต่อคำสั่งซื้อ
                </FieldLabel>
                <Input
                  id="event-maxTicketQTY"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={maxTicketQTY}
                  onChange={(e) => setMaxTicketQTY(Number(e.target.value))}
                />
              </Field>
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <Checkbox
                  checked={allowShipping}
                  onCheckedChange={(checked) =>
                    setAllowShipping(checked === true)
                  }
                />
                <span>เปิดจัดส่งของที่ระลึก</span>
              </label>

              {allowShipping && (
                <Field className="max-w-xs">
                  <FieldLabel htmlFor="shipping-fee" className="text-sm font-medium">
                    ค่าจัดส่ง (บาท)
                  </FieldLabel>
                  <Input
                    id="shipping-fee"
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                  />
                </Field>
              )}

              <p className="text-sm text-muted-foreground">
                การรับเงินใช้พร้อมเพย์ส่วนกลางของระบบ อัตรา Token ของระบบคงที่ 1
                บาทต่อ 1 Token
              </p>
            </div>
          </section>

          {/* ปุ่ม Submit */}
          <div>
            <Button
              type="submit"
              variant="brand"
              className="min-h-11 px-6 text-on-brand font-medium cursor-pointer"
              disabled={loading}
            >
              {loading ? "กำลังบันทึก..." : initial ? "บันทึกงาน" : "สร้างงาน"}
            </Button>
          </div>
        </fieldset>
      </form>

      {/* ลบงาน */}
      {initial && canDelete && (
        <section className="space-y-3 rounded-xl border border-destructive/20 bg-card p-6 shadow-xs">
          <h2 className="text-lg font-semibold text-destructive">ลบงาน</h2>
          <p className="text-sm text-muted-foreground">
            ลบได้เฉพาะงานที่ยังไม่มีคำสั่งซื้อหรือร้านค้า
            การลบไม่สามารถย้อนกลับได้
          </p>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox
              checked={deleteConfirmed}
              onCheckedChange={(checked) =>
                setDeleteConfirmed(checked === true)
              }
            />
            <span>ยืนยันว่าต้องการลบงานนี้</span>
          </label>
          <div>
            <Button
              type="button"
              variant="destructive"
              disabled={!deleteConfirmed || loading || deleting}
              onClick={handleDelete}
              className={cn(
                "min-h-10 cursor-pointer",
                !deleteConfirmed &&
                  "bg-destructive/10 text-destructive/60 hover:bg-destructive/10 cursor-not-allowed border-none shadow-none"
              )}
            >
              {deleting ? "กำลังลบ..." : "ลบงาน"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
