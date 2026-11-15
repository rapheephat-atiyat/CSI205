"use client";

// import icon
import { Clock2Icon } from "lucide-react";

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
import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function formatDate(d?: Date) {
  if (!d) return "";
  return d.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function EventDetailForm() {
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
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [eventTimeFrom, setEventTimeFrom] = useState("00:00");
  const [eventTimeTo, setEventTimeTo] = useState("00:00");

  // draft in dialog b4 submit
  const [draftDate, setDraftDate] = useState<Date | undefined>(undefined);
  const [draftEventTimeFrom, setDraftEventTimeFrom] = useState("00:00");
  const [draftEventTimeTo, setDraftEventTimeTo] = useState("00:00");

  useEffect(() => {
    setDraftDate((date) => date ?? new Date());
  }, []);

  useEffect(() => {
    console.log(`Date=> ${date}
      eventTimeFrom=> ${eventTimeFrom}
      eventTimeTo=> ${eventTimeTo}`);
  }, [date, eventTimeFrom, eventTimeTo]);

  return (
    <div className="p-4 mx-auto w-full flex flex-col items-center justify-start">
      {/* Breadcrumbs */}
      <div className="w-full flex items-center justify-start">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">ภาพรวมงาน</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/settings/event">
                จัดการงงาน
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>สร้างงาน</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* container */}
      <div className="p-4 mx-auto w-full max-w-7xl flex flex-col items-start justify-center gap-4">
        {/* หัวเรื่อง */}
        <div className="flex flex-col items-start justify-center">
          <div className="text-[24px] font-semibold text-black">
            สร้างงานใหม่
          </div>
          <div className="text-[14px] font-medium text-muted-foreground">
            ระบุข้อมูลหลักของงาน
          </div>
        </div>

        {/* ข้อมูลงาน */}
        <form className="w-full">
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
                  <FieldGroup>
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
                    <Field>
                      <FieldLabel
                        htmlFor="event-description"
                        className="text-[16px]"
                      >
                        รายละเอียดงาน *
                      </FieldLabel>
                      <Input
                        id="event-description"
                        type="text"
                        placeholder="รายละเอียดเกี่ยวกับงาน"
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="py-3 w-full h-auto font-light"
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
                        <DialogTrigger asChild onClick={() => setOpen(true)}>
                          <Input
                            id="event-date"
                            type="text"
                            readOnly
                            placeholder={"dd / mm / year"}
                            value={formatDate(date)}
                            className="py-3 w-full h-auto font-light cursor-pointer"
                          />
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-sm">
                          <DialogHeader>
                            <DialogTitle>เลือกวันและเวลาจัดงาน</DialogTitle>
                            <DialogDescription>
                              เลือกวันที่ แล้วกำหนดเวลาเริ่ม–สิ้นสุด
                            </DialogDescription>
                          </DialogHeader>

                          <Card size="sm" className="mx-auto w-fit">
                            <CardContent>
                              <Calendar
                                mode="single"
                                selected={draftDate}
                                onSelect={setDraftDate}
                                className="p-0"
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
                                setDate(draftDate);
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
                    {/* อีเมลติดต่อผู้จัดงาน */}
                    <Field>
                      <FieldLabel htmlFor="event-email" className="text-[16px]">
                        อีเมลติดต่อผู้จัดงาน *
                      </FieldLabel>
                      <Input
                        id="event-email"
                        type="email"
                        placeholder="event@gmail.com"
                        required
                        className="py-3 w-full h-auto font-light"
                      />
                    </Field>
                    {/* ช่วงขายบัตร */}
                    {/* เปิดขายบัตร */}
                    <Field>
                      <FieldLabel
                        htmlFor="event-buy-end-at"
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
          {/* บัญชีเจ้าของงาน */}
          <div className="w-full flex flex-col">
            <Badge
              variant={"outline"}
              className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-3.5"
            >
              {/* หัวเรื่อง */}
              <div className="w-full flex flex-col items-start justify-center gap-1">
                <div className="text-lg font-semibold text-black">
                  บัญชีรับเงินของเจ้าของงาน
                </div>
                <div className="text-sm text-muted-foreground text-wrap">
                  บัญชีเจ้าของงานสำหรับรับชำระเงินและตรวจสอบยอดโอน
                </div>
              </div>

              {/* form bank account */}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="bank-account" className="text-[16px]">
                    เลขที่บัญชีรับเงิน *
                  </FieldLabel>
                  <Input
                    id="bank-account"
                    placeholder="กรอกเลขที่บัญชีรับเงินของเจ้าของงาน"
                    className="py-3 w-full h-auto font-light"
                    required
                  />
                  <FieldDescription className="text-wrap">
                    ใช้เฉพาะเลขบัญชีจริงของเจ้าของงาน
                    หรือเลขบัญชีที่เจ้าของงานอนุญาตเท่านั้น
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel
                    htmlFor="bank-account-name"
                    className="text-[16px]"
                  >
                    ชื่อบัญชี *
                  </FieldLabel>
                  <Input
                    id="bank-account-name"
                    placeholder="กรอกชื่อบัญชีตามที่ธนาคารระบุ"
                    className="py-3 w-full h-auto font-light"
                    required
                  />
                  <FieldDescription className="text-wrap">
                    ใช้ชื่อบัญชีจริงที่ปรากฏในสมุดบัญชีธนาคาร
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </Badge>
          </div>
          {/* token */}
          <div className="w-full flex flex-col">
            <Badge
              variant={"outline"}
              className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-3.5"
            >
              {/* หัวเรื่อง */}
              <div className="w-full flex flex-col items-start justify-center gap-1">
                <div className="text-lg font-semibold text-black">
                  ตั้งค่าอัตราแลกเปลี่ยน Token
                </div>
                <div className="text-sm text-muted-foreground text-wrap">
                  กำหนดอัตราเงินบาทต่อ Token สำหรับการเติมหน้างาน
                </div>
              </div>

              {/* taken rate */}
              <div className="w-full flex flex-col items-start justify-center">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="token-rate" className="text-[16px]">
                      จำนวนเงินบาทต่อ 1 Token *
                    </FieldLabel>
                    <Input
                      id="token-rate"
                      placeholder="1"
                      type="number"
                      min="1"
                      required
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="py-3 w-full h-auto font-light"
                    />
                    <FieldDescription className="text-wrap">
                      หน่วย: บาท / Token ระบุเป็นค่ามากกว่า 0
                    </FieldDescription>
                  </Field>
                  <Badge
                    variant={"outline"}
                    className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-3.5"
                  >
                    <div className="flex flex-col items-start justify-center gap-1.5">
                      <div className="text-lg font-semibold">
                        1 Token = {token} บาท
                      </div>
                    </div>
                    <div className="w-full border border-b-muted-foreground"></div>
                    <div className="flex flex-col items-start justify-center gap-1.5">
                      <div className="text-lg font-semibold">
                        300 บาท ÷ {token} = {300 / Number(token)} Token
                      </div>
                    </div>
                  </Badge>
                </FieldGroup>
              </div>
            </Badge>

            <div className="w-full mt-4 flex flex-col">
              <Button type="submit" variant={"brand"} className="p-3 flex-1">
                สร้างงาน
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
