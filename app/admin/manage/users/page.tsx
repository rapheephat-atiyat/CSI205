"use client";
import { useEffect, useState } from "react";

// icon
import { SearchIcon, ChevronDown, CircleCheck, CircleDot } from "lucide-react";

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
import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// data
type TicketStatus = "pending" | "paid" | "rejected";
type CheckInStatus = "not_checked_in" | "checked_in";

type Attendee = {
  id: string;
  name: string;
  email: string;
  enrollYear: number;
  ticketStatus: TicketStatus;
  checkInStatus: CheckInStatus;
};

export const attendees: Attendee[] = [
  {
    id: "att-001",
    name: "กิตติพงษ์ ใจดี",
    email: "kitti@example.com",
    enrollYear: 2548,
    ticketStatus: "pending",
    checkInStatus: "not_checked_in",
  },
  {
    id: "att-002",
    name: "สุพัตรา รักเรียน",
    email: "supatra@example.com",
    enrollYear: 2548,
    ticketStatus: "paid",
    checkInStatus: "checked_in",
  },
  {
    id: "att-003",
    name: "ธนากร มั่นคง",
    email: "thanakorn@example.com",
    enrollYear: 2548,
    ticketStatus: "paid",
    checkInStatus: "not_checked_in",
  },
  {
    id: "att-004",
    name: "นภัสสร แสงทอง",
    email: "napassorn@example.com",
    enrollYear: 2549,
    ticketStatus: "rejected",
    checkInStatus: "not_checked_in",
  },
  {
    id: "att-005",
    name: "วีรภัทร พงษ์ไพบูลย์",
    email: "weeraphat@example.com",
    enrollYear: 2547,
    ticketStatus: "pending",
    checkInStatus: "checked_in",
  },
];

export default function Page() {
  const [enrollYear, setEnrollYear] = useState<string>("");
  const [checkInStatus, setCheckInStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const filtered = attendees.filter((p) => {
    return (
      p.name.startsWith(search) &&
      (enrollYear === "" || p.enrollYear === Number(enrollYear)) &&
      (checkInStatus === "" || p.checkInStatus === checkInStatus)
    );
  });
  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paged = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    console.log(search);
  }, [search]);

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
              <BreadcrumbPage>ผู้ใช้และสิทธ์</BreadcrumbPage>
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

        {/* ticket */}
        <div className="w-full flex flex-col gap-1.5">
          <Badge
            variant={"outline"}
            className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-1.5"
          >
            {/* หัวเรื่อง */}
            <div className="w-full flex flex-col items-start justify-center">
              <div className="text-lg font-semibold text-black">
                ผู้ลงทะเบียนและสิทธิ์บัญชีผู้ดูแล
              </div>
            </div>

            {/* form */}
            <div className="flex w-full flex-col items-start justify-center gap-1">
              <FieldGroup>
                <Field>
                  <FieldLabel
                    htmlFor="input-user"
                    className="text-sm text-muted-foreground"
                  >
                    ค้นหา
                  </FieldLabel>
                  <InputGroup className="w-full h-auto flex p-2">
                    <InputGroupInput
                      placeholder="ค้นหาชื่อ หรืออีเมล"
                      className="text-sm"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <InputGroupAddon>
                      <SearchIcon className="text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupAddon
                      align="inline-end"
                      className="hidden lg:flex"
                    >
                      <Kbd>⌘K</Kbd>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                <Field>
                  <FieldLabel
                    htmlFor="enroll-year"
                    className="text-sm text-muted-foreground"
                  >
                    ปีที่เข้าศึกษา
                  </FieldLabel>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="p-3 w-full h-auto items-center justify-between"
                      >
                        ปีที่เข้าศึกษา
                        <ChevronDown />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-56">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>
                          เลือกปีที่เข้าศึกษา
                        </DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                          value={enrollYear}
                          onValueChange={setEnrollYear}
                        >
                          <DropdownMenuRadioItem value="">
                            ทุกปีการศึกษา
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="2549">
                            2549
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="2548">
                            2548
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="2547">
                            2547
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Field>
                <Field>
                  <FieldLabel
                    htmlFor="check-in-status"
                    className="text-sm text-muted-foreground"
                  >
                    สถานะเข้างาน
                  </FieldLabel>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="p-3 w-full h-auto items-center justify-between"
                      >
                        เลือกสถานะเข้างาน
                        <ChevronDown />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-56">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>
                          เลือกปีที่เข้าศึกษา
                        </DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                          value={checkInStatus}
                          onValueChange={setCheckInStatus}
                        >
                          <DropdownMenuRadioItem value="">
                            ทั้งหมด
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="checked_in">
                            เช็คอินแล้ว
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="not_checked_in">
                            ยังไม่เช็คอิน
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Field>
              </FieldGroup>
            </div>

            {/* show users */}
            <div className="mt-2 w-full flex flex-col items-start justify-start gap-1.5 ">
              {paged.map((p) => {
                return (
                  <div
                    key={p.id}
                    className="w-full flex flex-col items-start justify-center gap-1"
                  >
                    <div className="text-[15px]">{p.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {p.email}
                    </div>
                    {p.checkInStatus === "checked_in" ? (
                      <Badge
                        variant={"outline"}
                        className="p-1 bg-green-100 text-green-500 [&>svg]:size-4!"
                      >
                        <CircleCheck />
                        เช็คอินแล้ว
                      </Badge>
                    ) : (
                      <Badge
                        variant={"outline"}
                        className="p-1 bg-red-100 text-red-500 [&>svg]:size-4!"
                      >
                        <CircleDot />
                        ยังไม่เช็คอิน
                      </Badge>
                    )}
                    <Badge
                      variant={"outline"}
                      className="p-3 w-full text-[16px] rounded-[10px]"
                    >
                      ดูข้อมูล
                    </Badge>
                    <div className="my-1 w-full border "></div>
                  </div>
                );
              })}

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
                        onClick={() => setCurrentPage(1)}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (n) => (
                        <PaginationItem key={n}>
                          <PaginationLink
                            href="#"
                            isActive={n === currentPage}
                            onClick={() => setCurrentPage(n)}
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
                        onClick={() => setCurrentPage(totalPages)}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </Badge>
        </div>
      </div>
    </div>
  );
}
