"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { type DateRange } from "react-day-picker";

import { api } from "@/lib/api-client";
import { EventDetail, EventInput } from "@/lib/api-types";

// import icon
import { Clock2Icon, Save } from "lucide-react";

// import ui
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(d?: Date) {
  if (!d) return "";
  return d.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ISO -> ค่าสำหรับ datetime-local
function toLocalInput(iso?: string) {
  if (!iso) return "";
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

export default function Page() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // open dialog
  const [open, setOpen] = useState(false);

  // event
  const [title, setTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [banner, setBanner] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [venue, setVenue] = useState("");
  const [buyAt, setBuyAt] = useState("");
  const [buyEndAt, setBuyEndAt] = useState("");
  const [minTicketQTY, setMinTicketQTY] = useState("1");
  const [maxTicketQTY, setMaxTicketQTY] = useState("10");
  const [token, setToken] = useState("1");

  // date evnet
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [eventTimeFrom, setEventTimeFrom] = useState("00:00");
  const [eventTimeTo, setEventTimeTo] = useState("00:00");

  // draft in dialog b4 submit
  const [draftDate, setDraftDate] = useState<DateRange | undefined>(undefined);
  const [draftEventTimeFrom, setDraftEventTimeFrom] = useState("00:00");
  const [draftEventTimeTo, setDraftEventTimeTo] = useState("00:00");

  const [submitting, setSubmitting] = useState(false);

  // โหลดข้อมูลงาน
  useEffect(() => {
    async function load() {
      const res = await api.events.get(`${slug}`);
      if (res.success) setEvent(res.data);
      else setError(res.error.message);
      setLoading(false);
    }
    load();
  }, [slug]);

  useEffect(() => {
    if (!event) return;

    setTitle(event.title ?? "");
    setSubTitle(event.subTitle ?? "");
    setDescription(event.description ?? "");
    setThumbnail(event.thumbnail ?? "");
    setBanner(event.banner ?? "");
    setTagsText((event.tags ?? []).join(", "));
    setVenue(event.venue ?? "");
    setBuyAt(toLocalInput(event.buyAt));
    setBuyEndAt(toLocalInput(event.buyEndAt));
    setMinTicketQTY(String(event.minTicketQTY ?? 1));
    setMaxTicketQTY(String(event.maxTicketQTY ?? 10));

    const dated = (event.sessions ?? []).filter((s) => s.startsAt);
    if (dated.length) {
      const first = dated[0];
      const last = dated[dated.length - 1];
      const from = new Date(first.startsAt!);
      const to = new Date(last.endsAt ?? last.startsAt!);
      const range = { from, to };
      const tFrom = format(from, "HH:mm");
      const tTo = format(new Date(first.endsAt ?? first.startsAt!), "HH:mm");
      setDateRange(range);
      setDraftDate(range);
      setEventTimeFrom(tFrom);
      setEventTimeTo(tTo);
      setDraftEventTimeFrom(tFrom);
      setDraftEventTimeTo(tTo);
    } else {
      setDraftDate({ from: new Date(), to: addDays(new Date(), 3) });
    }
  }, [event]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!event) return;

    if (!description.trim()) return alert("กรุณากรอกรายละเอียดงาน");
    if (!dateRange?.from || !dateRange?.to)
      return alert("กรุณาเลือกวันที่จัดงาน");
    if (new Date(buyEndAt) <= new Date(buyAt))
      return alert("วันปิดขายต้องมากกว่าวันเปิดขาย");

    const minQ = Number(minTicketQTY);
    const maxQ = Number(maxTicketQTY);
    if (!(minQ >= 1) || !(maxQ >= minQ))
      return alert("จำนวนบัตรสูงสุดต้องไม่น้อยกว่าขั้นต่ำ");

    const payload: Partial<EventInput> = {
      title,
      subTitle,
      banner,
      thumbnail,
      venue,
      description,
      tags: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      buyAt: new Date(buyAt).toISOString(),
      buyEndAt: new Date(buyEndAt).toISOString(),
      minTicketQTY: minQ,
      maxTicketQTY: maxQ,
    };

    try {
      setSubmitting(true);
      await api.events.update(event.id, payload);
    } catch (err) {
      console.error(err);
      alert("บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return (
      <div className="p-4 w-full flex mx-auto flex-col items-start justify-center">
        {/* breadcrumb */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24 bg-on-brand" />
          <Skeleton className="h-4 w-4 bg-on-brand" />
          <Skeleton className="h-4 w-32 bg-on-brand" />
        </div>
        <div className="p-4 mx-auto w-full max-w-7xl flex flex-col gap-4">
          {/* หัวเรื่อง */}
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-48 bg-on-brand" />
            <Skeleton className="h-4 w-80 max-w-full bg-on-brand" />
          </div>

          {/* การ์ด 1 ใบ */}
          <div className="w-full flex flex-col items-center justify-center gap-4">
            <Skeleton className="h-240 w-full rounded-[10px] bg-on-brand" />
          </div>
        </div>
      </div>
    );
  if (error || !event) return <div className="p-4">{error ?? "ไม่พบงาน"}</div>;

  return (
    <div className="p-4 mx-auto w-full flex flex-col items-center justify-start">
      {/* Breadcrumbs */}
      <div className="w-full flex items-center justify-start">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/admin/${slug}`}>
                {event.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>ตั้งค่างาน</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* container */}
      <div className="p-4 mx-auto w-full max-w-7xl flex flex-col items-start justify-center gap-4">
        {/* หัวเรื่อง */}
        <div className="flex flex-col items-start justify-center">
          <div className="text-[24px] font-semibold text-black">ตั้งค่างาน</div>
          <div className="text-[14px] font-medium text-muted-foreground">
            แก้ไขข้อมูลหลักของงาน
          </div>
        </div>

        {/* ข้อมูลงาน */}
        <form
          className="w-full flex flex-col items-start justify-center gap-3"
          onSubmit={handleSave}
        >
          <div className="w-full flex flex-col">
            <Badge
              variant={"outline"}
              className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-3.5"
            >
              {/* หัวเรื่อง */}
              <div className="w-full flex flex-col items-start justify-center gap-1">
                <div className="text-lg font-semibold text-black">
                  ข้อมูลของงาน
                </div>
                <div className="text-sm text-muted-foreground text-wrap">
                  กรอกข้อมูลจำเป็นให้ครบก่อนบันทึก
                </div>
              </div>

              {/* form */}
              <div className="w-full flex flex-col items-start justify-center">
                <div className="w-full">
                  <FieldGroup className="w-full grid grid-cols-2 gap-4">
                    {/* ชื่องาน */}
                    <Field>
                      <FieldLabel htmlFor="event-name" className="text-[16px]">
                        ชื่องาน *
                      </FieldLabel>
                      <Input
                        id="event-name"
                        type="text"
                        placeholder="กรุณาใส่ชื่องาน"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="py-3 w-full h-auto font-light"
                      />
                    </Field>

                    {/* คำโปรย */}
                    <Field>
                      <FieldLabel
                        htmlFor="event-subtitle"
                        className="text-[16px]"
                      >
                        คำโปรย *
                      </FieldLabel>
                      <Input
                        id="event-subtitle"
                        type="text"
                        placeholder="เชียร์สุดใจ มิตรภาพในสนามหญ้า"
                        required
                        value={subTitle}
                        onChange={(e) => setSubTitle(e.target.value)}
                        className="py-3 w-full h-auto font-light"
                      />
                    </Field>

                    {/* รายละเอียดงาน */}
                    <Field className="col-span-2">
                      <FieldLabel className="text-[16px]">
                        รายละเอียดงาน *
                      </FieldLabel>
                      <RichTextEditor
                        value={description}
                        onChange={setDescription}
                      />
                    </Field>

                    {/* รูปปก */}
                    <Field>
                      <FieldLabel
                        htmlFor="event-thumbnail"
                        className="text-[16px]"
                      >
                        รูปปกงาน (URL) *
                      </FieldLabel>
                      <Input
                        id="event-thumbnail"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        required
                        value={thumbnail}
                        onChange={(e) => setThumbnail(e.target.value)}
                        className="py-3 w-full h-auto font-light"
                      />
                    </Field>

                    {/* แบนเนอร์ */}
                    <Field>
                      <FieldLabel
                        htmlFor="event-banner"
                        className="text-[16px]"
                      >
                        แบนเนอร์งาน (URL) *
                      </FieldLabel>
                      <Input
                        id="event-banner"
                        type="url"
                        placeholder="https://example.com/banner.jpg"
                        required
                        value={banner}
                        onChange={(e) => setBanner(e.target.value)}
                        className="py-3 w-full h-auto font-light"
                      />
                    </Field>

                    {/* แท็ก */}
                    <Field>
                      <FieldLabel htmlFor="event-tags" className="text-[16px]">
                        แท็ก
                      </FieldLabel>
                      <Input
                        id="event-tags"
                        type="text"
                        placeholder="กีฬา, ฟุตบอล, ศิษย์เก่า"
                        value={tagsText}
                        onChange={(e) => setTagsText(e.target.value)}
                        className="py-3 w-full h-auto font-light"
                      />
                      <FieldDescription className="text-wrap">
                        คั่นแต่ละแท็กด้วยเครื่องหมายจุลภาค (,)
                      </FieldDescription>
                    </Field>

                    {/* วันที่จัดงาน */}
                    <Field>
                      <FieldLabel htmlFor="event-date" className="text-[16px]">
                        วันที่จัดงาน *
                      </FieldLabel>
                      <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                          <Input
                            id="event-date"
                            type="text"
                            readOnly
                            placeholder={"เลือกระยะเวลาจัดงาน"}
                            value={
                              dateRange?.from
                                ? `${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`
                                : ""
                            }
                            className="py-3 w-full h-auto font-light cursor-pointer"
                          />
                        </DialogTrigger>
                        <DialogContent className="w-fit max-w-[calc(100vw-2rem)]  sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>เลือกวันและเวลาจัดงาน</DialogTitle>
                            <DialogDescription>
                              เลือกวันที่ แล้วกำหนดเวลาเริ่ม–สิ้นสุด
                            </DialogDescription>
                          </DialogHeader>

                          <Card className="mx-auto w-fit max-w-[calc(100vw-2rem)]">
                            <CardContent>
                              <Calendar
                                mode="range"
                                defaultMonth={draftDate?.from}
                                selected={draftDate}
                                onSelect={setDraftDate}
                                numberOfMonths={2}
                              />
                            </CardContent>
                            <CardFooter className="border-t bg-card">
                              <FieldGroup>
                                <Field>
                                  <FieldLabel htmlFor="dialog-time-from">
                                    เวลาเริ่ม
                                  </FieldLabel>
                                  <InputGroup>
                                    <InputGroupInput
                                      id="dialog-time-from"
                                      type="time"
                                      value={draftEventTimeFrom}
                                      onChange={(e) =>
                                        setDraftEventTimeFrom(e.target.value)
                                      }
                                      className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                    />
                                    <InputGroupAddon>
                                      <Clock2Icon className="text-muted-foreground" />
                                    </InputGroupAddon>
                                  </InputGroup>
                                </Field>
                                <Field>
                                  <FieldLabel htmlFor="dialog-time-to">
                                    เวลาสิ้นสุด
                                  </FieldLabel>
                                  <InputGroup>
                                    <InputGroupInput
                                      id="dialog-time-to"
                                      type="time"
                                      value={draftEventTimeTo}
                                      onChange={(e) =>
                                        setDraftEventTimeTo(e.target.value)
                                      }
                                      className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                    />
                                    <InputGroupAddon>
                                      <Clock2Icon className="text-muted-foreground" />
                                    </InputGroupAddon>
                                  </InputGroup>
                                </Field>
                              </FieldGroup>
                            </CardFooter>
                          </Card>

                          <DialogFooter>
                            <DialogClose asChild>
                              <Button type="button" variant="outline">
                                ยกเลิก
                              </Button>
                            </DialogClose>
                            <Button
                              type="button"
                              onClick={() => {
                                setDateRange(draftDate);
                                setEventTimeFrom(draftEventTimeFrom);
                                setEventTimeTo(draftEventTimeTo);
                                setOpen(false);
                              }}
                            >
                              ตกลง
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </Field>

                    {/* ระยะเวลาของงาน */}
                    <Field>
                      <FieldLabel htmlFor="event-time" className="text-[16px]">
                        เวลาเริ่ม–สิ้นสุด *
                      </FieldLabel>
                      <Input
                        id="event-time"
                        type="text"
                        readOnly
                        value={`${eventTimeFrom} – ${eventTimeTo} น.`}
                        placeholder="16:00 – 22:00 น."
                        className="py-3 w-full h-auto font-light"
                      />
                    </Field>

                    {/* สถานที่ */}
                    <Field>
                      <FieldLabel
                        htmlFor="event-location"
                        className="text-[16px]"
                      >
                        สถานที่ *
                      </FieldLabel>
                      <Input
                        id="event-location"
                        type="text"
                        placeholder="หอประชุมศิษย์เก่า มหาวิทยาลัย"
                        required
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        className="py-3 w-full h-auto font-light"
                      />
                    </Field>

                    {/* ช่วงขายบัตร */}
                    {/* เปิดขายบัตร */}
                    <Field>
                      <FieldLabel
                        htmlFor="event-buy-start-at"
                        className="text-[16px]"
                      >
                        วันและเวลาเปิดขายบัตร *
                      </FieldLabel>
                      <Input
                        id="event-buy-start-at"
                        type="datetime-local"
                        required
                        value={buyAt}
                        onChange={(e) => setBuyAt(e.target.value)}
                        className="py-3 w-full h-auto font-light"
                      />
                    </Field>
                    {/* ปิดขายบัตร */}
                    <Field>
                      <FieldLabel
                        htmlFor="event-buy-end-at"
                        className="text-[16px]"
                      >
                        วันและเวลาปิดขายบัตร *
                      </FieldLabel>
                      <Input
                        id="event-buy-end-at"
                        type="datetime-local"
                        required
                        value={buyEndAt}
                        onChange={(e) => setBuyEndAt(e.target.value)}
                        className="py-3 w-full h-auto font-light"
                      />
                    </Field>

                    {/* จำนวนบัตรต่อการซื้อ */}
                    <Field>
                      <FieldLabel
                        htmlFor="event-min-qty"
                        className="text-[16px]"
                      >
                        จำนวนบัตรขั้นต่ำต่อการซื้อ *
                      </FieldLabel>
                      <Input
                        id="event-min-qty"
                        type="number"
                        min="1"
                        required
                        value={minTicketQTY}
                        onChange={(e) => setMinTicketQTY(e.target.value)}
                        className="py-3 w-full h-auto font-light"
                      />
                    </Field>
                    <Field>
                      <FieldLabel
                        htmlFor="event-max-qty"
                        className="text-[16px]"
                      >
                        จำนวนบัตรสูงสุดต่อการซื้อ *
                      </FieldLabel>
                      <Input
                        id="event-max-qty"
                        type="number"
                        min="1"
                        required
                        value={maxTicketQTY}
                        onChange={(e) => setMaxTicketQTY(e.target.value)}
                        className="py-3 w-full h-auto font-light"
                      />
                    </Field>
                  </FieldGroup>
                </div>
              </div>
            </Badge>
          </div>

          <div className="w-full mt-4 flex flex-col">
            <Button
              type="submit"
              variant={"brand"}
              className="p-3 flex-1 cursor-pointer"
              disabled={submitting}
            >
              <Save />
              {submitting ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
