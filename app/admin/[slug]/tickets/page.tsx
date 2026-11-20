"use client";

import { MAX_TICKET_TOKEN_REWARD } from "@/lib/token-pricing";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminAccess } from "@/components/admin/AdminAccess";
import { AdminFeedback, apiData } from "@/components/admin/AdminFeedback";
import { SouvenirPhoto } from "@/components/book/SouvenirPhoto";

// import icons
import { ClipboardCheck, Pencil, Plus, Trash2 } from "lucide-react";

// import ui
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { api } from "@/lib/api-client";
import type {
  EventSouvenirInput,
  EventSouvenirItem,
  EventTicketInput,
  EventTicketItem,
} from "@/lib/api-types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  const { eventId, eventTitle, slug } = useAdminAccess();

  const [tickets, setTickets] = useState<EventTicketItem[]>([]);
  const [souvenirs, setSouvenirs] = useState<EventSouvenirItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  function reload() {
    setLoading(true);
    setError(null);
    setRevision((value) => value + 1);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.events.tickets.list(eventId).then(apiData),
      api.events.souvenirs.list(eventId).then(apiData),
    ]).then(([ticketData, souvenirData]) => {
      if (cancelled) return;
      setTickets(ticketData);
      setSouvenirs(souvenirData);
      setError(null);
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : "โหลดข้อมูลบัตรไม่สำเร็จ");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [eventId, revision]);

  // ---------- ticket ---------- //
  const [ticketOpen, setTicketOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<EventTicketItem | null>(
    null,
  );
  const [tName, setTName] = useState("");
  const [tPrice, setTPrice] = useState("");
  const [tQuota, setTQuota] = useState("");
  const [tTokenReward, setTTokenReward] = useState("0");
  const [tActive, setTActive] = useState(true);

  function openTicket(ticket?: EventTicketItem) {
    setEditingTicket(ticket ?? null);
    setTName(ticket?.name ?? "");
    setTPrice(ticket ? String(Number(ticket.price)) : "");
    setTQuota(ticket ? String(ticket.quota) : "");
    setTTokenReward(String(ticket?.tokenReward ?? 0));
    setTActive(ticket?.isActive ?? true);
    setTicketOpen(true);
  }

  async function handleSaveTicket(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input: EventTicketInput = {
      name: tName.trim(),
      price: Number(tPrice).toFixed(2),
      quota: Number(tQuota),
      tokenReward: Number(tTokenReward),
      isActive: tActive,
    };

    const res = editingTicket
      ? await api.events.tickets.update(eventId, editingTicket.id, input)
      : await api.events.tickets.create(eventId, input);

    if (!res.success) return toast.error(res.error.message);
    setTicketOpen(false);
    toast.success(editingTicket ? "บันทึกบัตรสำเร็จ" : "เพิ่มบัตรสำเร็จ", {
      position: "top-center",
      className: "text-green-800!",
    });
    reload();
  }

  async function handleDeleteTicket(ticket: EventTicketItem) {
    const res = await api.events.tickets.drop(eventId, ticket.id);
    if (!res.success) return toast.error(res.error.message);
    toast.success("ลบสำเร็จ", {
      position: "top-center",
      className: "text-green-800!",
    });
    reload();
  }

  // ---------- souvenir ---------- //
  const [souvenirOpen, setSouvenirOpen] = useState(false);
  const [editingSouvenir, setEditingSouvenir] =
    useState<EventSouvenirItem | null>(null);
  const [sName, setSName] = useState("");
  const [sImage, setSImage] = useState("");
  const [sSizes, setSSizes] = useState("");
  const [sExtraPrice, setSExtraPrice] = useState("");
  const [sAllowDecline, setSAllowDecline] = useState(true);
  const [sAllTypes, setSAllTypes] = useState(true);
  const [sEligible, setSEligible] = useState<string[]>([]);

  function openSouvenir(souvenir?: EventSouvenirItem) {
    setEditingSouvenir(souvenir ?? null);
    setSName(souvenir?.name ?? "");
    setSImage(souvenir?.image ?? "");
    setSSizes((souvenir?.sizes ?? []).join(", "));
    setSExtraPrice(
      souvenir?.extraPrice ? String(Number(souvenir.extraPrice)) : "",
    );
    setSAllowDecline(souvenir?.allowDecline ?? true);
    setSAllTypes(souvenir?.allTicketTypes ?? true);
    setSEligible(souvenir?.eligibleTicketTypeIds ?? []);
    setSouvenirOpen(true);
  }

  function toggleEligible(id: string) {
    setSEligible((pre) =>
      pre.includes(id) ? pre.filter((x) => x !== id) : [...pre, id],
    );
  }

  async function handleSaveSouvenir(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sAllTypes && sEligible.length === 0)
      return toast.error("กรุณาเลือกประเภทบัตรที่รับได้อย่างน้อย 1 ประเภท");

    const input: EventSouvenirInput = {
      name: sName.trim(),
      image: editingSouvenir && sImage === (editingSouvenir.image ?? "")
        ? undefined
        : sImage.trim() || null,
      sizes: sSizes
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
      extraPrice: sExtraPrice.trim() ? Number(sExtraPrice).toFixed(2) : null,
      allowDecline: sAllowDecline,
      allTicketTypes: sAllTypes,
      eligibleTicketTypeIds: sAllTypes ? [] : sEligible,
    };

    const res = editingSouvenir
      ? await api.events.souvenirs.update(eventId, editingSouvenir.id, input)
      : await api.events.souvenirs.create(eventId, input);

    if (!res.success) return toast.error(res.error.message);
    setSouvenirOpen(false);
    toast.success(editingSouvenir ? "บันทึกของที่ระลึกสำเร็จ" : "เพิ่มของที่ระลึกสำเร็จ", {
      position: "top-center",
      className: "text-green-800!",
    });
    reload();
  }

  async function handleDeleteSouvenir(souvenir: EventSouvenirItem) {
    const res = await api.events.souvenirs.drop(eventId, souvenir.id);
    if (!res.success) return toast.error(res.error.message);
    reload();
    toast.success("ลบสำเร็จ", {
      position: "top-center",
      className: "text-green-800!",
    });
  }

  // ---------- UI ---------- //
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

          {/* การ์ดสรุป 2 ใบ */}
          <div className="w-full flex flex-col items-center justify-center gap-4">
            <Skeleton className="h-140 w-full rounded-[10px] bg-on-brand" />
            <Skeleton className="h-140 w-full rounded-[10px] bg-on-brand" />
          </div>
        </div>
      </div>
    );
  if (error) return <div className="p-4"><AdminFeedback loading={false} error={error} retry={reload} /></div>;

  return (
    <div className="p-4 w-full flex mx-auto flex-col items-start justify-center">
      {/* Breadcrumbs */}
      <div className="w-full flex items-center justify-start">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/admin/${slug}`}>
                {eventTitle}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>บัตรและของที่ระลึก</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="p-4 mx-auto w-full max-w-7xl flex flex-col items-start justify-center gap-4">
        {/* หัวเรื่อง */}
        <div className="flex flex-col items-start justify-center">
          <div className="text-[24px] font-semibold text-black">
            บัตรและของที่ระลึก
          </div>
          <div className="text-[14px] font-medium text-muted-foreground">
            จัดการประเภทบัตร ราคา จำนวน และของที่ระลึกของงาน
          </div>
        </div>
        <div className="w-full flex items-center justify-end">
          <Link href={`/admin/${slug}/tickets/payments`}>
            <Badge className="bg-brand text-[14px] p-4 flex items-center justify-center rounded-[10px] hover:bg-brand-hover [&>svg]:size-4! hover:cursor-pointer">
              <ClipboardCheck />
              ตรวจการชำระเงิน
            </Badge>
          </Link>
        </div>

        {/* ticket */}
        <div className="w-full flex flex-col">
          <Badge
            variant={"outline"}
            className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-3.5"
          >
            <div className="w-full flex flex-row items-center justify-between">
              <div className="text-lg font-semibold text-black">
                ระดับราคาบัตรเข้างาน
              </div>
              <Badge
                onClick={() => openTicket()}
                variant={"outline"}
                className="w-fit text-[14px] p-4 flex items-center justify-center border border-brand rounded-[10px] text-brand hover:bg-brand-hover hover:text-on-brand [&>svg]:size-4! hover:cursor-pointer"
              >
                <Plus />
                เพิ่มบัตร
              </Badge>
            </div>
            <Table>
              <TableCaption>ระดับราคาบัตรเข้างาน</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ประเภทบัตร</TableHead>
                  <TableHead>ราคาบัตร</TableHead>
                  <TableHead>Token ต่อใบ</TableHead>
                  <TableHead>ขายแล้ว / จำนวน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      ยังไม่มีบัตร
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>{ticket.name}</TableCell>
                      <TableCell>
                        {Number(ticket.price).toLocaleString("th-TH")} บาท
                      </TableCell>
                      <TableCell className="tabular-nums">{ticket.tokenReward.toLocaleString("th-TH")}</TableCell>
                      <TableCell>
                        {ticket.sold} / {ticket.quota}
                      </TableCell>
                      <TableCell>
                        {ticket.isActive ? "เปิดขาย" : "ปิดขาย"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Badge
                            onClick={() => openTicket(ticket)}
                            variant={"outline"}
                            className="w-fit text-[14px] p-4 flex items-center justify-center rounded-[10px] hover:bg-brand-hover hover:text-on-brand [&>svg]:size-4! hover:cursor-pointer"
                          >
                            <Pencil />
                            แก้ไข
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="ลบบัตร"
                            className="cursor-pointer hover:text-brand hover:bg-brand/10"
                            onClick={() => handleDeleteTicket(ticket)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Badge>
        </div>

        {/* souvenir */}
        <div className="w-full flex flex-col">
          <Badge
            variant={"outline"}
            className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-3.5"
          >
            <div className="w-full flex flex-row items-center justify-between">
              <div className="text-lg font-semibold text-black">
                ของที่ระลึก
              </div>
              <Badge
                onClick={() => openSouvenir()}
                variant={"outline"}
                className="w-fit text-[14px] p-4 flex items-center justify-center border border-brand rounded-[10px] text-brand hover:bg-brand-hover hover:text-on-brand [&>svg]:size-4! hover:cursor-pointer"
              >
                <Plus />
                เพิ่มของที่ระลึก
              </Badge>
            </div>
            <Table>
              <TableCaption>รายการของที่ระลึก</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>ไซซ์</TableHead>
                  <TableHead>ราคาซื้อเพิ่ม</TableHead>
                  <TableHead>บัตรที่รับได้</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {souvenirs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      ยังไม่มีของที่ระลึก
                    </TableCell>
                  </TableRow>
                ) : (
                  souvenirs.map((souvenir) => (
                    <TableRow key={souvenir.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <SouvenirPhoto image={souvenir.image} sizes="48px" className="size-12" />
                          <span>{souvenir.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {souvenir.sizes.length
                          ? souvenir.sizes.join(", ")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {souvenir.extraPrice
                          ? `${Number(souvenir.extraPrice).toLocaleString("th-TH")} บาท`
                          : "ไม่เปิดขายเพิ่ม"}
                      </TableCell>
                      <TableCell>
                        {souvenir.allTicketTypes
                          ? "ทุกประเภท"
                          : tickets
                              .filter((t) =>
                                souvenir.eligibleTicketTypeIds.includes(t.id),
                              )
                              .map((t) => t.name)
                              .join(", ") || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Badge
                            onClick={() => openSouvenir(souvenir)}
                            variant={"outline"}
                            className="w-fit text-[14px] p-4 flex items-center justify-center rounded-[10px] hover:bg-brand-hover hover:text-on-brand [&>svg]:size-4! hover:cursor-pointer"
                          >
                            <Pencil />
                            แก้ไข
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="ลบของที่ระลึก"
                            className="cursor-pointer hover:text-brand hover:bg-brand/10"
                            onClick={() => handleDeleteSouvenir(souvenir)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Badge>
        </div>

        {/* dialog add / edit ticket */}
        <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTicket ? "แก้ไขบัตร" : "เพิ่มบัตร"}
              </DialogTitle>
              <DialogDescription>
                {editingTicket
                  ? `แก้ไขข้อมูลของบัตร "${editingTicket.name}"`
                  : "กรอกข้อมูลบัตรใบใหม่"}
              </DialogDescription>
            </DialogHeader>

            <form className="w-full" onSubmit={handleSaveTicket}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="ticket-name">ชื่อบัตร *</FieldLabel>
                  <Input
                    id="ticket-name"
                    required
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ticket-price">
                    ราคาบัตร (บาท) *
                  </FieldLabel>
                  <Input
                    id="ticket-price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={tPrice}
                    onChange={(e) => setTPrice(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ticket-quota">
                    จำนวนบัตรทั้งหมด *
                  </FieldLabel>
                  <Input
                    id="ticket-quota"
                    type="number"
                    min={editingTicket?.sold ?? 0}
                    required
                    value={tQuota}
                    onChange={(e) => setTQuota(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ticket-token-reward">Token ที่ได้รับต่อใบ</FieldLabel>
                  <Input
                    id="ticket-token-reward"
                    type="number"
                    min={0}
                    max={MAX_TICKET_TOKEN_REWARD}
                    step={1}
                    required
                    aria-describedby="ticket-token-reward-hint"
                    value={tTokenReward}
                    onChange={(e) => setTTokenReward(e.target.value)}
                  />
                  <p id="ticket-token-reward-hint" className="text-xs text-muted-foreground">
                    ใส่ 0 สำหรับบัตรที่ไม่แจก Token อัตรานี้ใช้กับการจองใหม่
                  </p>
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={tActive}
                    onChange={(e) => setTActive(e.target.checked)}
                  />
                  เปิดขาย
                </label>
              </FieldGroup>

              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    ยกเลิก
                  </Button>
                </DialogClose>
                <Button type="submit" className="bg-brand hover:bg-brand-hover">
                  บันทึก
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* dialog add / edit souvenir */}
        <Dialog open={souvenirOpen} onOpenChange={setSouvenirOpen}>
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSouvenir ? "แก้ไขของที่ระลึก" : "เพิ่มของที่ระลึก"}
              </DialogTitle>
              <DialogDescription>
                กำหนดไซซ์ ราคาซื้อเพิ่ม และบัตรที่มีสิทธิ์รับ
              </DialogDescription>
            </DialogHeader>

            <form className="w-full" onSubmit={handleSaveSouvenir}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="souvenir-name">ชื่อ *</FieldLabel>
                  <Input
                    id="souvenir-name"
                    required
                    placeholder="เสื้อที่ระลึก"
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="souvenir-image">ลิงก์รูปของที่ระลึก</FieldLabel>
                  <Input
                    id="souvenir-image"
                    inputMode="url"
                    autoComplete="off"
                    placeholder="https://…"
                    value={sImage}
                    onChange={(e) => setSImage(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="souvenir-sizes">ไซซ์</FieldLabel>
                  <Input
                    id="souvenir-sizes"
                    placeholder="S, M, L, XL (เว้นว่างถ้าไม่มีไซซ์)"
                    value={sSizes}
                    onChange={(e) => setSSizes(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="souvenir-extra">
                    ราคาซื้อเพิ่ม (บาท)
                  </FieldLabel>
                  <Input
                    id="souvenir-extra"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="เว้นว่างถ้าไม่เปิดขายเพิ่ม"
                    value={sExtraPrice}
                    onChange={(e) => setSExtraPrice(e.target.value)}
                  />
                </Field>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={sAllowDecline}
                    onChange={(e) => setSAllowDecline(e.target.checked)}
                  />
                  ผู้จองขอไม่รับได้
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={sAllTypes}
                    onChange={(e) => setSAllTypes(e.target.checked)}
                  />
                  บัตรทุกประเภทรับได้
                </label>

                {!sAllTypes && (
                  <div className="flex flex-col gap-2 rounded-md border p-3">
                    <div className="text-sm text-muted-foreground">
                      เลือกประเภทบัตรที่รับได้
                    </div>
                    {tickets.map((ticket) => (
                      <label
                        key={ticket.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="size-4"
                          checked={sEligible.includes(ticket.id)}
                          onChange={() => toggleEligible(ticket.id)}
                        />
                        {ticket.name}
                      </label>
                    ))}
                  </div>
                )}
              </FieldGroup>

              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    ยกเลิก
                  </Button>
                </DialogClose>
                <Button type="submit" className="bg-brand hover:bg-brand-hover">
                  บันทึก
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
