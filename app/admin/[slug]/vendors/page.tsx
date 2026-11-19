"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

// icon
import { Plus, RefreshCw, SearchIcon } from "lucide-react";

import { api } from "@/lib/api-client";
import { PERMISSIONS } from "@/lib/permissions";
import type { EventDetail, StoreDetail, User } from "@/lib/api-types";

type Store = EventDetail["stores"][number];
type SortKey = "name" | "income-desc" | "income-asc";

const selectClass =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const formatToken = (v?: string | number | null) => {
  if (v == null) return "-";
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("th-TH") : "-";
};

export default function Page() {
  const { slug } = useParams<{ slug: string }>();

  // ---------- data ---------- //
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  // รายละเอียดร้าน (ยอดโทเคน/สินค้า) แยกตาม store id
  const [details, setDetails] = useState<Record<string, StoreDetail>>({});
  // ร้านที่โหลดรายละเอียดไม่สำเร็จ
  const [failedStoreIds, setFailedStoreIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);

  // ---------- filters ---------- //
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");

  const load = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setUsersError(null);

      // โหลดรายละเอียดงาน และรายชื่อผู้ใช้พร้อมกัน
      const [eventRes, usersRes] = await Promise.all([
        api.events.get(slug),
        api.admin.users.list(),
      ]);

      if (!eventRes.success) {
        setError(eventRes.error.message);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const stores = eventRes.data.stores;
      const storeResults = await Promise.all(
        stores.map((s) => api.store.getMy(s.id)),
      );

      const map: Record<string, StoreDetail> = {};
      const failed = new Set<string>();
      storeResults.forEach((r, i) => {
        if (r.success) map[stores[i].id] = r.data;
        else failed.add(stores[i].id);
      });

      setEvent(eventRes.data);
      setDetails(map);
      setFailedStoreIds(failed);

      // ใช้หาชื่อผู้ดูแลร้าน (ถ้าไม่มีสิทธิ์ดูรายชื่อผู้ใช้ ก็แสดงเป็น "-")
      if (usersRes.success) setUsers(usersRes.data);
      else setUsersError(usersRes.error.message);

      setLoading(false);
      setRefreshing(false);
    },
    [slug],
  );

  useEffect(() => {
    load();
  }, [load]);

  // ---------- derived ---------- //
  const vendors: Store[] = useMemo(() => event?.stores ?? [], [event]);

  const managersByStore = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const u of users) {
      for (const r of u.roles) {
        if (r.role === "VENDOR" && r.storeId) {
          (map[r.storeId] ??= []).push(u.name);
        }
      }
    }
    return map;
  }, [users]);

  const incomeOf = useCallback(
    (storeId: string) => Number(details[storeId]?.walletBalance ?? 0),
    [details],
  );

  const totalIncome = useMemo(
    () => vendors.reduce((sum, v) => sum + incomeOf(v.id), 0),
    [vendors, incomeOf],
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
      if (sortKey === "income-desc") return incomeOf(b.id) - incomeOf(a.id);
      if (sortKey === "income-asc") return incomeOf(a.id) - incomeOf(b.id);
      return a.name.localeCompare(b.name, "th");
    });
  }, [vendors, details, managersByStore, search, sortKey, incomeOf]);

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
    if (!event || !selectedStore || !selectedUserId || assigning) return;

    setAssigning(true);
    setAssignError(null);
    const res = await api.admin.users.assignRole(selectedUserId, {
      role: "VENDOR",
      eventId: event.id,
      storeId: selectedStore.id,
      permissions: [PERMISSIONS.STORE_MANAGE, PERMISSIONS.STORE_SELL],
    });
    setAssigning(false);

    if (!res.success) {
      setAssignError(res.error.message);
      return;
    }

    setUsers((current) =>
      current.map((user) => (user.id === res.data.id ? res.data : user)),
    );
    setAssignOpen(false);
    resetAssign();
  }

  // ---------- create store ---------- //
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function openCreate() {
    setNewName("");
    setNewDescription("");
    setCreateError(null);
    setCreateOpen(true);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!event || creating) return;

    const name = newName.trim();
    if (!name) {
      setCreateError("กรุณากรอกชื่อร้าน");
      return;
    }

    setCreating(true);
    setCreateError(null);
    const res = await api.store.create({
      eventId: event.id,
      name,
      description: newDescription.trim() || null,
    });
    setCreating(false);

    if (!res.success) {
      setCreateError(res.error.message);
      return;
    }

    setCreateOpen(false);
    load(true); // รีเฟรชแบบเงียบ ไม่กลับไปหน้า skeleton
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

  if (error || !event)
    return (
      <div className="p-4 flex flex-col items-start gap-3">
        <p role="alert" className="text-destructive">
          {error ?? "ไม่พบงาน"}
        </p>
        <Button variant="outline" onClick={() => load()}>
          <RefreshCw />
          ลองใหม่
        </Button>
      </div>
    );

  const stats = [
    { label: "ร้านค้าทั้งหมด", value: formatToken(vendors.length) },
    { label: "รายได้รวมทุกร้าน", value: `${formatToken(totalIncome)} Token` },
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
              onClick={() => load(true)}
              disabled={refreshing}
              aria-label="รีเฟรชข้อมูล"
            >
              <RefreshCw className={refreshing ? "animate-spin" : ""} />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={openCreate}
              className="h-auto p-3 border-brand text-brand hover:bg-brand hover:text-on-brand font-semibold text-[16px] rounded-[10px] gap-1.5 [&>svg]:size-5!"
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
                className="text-sm text-muted-foreground"
              >
                เรียงตาม
              </FieldLabel>
              <select
                id="sort-vendor"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className={`${selectClass} h-12`}
              >
                <option value="name">ชื่อร้าน (ก-ฮ)</option>
                <option value="income-desc">รายได้ มาก → น้อย</option>
                <option value="income-asc">รายได้ น้อย → มาก</option>
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
                        ? "ยังไม่มีร้านค้า กด “สร้างร้านค้า” เพื่อเริ่มต้น"
                        : "ไม่พบร้านค้าที่ค้นหา"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((vendor) => {
                    const detail = details[vendor.id];
                    const failed = failedStoreIds.has(vendor.id);
                    const managers = managersByStore[vendor.id] ?? [];

                    return (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">
                          {vendor.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {failed ? (
                            <span className="text-destructive text-sm">
                              โหลดไม่สำเร็จ
                            </span>
                          ) : (
                            (detail?.product?.title ?? "-")
                          )}
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
                              disabled={Boolean(usersError)}
                              onClick={() => openAssignVendor(vendor)}
                            >
                              <Plus />
                              เพิ่ม Vendor
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
              <DialogTitle>สร้างร้านค้า</DialogTitle>
              <DialogDescription>
                เปิดร้านใหม่ในงาน “{event.title}”
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
