"use client";

import { useState } from "react";

// import icons
import { ClipboardCheck, Pencil, Plus } from "lucide-react";

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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// data
// ticket
type Ticket = {
  id: string;
  name: string;
  price: number;
  tokenPerTicket: number;
};

const initialTickets: Ticket[] = [
  {
    id: "ticket-1",
    name: "ศิษย์เก่าสัมพันธ์",
    price: 500,
    tokenPerTicket: 10,
  },
  {
    id: "ticket-2",
    name: "ศิษย์เก่าสนับสนุน",
    price: 1000,
    tokenPerTicket: 50,
  },
];

// shirt
type Shirt = {
  id: string;
  size: string;
  chest: number;
  price: number;
};

const shirts: Shirt[] = [
  {
    id: "shirt-s",
    size: "S",
    chest: 36,
    price: 300,
  },
  {
    id: "shirt-m",
    size: "M",
    chest: 38,
    price: 300,
  },
  {
    id: "shirt-l",
    size: "L",
    chest: 40,
    price: 300,
  },
  {
    id: "shirt-xl",
    size: "XL",
    chest: 42,
    price: 300,
  },
];

export default function Page() {
  // dialog add ticket
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newToken, setNewToken] = useState("");

  function openAddTicket() {
    setNewName("");
    setNewPrice("");
    setNewToken("");
    setAddOpen(true);
  }

  function handleAddTicket(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const newTicket: Ticket = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      price: Number(newPrice),
      tokenPerTicket: Number(newToken),
    };

    setTickets(() => [...tickets, newTicket]);
    setAddOpen(false);
  }

  // dialog edit
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  // initial Ticket
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);

  // form dialog edit ticket
  const [draftName, setDraftName] = useState("");
  const [draftPrice, setDraftPrice] = useState("");
  const [draftToken, setDraftToken] = useState("");

  function openEditTicket(ticket: Ticket) {
    setEditingTicket(ticket);
    setDraftName(ticket.name);
    setDraftPrice(String(ticket.price));
    setDraftToken(String(ticket.tokenPerTicket));
  }

  // save edit ticket
  function handleSaveTicket(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const price = Number(draftPrice);
    const token = Number(draftToken);

    setTickets((pre) => {
      return pre.map((ticket) => {
        if (ticket.id === editingTicket?.id) {
          return {
            ...ticket,
            name: draftName.trim(),
            price,
            tokenPerTicket: token,
          };
        }
        return ticket;
      });
    });
    setEditingTicket(null);
  }

  return (
    <div className="p-4 w-full flex mx-auto flex-col items-start justify-center">
      {/* Breadcrumbs */}
      <div className="w-full flex items-center justify-start">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">ภาพรวมงาน</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>บัตรและเสื้อ</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="p-4 mx-auto w-full max-w-7xl flex flex-col items-start justify-center gap-4">
        {/* หัวเรื่อง */}
        <div className="flex flex-col items-start justify-center">
          <div className="text-[24px] font-semibold text-black">
            บัตรและเสื้อ
          </div>
          <div className="text-[14px] font-medium text-muted-foreground">
            บัตรเข้างานประเภทเดียว เลือกระดับราคาและ Token
            ที่ได้รับตามที่ผู้ดูแลกำหนด
          </div>
        </div>
        <div className="w-full flex items-center justify-end">
          <Badge className="bg-brand text-[14px] p-4 flex items-center justify-center rounded-[10px] hover:bg-brand-hover [&>svg]:size-4! hover:cursor-pointer">
            <ClipboardCheck />
            ตรวจการชำระเงิน (24)
          </Badge>
        </div>

        {/* ticket mobile */}
        <div className="w-full flex flex-col md:hidden">
          <Badge
            variant={"outline"}
            className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-3.5"
          >
            {/* หัวเรื่อง */}
            <div className="w-full flex flex-col items-start justify-center gap-1">
              <div className="text-lg font-semibold text-black">
                ระดับราคาบัตรเข้างาน
              </div>
            </div>
            <div className="w-full flex items-center justify-end">
              <Badge
                variant={"outline"}
                className="text-[14px] p-4 flex items-center justify-center rounded-[10px] border border-brand hover:bg-brand-hover hover:text-on-brand hover:font-bold [&>svg]:size-4! transition hover:cursor-pointer"
              >
                <Plus />
                เพิ่มบัตร
              </Badge>
            </div>
            <div className="w-full flex flex-col items-start justify-center p-2 gap-3">
              {tickets.map((ticket) => {
                return (
                  <div
                    key={ticket.id}
                    className="w-full flex flex-col items-start justify-center gap-1"
                  >
                    <div className="text-[16px] font-semibold md:text-lg">
                      {ticket.name}
                    </div>
                    <div className="w-full flex items-center justify-between">
                      <div className="text-sm text-muted-foreground md:text-[16px]">
                        ราคาบัตร
                      </div>
                      <div className="text-sm md:text-[16px]">
                        {ticket.price} บาท
                      </div>
                    </div>
                    <div className="w-full flex items-center justify-between">
                      <div className="text-sm text-muted-foreground md:text-[16px]">
                        Token ที่ได้รับ
                      </div>
                      <div className="text-sm md:text-[16px]">
                        {ticket.tokenPerTicket} token / ใบ
                      </div>
                    </div>
                    <Badge
                      onClick={() => openEditTicket(ticket)}
                      variant={"outline"}
                      className="w-full text-[14px] p-4 flex items-center justify-center rounded-[10px] hover:bg-brand-hover hover:text-on-brand [&>svg]:size-4! hover:cursor-pointer"
                    >
                      <Pencil />
                      แก้ไขบัตร
                    </Badge>
                    <div className="mt-1 w-full border-b border-[#E5E5E5]"></div>
                  </div>
                );
              })}
            </div>
          </Badge>
        </div>

        {/* ticket desktop */}
        <div className="hidden w-full md:flex flex-col">
          <Badge
            variant={"outline"}
            className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-3.5"
          >
            {/* หัวเรื่อง */}
            <div className="w-full flex flex-col items-start justify-center gap-1">
              <div className="w-full flex flex-row items-center justify-between">
                <div className="text-lg font-semibold text-black">
                  ระดับราคาบัตรเข้างาน
                </div>
                <Badge
                  onClick={openAddTicket}
                  variant={"outline"}
                  className="w-fit text-[14px] p-4 flex items-center justify-center border border-brand rounded-[10px] text-brand hover:bg-brand-hover hover:text-on-brand [&>svg]:size-4! hover:cursor-pointer"
                >
                  <Plus />
                  เพิ่มบัตร
                </Badge>
              </div>
            </div>
            <Table>
              <TableCaption>ระดับราคาบัตรเข้างาน</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ประเภทบัตร</TableHead>
                  <TableHead>ราคาบัตร</TableHead>
                  <TableHead>จำนวน Token</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      ยังไม่มีบัตร
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => {
                    return (
                      <TableRow key={ticket.id}>
                        <TableCell>{ticket.name}</TableCell>
                        <TableCell>
                          {ticket.price.toLocaleString("th-TH")} บาท
                        </TableCell>
                        <TableCell>
                          {ticket.tokenPerTicket} token / ใบ
                        </TableCell>
                        <TableCell className="flex items-center justify-end">
                          <Badge
                            onClick={() => openEditTicket(ticket)}
                            variant={"outline"}
                            className="w-fit text-[14px] p-4 flex items-center justify-center rounded-[10px] hover:bg-brand-hover hover:text-on-brand [&>svg]:size-4! hover:cursor-pointer"
                          >
                            <Pencil />
                            แก้ไขบัตร
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Badge>
        </div>

        {/* dialog edit ticket */}
        <Dialog
          open={editingTicket !== null}
          onOpenChange={(next) => {
            if (!next) return setEditingTicket(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>แก้ไขบัตร</DialogTitle>
              <DialogDescription>
                แก้ไขข้อมูลของบัตร "{editingTicket?.name}"
              </DialogDescription>
            </DialogHeader>

            <form className="w-full" onSubmit={handleSaveTicket}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="ticket-name">ชื่อบัตร *</FieldLabel>
                  <Input
                    id="ticket-name"
                    type="text"
                    required
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
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
                    required
                    value={draftPrice}
                    onChange={(e) => setDraftPrice(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ticket-token">
                    Token ที่ได้รับ (ต่อใบ) *
                  </FieldLabel>
                  <Input
                    id="ticket-token"
                    type="number"
                    min="0"
                    required
                    value={draftToken}
                    onChange={(e) => setDraftToken(e.target.value)}
                  />
                </Field>
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

        {/* dialog add ticket */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>เพิ่มบัตร</DialogTitle>
              <DialogDescription>กรอกข้อมูลบัตรใบใหม่</DialogDescription>
            </DialogHeader>

            <form className="w-full" onSubmit={handleAddTicket}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="new-ticket-name">ชื่อบัตร *</FieldLabel>
                  <Input
                    id="new-ticket-name"
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="new-ticket-price">
                    ราคาบัตร (บาท) *
                  </FieldLabel>
                  <Input
                    id="new-ticket-price"
                    type="number"
                    min="0"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="new-ticket-token">
                    Token ที่ได้รับ (ต่อใบ) *
                  </FieldLabel>
                  <Input
                    id="new-ticket-token"
                    type="number"
                    min="0"
                    required
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                  />
                </Field>
              </FieldGroup>

              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    ยกเลิก
                  </Button>
                </DialogClose>
                <Button type="submit" className="bg-brand hover:bg-brand-hover">
                  เพิ่มบัตร
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* shirt */}
        <div className="w-full flex flex-col">
          <Badge
            variant={"outline"}
            className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-3.5"
          >
            {/* หัวเรื่อง */}
            <div className="w-full flex flex-col items-start justify-center gap-1">
              <div className="text-lg font-semibold text-black">
                เสื้อที่ระลึก
              </div>
            </div>
            <div className="w-full flex items-center justify-end">
              <Badge
                variant={"outline"}
                className="w-full text-[14px] p-4 flex items-center justify-center rounded-[10px] border hover:border-brand-hover hover:text-brand [&>svg]:size-4! hover:cursor-pointer"
              >
                <Plus />
                แก้ไขเสื้อ
              </Badge>
            </div>
            <div className="w-full flex flex-col items-start justify-center p-2 gap-3">
              {shirts.map((shirt) => {
                return (
                  <div
                    key={shirt.id}
                    className="w-full flex flex-col items-start justify-center gap-1"
                  >
                    <div className="text-[16px] font-semibold md:text-lg">
                      ขนาด {shirt.size}
                    </div>
                    <div className="w-full flex items-center justify-between">
                      <div className="text-sm text-muted-foreground md:text-[16px]">
                        รอบอก
                      </div>
                      <div className="text-sm md:text-[16px]">
                        {shirt.chest} นิ้ว
                      </div>
                    </div>
                    <div className="w-full flex items-center justify-between">
                      <div className="text-sm text-muted-foreground md:text-[16px]">
                        ราคา / ตัว
                      </div>
                      <div className="text-sm md:text-[16px]">
                        {shirt.price} บาท
                      </div>
                    </div>
                    <div className="mt-1 w-full border-b border-[#E5E5E5]"></div>
                  </div>
                );
              })}
            </div>
          </Badge>
        </div>
      </div>
    </div>
  );
}
