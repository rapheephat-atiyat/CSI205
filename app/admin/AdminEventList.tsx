"use client";

// import ui
import { Badge } from "@/components/ui/badge";
import { Eye, Plus } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import { Field, FieldLabel } from "@/components/ui/field";
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
import Link from "next/link";
import { useEffect, useState } from "react";
import { EventSummary } from "@/lib/api-types";
import { api } from "@/lib/api-client";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

// head
type HeadEv = {
  caption: string;
  name: string;
  date: string;
  place: string;
};
const headEv: HeadEv = {
  caption: "รายการงานที่จัดการได้",
  name: "ชื่องาน",
  date: "วันเวลา",
  place: "สถานที่",
};

export default function AdminEventList() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    async function load() {
      const res = await api.events.listManageable();
      if (res.success) {
        setEvents(res.data);
      } else setError(res.error.message);
      setLoading(false);
    }
    load();
  }, []);

  if (loading)
    return (
      <div className="p-4 w-full flex mx-auto flex-col items-start justify-center">
        <div className="p-4 mx-auto w-full max-w-7xl flex flex-col gap-4">
          {/* หัวเรื่อง */}
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-48 bg-on-brand" />
            <Skeleton className="h-4 w-80 max-w-full bg-on-brand" />
          </div>

          {/* การ์ด 1 ใบ */}
          <div className="w-full flex flex-col items-center justify-center gap-4">
            <Skeleton className="h-240 w-full rounded-[10px] bg-on-brand" />
          </div>
        </div>
      </div>
    );

  const filteredEvents = events.filter((event) => {
    const searchLower = search.toLowerCase();
    return (
      event.title.toLowerCase().startsWith(searchLower.trim()) ||
      event.venue.toLowerCase().startsWith(searchLower.trim())
    );
  });

  return (
    <div className="p-4 mx-auto w-full flex flex-col items-center justify-start">
      {/* container */}
      <div className="p-4 mx-auto w-full max-w-7xl flex flex-col items-start justify-center gap-4">
        {/* หัวเรื่อง */}
        <div className="flex flex-col items-start justify-center">
          <div className="text-[24px] font-semibold text-black">จัดการงาน</div>
        </div>

        {/* search event */}
        <div className="w-full flex flex-col">
          <Badge
            variant={"outline"}
            className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-3.5"
          >
            <div className="w-full flex items-center justify-between">
              <div className="text-[24px] font-semibold text-black">
                ค้นหางาน
              </div>
              <Badge
                asChild
                className="p-3 bg-brand text-on-brand  text-sm flex items-center justify-center rounded-[10px] hover:cursor-pointer hover:bg-brand-hover! hover:scale-110 hover:font-bold ease-in-out [&>svg]:size-4!"
              >
                <Link href={"/admin/create"}>
                  <Plus />
                  เพิ่มงาน
                </Link>
              </Badge>
            </div>
            <div className="w-full">
              <div className="w-full">
                <Field>
                  <FieldLabel htmlFor="input-event-group">ชื่องาน</FieldLabel>
                  <ButtonGroup className="flex flex-row items-start justify-center">
                    <Input
                      id="input-event-name"
                      placeholder="ค้นหาชื่องาน"
                      className="p-5 rounded-[10px]"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </ButtonGroup>
                </Field>
              </div>
            </div>
          </Badge>
        </div>

        {/* all events */}
        <div className="w-full flex flex-col">
          {/* หัวเรื่อง */}
          <div className="flex flex-col items-start justify-center">
            <div className="text-[18px] font-semibold text-black">
              งานที่จัดการได้
            </div>
          </div>
          <div className="w-full mt-4">
            <Badge
              variant={"outline"}
              className="p-2 w-full h-auto flex items-center justify-center rounded-2xl"
            >
              <Table>
                {!loading && <TableCaption>{headEv.caption}</TableCaption>}
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-50 text-[14px] text-muted-foreground font-normal">
                      {headEv.name}
                    </TableHead>
                    <TableHead className="text-[14px] text-muted-foreground font-normal">
                      {headEv.place}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="w-full">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <div className="flex items-center justify-center py-4">
                          <Spinner className="size-8 text-brand" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-6 text-center text-destructive"
                      >
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredEvents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-6 text-center text-muted-foreground"
                      >
                        {events.length === 0
                          ? "บัญชีนี้ยังไม่มีงานที่จัดการได้"
                          : "ไม่พบรายการงานที่ค้นหา"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="w-auto min-w-80 text-[16px] overflow-hidden">
                          {event.title}
                        </TableCell>
                        <TableCell className="w-auto text-[16px]">
                          {event.venue}
                        </TableCell>
                        <TableCell className="w-30 text-right">
                          <Badge
                            asChild
                            variant="outline"
                            className="p-3 mt-1 text-sm flex gap-1.5 items-center justify-center rounded-[10px] hover:cursor-pointer [&>svg]:size-4! hover:border-brand hover:text-brand! ease-in-out"
                          >
                            <Link href={`/admin/${event.slug}`}>
                              <Eye />
                              ดูรายละเอียด
                            </Link>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
