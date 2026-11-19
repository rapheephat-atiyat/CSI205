"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// icon
import { SearchIcon, ChevronDown } from "lucide-react";

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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { api } from "@/lib/api-client";
import type { EventDetail, User, UserRoleAssignment } from "@/lib/api-types";
import type { Permission } from "@/lib/permissions";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_PERMISSIONS: Record<"ADMIN" | "STAFF", Permission[]> = {
  ADMIN: [],
  STAFF: ["ticket.scan"] as Permission[],
};

const itemsPerPage = 5;

export default function Page() {
  const { slug } = useParams<{ slug: string }>();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function load() {
      const eventRes = await api.events.get(slug);
      if (!eventRes.success) {
        setError(eventRes.error.message);
        setLoading(false);
        return;
      }
      setEvent(eventRes.data);

      const usersRes = await api.admin.users.list();
      if (usersRes.success) setUsers(usersRes.data);
      else setError(usersRes.error.message);
      setLoading(false);
    }
    load();
  }, [slug]);

  // กรองหน้ากลับไปหน้า 1 เมื่อเปลี่ยนตัวกรอง
  useEffect(() => {
    setCurrentPage(1);
  }, [search, year]);

  // ปีที่สำเร็จการศึกษา (พ.ศ.) จากข้อมูลจริง
  function yearOf(u: User) {
    return u.graduationAt ? new Date(u.graduationAt).getFullYear() + 543 : null;
  }
  const years = Array.from(
    new Set(users.map(yearOf).filter((y): y is number => y !== null)),
  ).sort((a, b) => b - a);

  function rolesInEvent(u: User): UserRoleAssignment[] {
    if (!event) return [];
    return u.roles.filter((r) => r.eventId === null || r.eventId === event.id);
  }

  async function handleAssign(user: User, role: "ADMIN" | "STAFF") {
    if (!event) return;
    if (rolesInEvent(user).some((r) => r.role === role))
      return alert(`${user.name} มีบทบาท ${role} ในงานนี้แล้ว`);

    const res = await api.admin.users.assignRole(user.id, {
      role,
      eventId: event.id,
      permissions: DEFAULT_PERMISSIONS[role],
    });
    if (!res.success) return alert(res.error.message);
    setUsers((pre) => pre.map((u) => (u.id === user.id ? res.data : u)));
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
  if (error && users.length === 0) return <div className="p-4">{error}</div>;

  const keyword = search.trim().toLowerCase();
  const filtered = users.filter(
    (u) =>
      (u.name.toLowerCase().includes(keyword) ||
        u.email.toLowerCase().includes(keyword)) &&
      (year === "" || yearOf(u) === Number(year)),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paged = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="p-4 w-full flex mx-auto flex-col items-start justify-center">
      {/* Breadcrumbs */}
      <div className="w-full flex items-center justify-start">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/admin/${slug}`}>
                {event?.title ?? "ภาพรวมงาน"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>ผู้ใช้และสิทธิ์</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="p-4 mx-auto w-full max-w-7xl flex flex-col items-start justify-center gap-4">
        {/* หัวเรื่อง */}
        <div className="flex flex-col items-start justify-center">
          <div className="text-[24px] font-semibold text-black">
            ผู้ใช้และสิทธิ์
          </div>
          <div className="text-[14px] font-medium text-muted-foreground">
            แยกข้อมูลผู้เข้าร่วมออกจากบัญชีผู้ดูแลอย่างชัดเจน
          </div>
        </div>

        {/* users */}
        <div className="w-full flex flex-col gap-1.5">
          <Badge
            variant={"outline"}
            className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-1.5"
          >
            <div className="w-full flex flex-col items-start justify-center">
              <div className="text-lg font-semibold text-black">
                ผู้ลงทะเบียนและสิทธิ์บัญชีผู้ดูแล ({filtered.length})
              </div>
            </div>

            {/* filter */}
            <div className="flex w-full flex-col items-start justify-center gap-1">
              <FieldGroup className="flex lg:flex-row">
                <Field className="lg:flex-2">
                  <FieldLabel
                    htmlFor="input-user"
                    className="text-sm text-muted-foreground"
                  >
                    ค้นหา
                  </FieldLabel>
                  <InputGroup className="w-full h-auto flex p-2">
                    <InputGroupInput
                      id="input-user"
                      placeholder="ค้นหาชื่อ หรืออีเมล"
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
                  <FieldLabel className="text-sm text-muted-foreground">
                    ปีที่สำเร็จการศึกษา
                  </FieldLabel>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="p-3 w-full h-auto items-center justify-between"
                      >
                        {year === "" ? "ทุกปีการศึกษา" : year}
                        <ChevronDown />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-56">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>
                          เลือกปีที่สำเร็จการศึกษา
                        </DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                          value={year}
                          onValueChange={setYear}
                        >
                          <DropdownMenuRadioItem value="">
                            ทุกปีการศึกษา
                          </DropdownMenuRadioItem>
                          {years.map((y) => (
                            <DropdownMenuRadioItem key={y} value={String(y)}>
                              {y}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Field>
              </FieldGroup>
            </div>

            {/* table */}
            <div className="mt-2 w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-120">ชื่อ</TableHead>
                    <TableHead className="w-30">บทบาทในงานนี้</TableHead>
                    <TableHead className="w-30">สถานะบัญชี</TableHead>
                    <TableHead className="text-center w-auto">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        ไม่พบผู้ใช้
                      </TableCell>
                    </TableRow>
                  ) : (
                    paged.map((u) => {
                      const roles = rolesInEvent(u);
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="text-lg font-medium">
                            {u.name}
                            <span className="block text-sm font-light text-muted-foreground">
                              {u.email}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {roles.length === 0 ? (
                                <Badge
                                  variant="outline"
                                  className="p-2 w-20 rounded-[10px]"
                                >
                                  USER
                                </Badge>
                              ) : (
                                roles.map((r) => (
                                  <Badge
                                    key={r.id}
                                    variant="outline"
                                    className="p-2 w-20 rounded-[10px]"
                                  >
                                    {r.role}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {u.status === "ACTIVE" ? (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-600"
                              >
                                ใช้งานได้
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-red-100 text-red-500"
                              >
                                ถูกระงับ
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Badge
                                  variant={"outline"}
                                  className="p-3 w-fit text-[14px] rounded-[10px] border border-brand hover:bg-brand-hover hover:text-on-brand ease-in cursor-pointer"
                                >
                                  เพิ่มสิทธิ์
                                </Badge>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-44">
                                <DropdownMenuLabel>
                                  เพิ่มบทบาทในงานนี้
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => handleAssign(u, "ADMIN")}
                                >
                                  ADMIN
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleAssign(u, "STAFF")}
                                >
                                  STAFF (สแกนบัตร)
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.max(1, p - 1));
                      }}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (n) => (
                      <PaginationItem key={n}>
                        <PaginationLink
                          href="#"
                          isActive={n === currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(n);
                          }}
                        >
                          {n}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </Badge>
        </div>
      </div>
    </div>
  );
}
