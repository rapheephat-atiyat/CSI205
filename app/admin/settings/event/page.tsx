"use client";
// import * as React from "react";

// import icon
import { CircleCheck, Clock2Icon, Save } from "lucide-react";

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

function formatThaiDate(d?: Date) {
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd} / ${mm} / ${d.getFullYear() + 543}`;
}

export default function Page() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("00:00");

  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | undefined>(undefined);
  const [draftStart, setDraftStart] = useState("00:00");
  const [draftEnd, setDraftEnd] = useState("00:00");

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraftDate(date ?? new Date());
      setDraftDate(date);
      setDraftStart(startTime);
      setDraftEnd(endTime);
    }
    setOpen(next);
  };

  const handleConfirmDateTime = () => {
    setDate(draftDate);
    setStartTime(draftStart);
    setEndTime(draftEnd);
    setOpen(false);
  };

  useEffect(() => {
    setDate((date) => date ?? new Date());
  }, []);

  return (
    // container
    <div className="p-4 mx-auto w-full max-w-7xl flex flex-col items-start justify-center gap-4">
      {/* หัวเรื่อง */}
      <div className="flex flex-col items-start justify-center">
        <div className="text-[24px] font-semibold text-black">ตั้งค่างาน</div>
        <div className="text-[14px] font-medium text-muted-foreground">
          ข้อมูลหลักของงาน
        </div>
      </div>

      {/* status event */}
      <div className="w-full flex flex-col">
        {/* status */}
        <Badge
          variant={"outline"}
          className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-3.5"
        >
          <Badge className="p-1 flex items-center justify-center rounded-[6px] gap-1 bg-[#F0FDF4] text-[#166534]">
            <CircleCheck />
            <div className="text-[12px]">เปิดลงทะเบียน</div>
          </Badge>

          {/* Event name */}
          <div className="w-full flex flex-col items-start justify-center gap-1">
            <div className="text-[24px] font-semibold text-black">
              คืนสู่เหย้า 2569
            </div>
            <div className="text-[13px] text-muted-foreground text-wrap">
              28 พฤศจิกายน 2569 เวลา 16:00–22:00 น. ณ หอประชุมศิษย์เก่า
            </div>
          </div>
        </Badge>
      </div>

      {/* แก้ไขข้อมูลงาน */}
      <div className="w-full flex flex-col">
        <Badge
          variant={"outline"}
          className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-3.5"
        >
          {/* หัวเรื่อง */}
          <div className="w-full flex flex-col items-start justify-center gap-1">
            <div className="text-lg font-semibold text-black">
              แก้ไขข้อมูลงาน
            </div>
            <div className="text-sm text-muted-foreground text-wrap">
              กรอกข้อมูลจำเป็นให้ครบก่อนบันทึก
            </div>
          </div>

          {/* form */}
          <div className="w-full flex flex-col items-start justify-center">
            <form className="w-full max-w-sm">
              <FieldGroup>
                {/* ชื่องาน */}
                <Field>
                  <FieldLabel htmlFor="form-name" className="text-[16px]">
                    ชื่องาน *
                  </FieldLabel>
                  <Input
                    id="form-name"
                    type="text"
                    placeholder="กรุณาใส่ชื่องาน"
                    required
                    className="py-3 w-full h-auto font-light"
                  />
                </Field>

                {/* วันที่จัดงาน (กดแล้วเปิด dialog เลือกวันที่/เวลา) */}
                <Field>
                  <FieldLabel htmlFor="form-date" className="text-[16px]">
                    วันที่จัดงาน *
                  </FieldLabel>
                  <Dialog open={open} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                      <Input
                        id="form-date"
                        type="text"
                        readOnly
                        value={formatThaiDate(date)}
                        placeholder={"mm / dd / year"}
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
                                  value={draftStart}
                                  onChange={(e) =>
                                    setDraftStart(e.target.value)
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
                                  value={draftEnd}
                                  onChange={(e) => setDraftEnd(e.target.value)}
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
                        <Button type="button" onClick={handleConfirmDateTime}>
                          ตกลง
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </Field>

                {/* ระยะเวลาของงาน */}
                <Field>
                  <FieldLabel htmlFor="form-time" className="text-[16px]">
                    เวลาเริ่ม–สิ้นสุด *
                  </FieldLabel>
                  <Input
                    id="form-time"
                    type="text"
                    readOnly
                    value={`${startTime} – ${endTime} น.`}
                    placeholder="16:00 – 22:00 น."
                    className="py-3 w-full h-auto font-light"
                  />
                </Field>

                {/* สถานที่ */}
                <Field>
                  <FieldLabel htmlFor="form-location" className="text-[16px]">
                    สถานที่ *
                  </FieldLabel>
                  <Input
                    id="form-location"
                    type="text"
                    placeholder="หอประชุมศิษย์เก่า มหาวิทยาลัย"
                    required
                    className="py-3 w-full h-auto font-light"
                  />
                </Field>

                {/* รายละเอียดงาน */}
                <Field>
                  <FieldLabel
                    htmlFor="form-description"
                    className="text-[16px]"
                  >
                    รายละเอียดงาน *
                  </FieldLabel>
                  <Input
                    id="form-description"
                    type="text"
                    placeholder="รายละเอียดเกี่ยวกับงาน"
                    required
                    className="py-3 w-full h-auto font-light"
                  />
                </Field>

                {/* เปิดลงทะเบียน */}
                <Field>
                  <FieldLabel htmlFor="form-reg-open" className="text-[16px]">
                    เปิดลงทะเบียน *
                  </FieldLabel>
                  <Input
                    id="form-reg-open"
                    type="text"
                    placeholder="1 กันยายน 2569 เวลา 09:00 น."
                    required
                    className="py-3 w-full h-auto font-light"
                  />
                </Field>

                {/* สิ้นสุดลงทะเบียน */}
                <Field>
                  <FieldLabel htmlFor="form-reg-close" className="text-[16px]">
                    สิ้นสุดลงทะเบียน *
                  </FieldLabel>
                  <Input
                    id="form-reg-close"
                    type="text"
                    placeholder="28 พฤศจิกายน 2569 เวลา 20:00 น."
                    required
                    className="py-3 w-full h-auto font-light"
                  />
                </Field>

                {/* อีเมลติดต่อผู้จัดงาน */}
                <Field>
                  <FieldLabel htmlFor="form-email" className="text-[16px]">
                    อีเมลติดต่อผู้จัดงาน *
                  </FieldLabel>
                  <Input
                    id="form-email"
                    type="email"
                    placeholder="tuatua@gmail.com"
                    required
                    className="py-3 w-full h-auto font-light"
                  />
                </Field>

                <Field
                  orientation="horizontal"
                  className="w-full flex flex-row items-center justify-between"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="p-3 flex-1 h-auto"
                  >
                    ยกเลิกการแก้ไข
                  </Button>
                  <Button
                    type="submit"
                    className="p-3 flex-1 items-center justify-center h-auto bg-brand"
                  >
                    <Save />
                    บันทึกการเปลี่ยนแปลง
                  </Button>
                </Field>
              </FieldGroup>
            </form>
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
              <FieldLabel htmlFor="fieldgroup-name" className="text-[16px]">
                เลขที่บัญชีรับเงิน *
              </FieldLabel>
              <Input
                id="fieldgroup-name"
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
              <FieldLabel htmlFor="fieldgroup-email" className="text-[16px]">
                ชื่อบัญชี *
              </FieldLabel>
              <Input
                id="fieldgroup-email"
                placeholder="กรอกชื่อบัญชีตามที่ธนาคารระบุ"
                className="py-3 w-full h-auto font-light"
                required
              />
              <FieldDescription className="text-wrap">
                ใช้ชื่อบัญชีจริงที่ปรากฏในสมุดบัญชีธนาคาร
              </FieldDescription>
            </Field>
            <Field
              orientation="horizontal"
              className="w-full flex flex-row items-center justify-between"
            >
              <Button
                type="button"
                variant="outline"
                className="p-3 flex-1 h-auto"
              >
                ยกเลิกการแก้ไข
              </Button>
              <Button
                type="submit"
                className="p-3 flex-1 items-center justify-center h-auto bg-brand"
              >
                <Save />
                บันทึกบัญชีรับเงิน
              </Button>
            </Field>
          </FieldGroup>
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
              ตั้งค่าอัตราแลกเปลี่ยน Token
            </div>
            <div className="text-sm text-muted-foreground text-wrap">
              กำหนดอัตราเงินบาทต่อ Token สำหรับการเติมหน้างาน
            </div>
          </div>

          {/* badge */}
          <Badge
            variant={"outline"}
            className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-3.5"
          >
            <Badge className="p-1 flex items-center justify-center rounded-[6px] gap-1 bg-[#F0FDF4] text-[#166534]">
              <CircleCheck />
              <div className="text-[12px]">อัตราที่ใช้อยู่</div>
            </Badge>
            <div className="flex flex-col items-start justify-center gap-1.5">
              <div className="text-lg font-semibold">1 Token = 10 บาท</div>
              <div className="text-sm text-muted-foreground font-light text-wrap">
                ใช้ในตัวอย่างทุกหน้างาน
              </div>
            </div>
            <div className="w-full border border-b-muted-foreground"></div>
            <div className="flex flex-col items-start justify-center gap-1.5">
              <div className="text-lg font-semibold">
                300 บาท ÷ 10 = 30 Token
              </div>
              <div className="text-sm text-muted-foreground font-light text-wrap">
                ผู้ดูแลตรวจเงินและหลักฐานก่อนเติมทุกครั้ง
              </div>
            </div>
          </Badge>
          <div className="w-full flex flex-col items-start justify-center">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="fieldgroup-name" className="text-[16px]">
                  จำนวนเงินบาทต่อ 1 Token *
                </FieldLabel>
                <Input
                  id="fieldgroup-name"
                  placeholder="12"
                  className="py-3 w-full h-auto font-light"
                  required
                />
                <FieldDescription className="text-wrap">
                  หน่วย: บาท / Token ระบุเป็นค่ามากกว่า 0
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="fieldgroup-name" className="text-[16px]">
                  เหตุผลในการเปลี่ยน *
                </FieldLabel>
                <Input
                  id="fieldgroup-name"
                  placeholder=""
                  className="py-3 h-auto w-full font-light"
                  required
                />
              </Field>
            </FieldGroup>
          </div>

          <div className="w-full flex flex-col items-start justify-center">
            <Badge
              variant={"outline"}
              className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-3.5"
            >
              {/* หัวเรื่อง */}
              <div className="w-full flex flex-col items-start justify-center gap-1">
                <div className="text-lg font-semibold text-black">
                  เปรียบเทียบก่อนบันทึก
                </div>
              </div>
              {/* t */}
              <div className="w-full flex flex-row items-start justify-center gap-1.5">
                <div className="w-full flex flex-col items-center justify-between gap-1.5">
                  <div className="w-full flex items-center justify-between">
                    <div className="text-sm text-muted-foreground font-light">
                      อัตราเดิม
                    </div>
                    <div className="text-[16px] font-semibold  text-wrap">
                      1 Token = 10 บาท
                    </div>
                  </div>
                  <div className="w-full flex items-center justify-between">
                    <div className="text-sm text-muted-foreground font-light">
                      อัตราที่เสนอ
                    </div>
                    <div className="text-[16px] font-semibold  text-wrap">
                      1 Token = 12 บาท
                    </div>
                  </div>
                </div>
              </div>
              {/* line */}
              <div className="w-full border border-b-muted-foreground"></div>
              {/* b */}
              <div className="w-full flex flex-col items-start justify-center gap-1.5">
                <div className="w-full flex flex-col items-center justify-between gap-1.5">
                  <div className="w-full flex items-center justify-between">
                    <div className="text-sm text-muted-foreground font-light">
                      รับ 300 บาท / อัตราปัจจุบัน
                    </div>
                    <div className="text-[16px] font-semibold  text-wrap">
                      30 Token
                    </div>
                  </div>
                  <div className="w-full flex items-center justify-between">
                    <div className="text-sm text-muted-foreground font-light">
                      รับ 300 บาท / อัตราที่เสนอ
                    </div>
                    <div className="text-[16px] font-semibold  text-wrap">
                      25 Token
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full flex flex-col items-center justify-center">
                <Field
                  orientation="horizontal"
                  className="w-full flex flex-row items-center justify-between"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="p-3 flex-1 h-auto"
                  >
                    ยกเลิกการแก้ไข
                  </Button>
                  <Button
                    type="submit"
                    className="p-3 flex-1 items-center justify-center h-auto bg-brand"
                  >
                    <Save />
                    บันทึกบัญชีรับเงิน
                  </Button>
                </Field>
              </div>
            </Badge>
          </div>
        </Badge>
      </div>
    </div>
  );
}
