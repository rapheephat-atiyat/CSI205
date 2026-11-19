"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { AdminUser, EventDetail, UserRoleAssignment } from "@/lib/api-types";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { RefreshCw, Search } from "lucide-react";
import RoleDialog from "./RoleDialog";

const roleLabels: Record<string, string> = {
  ADMIN: "ผู้ดูแลงาน",
  STAFF: "เจ้าหน้าที่",
  VENDOR: "ผู้ดูแลร้าน",
};

export default function UsersPage() {
  const { slug } = useParams<{ slug: string }>();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [target, setTarget] = useState<{
    user: AdminUser;
    role?: UserRoleAssignment;
  } | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    // 1. โหลดข้อมูลงานเพื่อเอา eventId
    const eventRes = await api.events.get(slug);
    if (!eventRes.success) {
      setError(eventRes.error.message);
      setLoading(false);
      return;
    }
    setEvent(eventRes.data);

    // 2. โหลดรายชื่อผู้ใช้ในงาน
    const usersRes = await api.admin.eventUsers.list(
      eventRes.data.id,
      query.trim()
    );
    if (usersRes.success) {
      setUsers(usersRes.data);
    } else {
      setError(usersRes.error.message);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [slug]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadData();
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/admin/${slug}`}>
              {event?.title ?? slug}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>ผู้ใช้และสิทธิ์</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            ผู้ใช้และสิทธิ์
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {event?.title} · มอบหมายและจัดการบทบาทของทีมงานในงานนี้
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="min-h-10 cursor-pointer"
          onClick={loadData}
        >
          <RefreshCw className="size-4" />
          <span>รีเฟรชข้อมูล</span>
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <InputGroup className="flex-1 h-10 flex">
          <InputGroupAddon>
            <Search className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            maxLength={100}
            placeholder="ค้นหาชื่อหรืออีเมลเพื่อเพิ่มทีมงาน..."
            className="text-sm"
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
        <Button type="submit" variant="secondary" className="h-10 cursor-pointer">
          ค้นหา
        </Button>
      </form>

      {/* Loading or Error */}
      {loading && (
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Users Table */}
      {!loading && !error && (
        <div className="rounded-xl border bg-card p-4 shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>สถานะบัญชี</TableHead>
                <TableHead>บทบาทในงานนี้</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-32 text-center text-muted-foreground"
                  >
                    ไม่พบบัญชีผู้ใช้ที่ตรงกัน
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30">
                    <TableCell>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          user.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.status === "ACTIVE" ? "ใช้งานได้" : "ถูกระงับ"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex max-w-lg flex-wrap gap-1.5">
                        {user.roles.length ? (
                          user.roles.map((role) => (
                            <Button
                              key={role.id}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs cursor-pointer"
                              onClick={() => setTarget({ user, role })}
                            >
                              {roleLabels[role.role] || role.role} · แก้ไข
                            </Button>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            ยังไม่มีบทบาท
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={user.status !== "ACTIVE"}
                        onClick={() => setTarget({ user })}
                        className="cursor-pointer"
                      >
                        เพิ่มบทบาท
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Role Dialog */}
      {event && (
        <RoleDialog
          eventId={event.id}
          target={target}
          onClose={() => setTarget(null)}
          onSaved={() => {
            setTarget(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
