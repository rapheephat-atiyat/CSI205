"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// import ui
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

// icon
import { Plus, SearchIcon } from "lucide-react";

import { api } from "@/lib/api-client";
import type { EventDetail, StoreDetail, User } from "@/lib/api-types";

type Store = EventDetail["stores"][number];

export default function Page() {
  const { slug } = useParams<{ slug: string }>();

  const [search, setSearch] = useState("");
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [vendors, setVendors] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  // รายละเอียดร้าน (ยอดโทเคน/สินค้า) แยกตาม store id
  const [details, setDetails] = useState<Record<string, StoreDetail>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await api.events.get(slug);
    if (!res.success) {
      setError(res.error.message);
      setLoading(false);
      return;
    }
    setEvent(res.data);
    setVendors(res.data.stores);

    // ดึงรายได้ (walletBalance) และสินค้าของแต่ละร้าน
    // ร้านไหนไม่มีสิทธิ์ดู จะไม่อยู่ใน map และแสดงเป็น "-"
    const results = await Promise.all(
      res.data.stores.map((s) => api.store.getMy(s.id)),
    );
    const map: Record<string, StoreDetail> = {};
    results.forEach((r, i) => {
      if (r.success) map[res.data.stores[i].id] = r.data;
    });
    setDetails(map);

    // ใช้หาชื่อผู้ดูแลร้าน (ถ้าไม่มีสิทธิ์ดูรายชื่อผู้ใช้ ก็แสดงเป็น "-")
    const usersRes = await api.admin.users.list();
    if (usersRes.success) setUsers(usersRes.data);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [slug]);

  // ผู้ดูแลร้าน = ผู้ใช้ที่มีบทบาท VENDOR ผูกกับร้านนั้น
  function managersOf(storeId: string) {
    const names = users
      .filter((u) =>
        u.roles.some((r) => r.role === "VENDOR" && r.storeId === storeId),
      )
      .map((u) => u.name);
    return names.length ? names.join(", ") : "-";
  }

  // ---------- สร้างร้านค้า ---------- //
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  function openCreate() {
    setNewName("");
    setNewDescription("");
    setCreateOpen(true);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!event) return;

    setCreating(true);
    const res = await api.store.create({
      eventId: event.id,
      name: newName.trim(),
      description: newDescription.trim() || null,
    });
    setCreating(false);

    if (!res.success) return alert(res.error.message);
    setCreateOpen(false);
    load();
  }

  // ---------- UI ---------- //
  if (loading) return <div className="p-4">กำลังโหลด...</div>;
  if (error || !event) return <div className="p-4">{error ?? "ไม่พบงาน"}</div>;

  const fmt = (v?: string | null) =>
    v == null ? "-" : Number(v).toLocaleString("th-TH");
  const totalIncome = Object.values(details).reduce(
    (sum, d) => sum + Number(d.walletBalance),
    0,
  );

  const keyword = search.trim().toLowerCase();
  const filtered = vendors.filter((v) => v.name.toLowerCase().includes(keyword));

  return (
    <div className="p-4 w-full flex mx-auto flex-col items-start justify-center">
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
              <BreadcrumbPage>ร้านค้า</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="p-4 mx-auto w-full max-w-7xl flex flex-col items-start justify-center gap-4">
        {/* หัวเรื่อง */}
        <div className="w-full flex flex-row items-center justify-between">
          <div>
            <div className="text-[24px] font-semibold text-black">ร้านค้า</div>
            <div className="text-[14px] font-medium text-muted-foreground">
              ร้านมีสินค้าได้เพียง 1 รายการ
            </div>
          </div>
          {/* create vendor */}
          <Badge
            onClick={openCreate}
            variant={"outline"}
            className="p-3 flex flex-row items-center border border-brand text-brand justify-center w-fit h-auto hover:bg-brand hover:text-on-brand font-semibold text-[16px] rounded-[10px] gap-1.5 hover:cursor-pointer transition ease-in [&>svg]:size-5!"
          >
            <Plus />
            สร้างร้านค้า
          </Badge>
        </div>

        {/* vendor */}
        <Badge
          variant={"outline"}
          className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-1.5"
        >
          <div className="flex flex-col items-start justify-center">
            <div className="text-[16px] font-semibold text-black">
              ร้านค้าทั้งหมด ({vendors.length})
            </div>
            <div className="text-sm text-muted-foreground">
              รายได้รวมทุกร้าน {fmt(String(totalIncome))} Token
            </div>
          </div>

          <div className="flex w-full flex-col items-start justify-center gap-1">
            <FieldGroup className="flex lg:flex-row">
              <Field className="lg:flex-2">
                <FieldLabel
                  htmlFor="search-vendor"
                  className="text-sm text-muted-foreground"
                >
                  ค้นหา
                </FieldLabel>
                <InputGroup className="w-full h-auto flex p-2">
                  <InputGroupInput
                    id="search-vendor"
                    placeholder="ค้นหาชื่อร้าน"
                    className="text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <InputGroupAddon>
                    <SearchIcon className="text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </FieldGroup>

            <div className="mt-2 w-full">
              <Table>
                <TableCaption>รายชื่อร้านค้าในงาน</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>ร้านค้า</TableHead>
                    <TableHead>สินค้า</TableHead>
                    <TableHead>ราคา</TableHead>
                    <TableHead>รายได้ร้าน</TableHead>
                    <TableHead>ผู้ดูแลร้าน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {vendors.length === 0
                          ? "ยังไม่มีร้านค้า"
                          : "ไม่พบร้านค้าที่ค้นหา"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">
                          {vendor.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {details[vendor.id]?.product?.title ?? "-"}
                        </TableCell>
                        <TableCell>
                          {details[vendor.id]?.product
                            ? `${fmt(details[vendor.id]!.product!.price)} Token`
                            : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {details[vendor.id]
                            ? `${fmt(details[vendor.id].walletBalance)} Token`
                            : "-"}
                        </TableCell>
                        <TableCell>{managersOf(vendor.id)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Badge>

        {/* dialog create store */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>สร้างร้านค้า</DialogTitle>
              <DialogDescription>
                เปิดร้านใหม่ในงาน "{event.title}"
              </DialogDescription>
            </DialogHeader>

            <form className="w-full" onSubmit={handleCreate}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="store-name">ชื่อร้าน *</FieldLabel>
                  <Input
                    id="store-name"
                    required
                    placeholder="ร้านข้าวไก่ย่าง"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="store-description">รายละเอียด</FieldLabel>
                  <Input
                    id="store-description"
                    placeholder="อาหารอีสาน เครื่องดื่ม"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </Field>
              </FieldGroup>

              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    ยกเลิก
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  className="bg-brand hover:bg-brand-hover"
                  disabled={creating}
                >
                  {creating ? "กำลังสร้าง..." : "สร้างร้านค้า"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}