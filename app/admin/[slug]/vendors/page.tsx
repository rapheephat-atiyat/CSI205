"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAdminAccess } from "@/components/admin/AdminAccess";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

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
import { Skeleton } from "@/components/ui/skeleton";

// icon
import { Plus, RefreshCw, SearchIcon } from "lucide-react";

import { api } from "@/lib/api-client";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdminStore, AdminUser } from "@/lib/api-types";

type Store = AdminStore;
type SortKey = "name" | "balance-desc" | "balance-asc";

const selectClass =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("อ่านไฟล์รูปภาพไม่สำเร็จ"));
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("อ่านไฟล์รูปภาพไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

const formatToken = (v?: string | number | null) => {
  if (v == null) return "-";
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("th-TH") : "-";
};

export default function Page() {
  const { eventId, eventTitle, slug, can } = useAdminAccess();
  const canAssign = can(PERMISSIONS.PERMISSION_MANAGE);

  // ---------- data ---------- //
  const [vendors, setVendors] = useState<AdminStore[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);

  // ---------- filters ---------- //
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");

  const [revision, setRevision] = useState(0);

  function reload(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setUsersError(null);
    setRevision((value) => value + 1);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.admin.stores.list(eventId),
      canAssign ? api.admin.eventUsers.list(eventId) : Promise.resolve(null),
    ]).then(([storeResponse, userResponse]) => {
      if (cancelled) return;
      if (storeResponse.success) setVendors(storeResponse.data);
      else {
        setError(storeResponse.error.message);
        toast.error(storeResponse.error.message);
      }
      if (userResponse?.success) setUsers(userResponse.data);
      else if (userResponse) setUsersError(userResponse.error.message);
    }).finally(() => {
      if (!cancelled) {
        setLoading(false);
        setRefreshing(false);
      }
    });
    return () => { cancelled = true; };
  }, [eventId, canAssign, revision]);

  const details = useMemo(() => Object.fromEntries(vendors.map((store) => [store.id, store])), [vendors]);
  const managersByStore = useMemo(() => Object.fromEntries(vendors.map((store) => [store.id, store.managers.map((manager) => manager.name)])), [vendors]);

  const balanceOf = useCallback(
    (storeId: string) => Number(details[storeId]?.walletBalance ?? 0),
    [details],
  );

  const totalBalance = useMemo(
    () => vendors.reduce((sum, v) => sum + balanceOf(v.id), 0),
    [vendors, balanceOf],
  );

  const storesWithoutProduct = useMemo(
    () => vendors.filter((v) => details[v.id] && !details[v.id].product).length,
    [vendors, details],
  );

  const storesWithoutManager = useMemo(
    () => vendors.filter((v) => !managersByStore[v.id]?.length).length,
    [vendors, managersByStore],
  );

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const list = vendors.filter((v) => {
      if (!keyword) return true;
      const product = details[v.id]?.product?.title ?? "";
      const managers = (managersByStore[v.id] ?? []).join(" ");
      return `${v.name} ${product} ${managers}`.toLowerCase().includes(keyword);
    });

    return [...list].sort((a, b) => {
      if (sortKey === "balance-desc") return balanceOf(b.id) - balanceOf(a.id);
      if (sortKey === "balance-asc") return balanceOf(a.id) - balanceOf(b.id);
      return a.name.localeCompare(b.name, "th");
    });
  }, [vendors, details, managersByStore, search, sortKey, balanceOf]);

  // ---------- assign vendor ---------- //
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const availableUsers = useMemo(() => {
    if (!selectedStore) return [];
    const keyword = userSearch.trim().toLowerCase();
    return users.filter(
      (user) =>
        user.status === "ACTIVE" &&
        !user.roles.some(
          (role) => role.role === "VENDOR" && role.storeId === selectedStore.id,
        ) &&
        (!keyword ||
          `${user.name} ${user.email}`.toLowerCase().includes(keyword)),
    );
  }, [users, selectedStore, userSearch]);

  function resetAssign() {
    setSelectedStore(null);
    setSelectedUserId("");
    setUserSearch("");
    setAssignError(null);
  }

  function openAssignVendor(store: Store) {
    resetAssign();
    setSelectedStore(store);
    setAssignOpen(true);
  }

  async function handleAssignVendor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canAssign || !selectedStore || !selectedUserId || assigning) return;

    setAssigning(true);
    setAssignError(null);
    const res = await api.admin.eventUsers.assignRole(eventId, selectedUserId, {
      role: "VENDOR",
      storeId: selectedStore.id,
      permissions: [PERMISSIONS.STORE_MANAGE, PERMISSIONS.STORE_SELL],
    });
    setAssigning(false);

    if (!res.success) {
      setAssignError(res.error.message);
      toast.error(res.error.message);
      return;
    }

    toast.success("มอบหมายผู้ดูแลร้านแล้ว");
    reload(true);
    setAssignOpen(false);
    resetAssign();
  }

  // ---------- create store ---------- //
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductImage, setNewProductImage] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingStore, setEditingStore] = useState<AdminStore | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function openStoreForm(store: AdminStore | null = null) {
    setEditingStore(store);
    setNewName(store?.name ?? "");
    setNewDescription(store?.description ?? "");
    setNewProductName("");
    setNewProductPrice("");
    setNewProductImage("");
    setCreateError(null);
    setConfirmDelete(false);
    setCreateOpen(true);
  }

  async function handleProductImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (
      !["image/png", "image/jpeg"].includes(file.type) ||
      file.size === 0 ||
      file.size > 2 * 1024 * 1024
    ) {
      const message = "กรุณาเลือกรูปอาหาร PNG หรือ JPEG ขนาดไม่เกิน 2 MB";
      setNewProductImage("");
      setCreateError(message);
      toast.error(message);
      return;
    }

    try {
      setNewProductImage(await readImageAsDataUrl(file));
      setCreateError(null);
    } catch {
      const message = "อ่านรูปอาหารไม่สำเร็จ กรุณาลองอีกครั้ง";
      setNewProductImage("");
      setCreateError(message);
      toast.error(message);
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;
    const name = newName.trim();
    if (!name) {
      toast.error("กรุณากรอกชื่อร้าน");
      return;
    }
    const productName = newProductName.trim();
    const productPrice = newProductPrice.trim();
    const hasProductInput = Boolean(productName || productPrice || newProductImage);
    if (!editingStore && hasProductInput && (!productName || !productPrice)) {
      const message = "กรุณาระบุชื่ออาหารและราคา Token ต่อชิ้นให้ครบ";
      setCreateError(message);
      toast.error(message);
      return;
    }
    setCreating(true);
    setCreateError(null);
    const input = { name, description: newDescription.trim() || null };
    const result = editingStore
      ? await api.admin.stores.update(eventId, editingStore.id, input)
      : await api.admin.stores.create(eventId, {
          ...input,
          ...(productName
            ? {
                product: {
                  title: productName,
                  price: productPrice,
                  ...(newProductImage ? { images: [newProductImage] } : {}),
                },
              }
            : {}),
        });
    setCreating(false);
    if (!result.success) {
      setCreateError(result.error.message);
      toast.error(result.error.message);
      return;
    }
    toast.success("บันทึกร้านค้าแล้ว");
    setCreateOpen(false);
    reload(true);
  }

  async function handleDelete() {
    if (!editingStore || !confirmDelete || creating) return;
    setCreating(true);
    const result = await api.admin.stores.delete(eventId, editingStore.id);
    setCreating(false);
    if (!result.success) {
      setCreateError(result.error.message);
      toast.error(result.error.message);
      return;
    }
    toast.success("ลบร้านค้าแล้ว");
    setCreateOpen(false);
    reload(true);
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

          {/* การ์ด 1 ใบ */}
          <div className="w-full flex flex-col items-center justify-center gap-4">
            <Skeleton className="h-140 w-full rounded-[10px] bg-on-brand" />
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-4 flex flex-col items-start gap-3">
        <p role="alert" className="text-destructive">
          {error ?? "ไม่พบงาน"}
        </p>
        <Button variant="outline" onClick={() => reload()}>
          <RefreshCw />
          ลองใหม่
        </Button>
      </div>
    );

  const stats = [
    { label: "ร้านค้าทั้งหมด", value: formatToken(vendors.length) },
    { label: "ยอด Token คงเหลือรวม", value: `${formatToken(totalBalance)} Token` },
    {
      label: "ร้านที่ยังไม่มีสินค้า",
      value: formatToken(storesWithoutProduct),
      warn: storesWithoutProduct > 0,
    },
    {
      label: "ร้านที่ยังไม่มีผู้ดูแล",
      value: usersError ? "-" : formatToken(storesWithoutManager),
      warn: !usersError && storesWithoutManager > 0,
    },
  ];

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
              <BreadcrumbPage>ร้านค้า</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="p-4 mx-auto w-full max-w-7xl flex flex-col items-start justify-center gap-4">
        {/* หัวเรื่อง */}
        <div className="w-full flex flex-row items-center justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-semibold text-black">ร้านค้า</h1>
            <p className="text-[14px] font-medium text-muted-foreground">
              ร้านมีสินค้าได้เพียง 1 รายการ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => reload(true)}
              disabled={refreshing}
              aria-label="รีเฟรชข้อมูล"
            >
              <RefreshCw className={refreshing ? "animate-spin" : ""} />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => openStoreForm()}
              className="h-auto p-3 border-brand text-brand hover:bg-brand hover:text-on-brand font-semibold text-[16px] rounded-[10px] gap-1.5 [&>svg]:size-5! cursor-pointer"
            >
              <Plus />
              สร้างร้านค้า
            </Button>
          </div>
        </div>

        {/* สรุปภาพรวม */}
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-[10px] border p-4 flex flex-col gap-1"
            >
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <span
                className={`text-xl font-semibold ${
                  s.warn ? "text-destructive" : "text-black"
                }`}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* vendor */}
        <div className="p-4 flex flex-col items-start justify-center w-full rounded-[10px] border gap-3">
          <div className="text-[16px] font-semibold text-black">
            รายชื่อร้านค้า
            {filtered.length !== vendors.length &&
              ` (${filtered.length}/${vendors.length})`}
          </div>

          <FieldGroup className="flex lg:flex-row w-full">
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
                  placeholder="ค้นหาชื่อร้าน สินค้า หรือผู้ดูแล"
                  className="text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <InputGroupAddon>
                  <SearchIcon className="text-muted-foreground" />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field className="lg:flex-1">
              <FieldLabel
                htmlFor="sort-vendor"
                className="text-sm text-muted-foreground "
              >
                เรียงตาม
              </FieldLabel>
              <select
                id="sort-vendor"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className={`${selectClass} h-12 cursor-pointer`}
              >
                <option value="name">ชื่อร้าน (ก-ฮ)</option>
                <option value="balance-desc">ยอดคงเหลือ มาก → น้อย</option>
                <option value="balance-asc">ยอดคงเหลือ น้อย → มาก</option>
              </select>
            </Field>
          </FieldGroup>

          <div className="mt-2 w-full overflow-x-auto">
            <Table>
              <TableCaption>รายชื่อร้านค้าในงาน</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ร้านค้า</TableHead>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>ราคา</TableHead>
                  <TableHead>ยอด Token คงเหลือ</TableHead>
                  <TableHead>ผู้ดูแลร้านและจัดการ</TableHead>
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
                        ? "ยังไม่มีร้านค้า กด “สร้างร้านค้า” เพื่อเริ่มต้น"
                        : "ไม่พบร้านค้าที่ค้นหา"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((vendor) => {
                    const detail = details[vendor.id];
                    const managers = managersByStore[vendor.id] ?? [];

                    return (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">
                          {vendor.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {detail?.product?.title ?? "—"}
                        </TableCell>
                        <TableCell>
                          {detail?.product
                            ? `${formatToken(detail.product.price)} Token`
                            : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {detail
                            ? `${formatToken(detail.walletBalance)} Token`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-2">
                            {managers.length === 0 ? (
                              <span className="text-muted-foreground">-</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {managers.map((name, i) => (
                                  <Badge
                                    key={`${name}-${i}`}
                                    variant="secondary"
                                  >
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={!canAssign || Boolean(usersError)}
                              onClick={() => openAssignVendor(vendor)}
                              className="cursor-pointer"
                            >
                              <Plus />
                              เพิ่ม Vendor
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => openStoreForm(vendor)}>
                              แก้ไขร้านค้า
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {usersError && (
            <p role="alert" className="text-sm text-destructive">
              โหลดรายชื่อผู้ใช้เพื่อผูก Vendor ไม่สำเร็จ: {usersError}
            </p>
          )}
        </div>

        {/* dialog assign vendor */}
        <Dialog
          open={assignOpen}
          onOpenChange={(open) => {
            setAssignOpen(open);
            if (!open) resetAssign();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>เพิ่ม Vendor ให้ร้าน</DialogTitle>
              <DialogDescription>
                {selectedStore
                  ? `เลือกรายชื่อผู้ใช้เพื่อผูกกับร้าน "${selectedStore.name}"`
                  : "เลือกร้านค้าที่ต้องการผูก Vendor"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAssignVendor}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="vendor-user-search">
                    ค้นหาบัญชีผู้ใช้
                  </FieldLabel>
                  <Input
                    id="vendor-user-search"
                    placeholder="ชื่อหรืออีเมล"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    disabled={Boolean(usersError)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="vendor-user">บัญชีผู้ใช้ *</FieldLabel>
                  <select
                    id="vendor-user"
                    required
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    disabled={
                      Boolean(usersError) || availableUsers.length === 0
                    }
                    className={selectClass}
                  >
                    <option value="" disabled>
                      เลือกบัญชีผู้ใช้
                    </option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </Field>
              </FieldGroup>

              {usersError ? (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {usersError}
                </p>
              ) : availableUsers.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {userSearch.trim()
                    ? "ไม่พบบัญชีผู้ใช้ที่ตรงกับคำค้นหา"
                    : "ไม่มีบัญชีผู้ใช้ที่ยังผูกกับร้านนี้ได้"}
                </p>
              ) : null}
              {assignError && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {assignError}
                </p>
              )}

              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    ยกเลิก
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  className="bg-brand hover:bg-brand-hover cursor-pointer"
                  disabled={
                    assigning ||
                    !selectedUserId ||
                    Boolean(usersError) ||
                    availableUsers.length === 0
                  }
                >
                  {assigning ? "กำลังผูก Vendor..." : "ผูก Vendor"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* dialog create store */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingStore ? "แก้ไขร้านค้า" : "สร้างร้านค้า"}</DialogTitle>
              <DialogDescription>
                {eventTitle} · ร้านค้าที่มีธุรกรรมจะลบไม่ได้
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
                  <FieldLabel htmlFor="store-description">
                    รายละเอียด
                  </FieldLabel>
                  <Input
                    id="store-description"
                    placeholder="อาหารอีสาน เครื่องดื่ม"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </Field>
              </FieldGroup>

              {!editingStore && (
                <div className="mt-4 border-t pt-4">
                  <p className="mb-3 text-sm font-medium">อาหารเริ่มต้น (ไม่บังคับ)</p>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="store-product-name">ชื่ออาหาร</FieldLabel>
                      <Input
                        id="store-product-name"
                        placeholder="ข้าวไก่ย่าง"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="store-product-price">ราคา Token ต่อชิ้น</FieldLabel>
                      <Input
                        id="store-product-price"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="50"
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="store-product-image">รูปอาหาร</FieldLabel>
                      <Input
                        id="store-product-image"
                        type="file"
                        accept="image/png,image/jpeg"
                        aria-describedby="store-product-image-help"
                        onChange={(e) => void handleProductImageChange(e)}
                      />
                      <p
                        id="store-product-image-help"
                        className="text-xs text-muted-foreground"
                      >
                        PNG หรือ JPEG ขนาดไม่เกิน 2 MB
                      </p>
                      {newProductImage && (
                        <div className="flex items-center gap-3">
                          <Image
                            src={newProductImage}
                            alt="ตัวอย่างรูปอาหาร"
                            width={64}
                            height={64}
                            unoptimized
                            className="size-16 rounded-md border object-cover"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setNewProductImage("")}
                          >
                            เอารูปออก
                          </Button>
                        </div>
                      )}
                    </Field>
                  </FieldGroup>
                </div>
              )}

              {createError && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {createError}
                </p>
              )}

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
                  {creating ? "กำลังบันทึก..." : "บันทึกร้านค้า"}
                </Button>
              </DialogFooter>
              {editingStore && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <label className="flex min-h-11 items-center gap-3 text-sm">
                    <Checkbox checked={confirmDelete} onCheckedChange={(value) => setConfirmDelete(value === true)} />
                    ยืนยันลบร้านค้านี้
                  </label>
                  <Button type="button" variant="destructive" disabled={!confirmDelete || creating} onClick={handleDelete}>ลบร้านค้า</Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
