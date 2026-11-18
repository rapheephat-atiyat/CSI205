"use client";

import { useState } from "react";

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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

// icon
import { Plus, SearchIcon, Trash2, UserRoundPlus } from "lucide-react";

// data
import { vendors, type Vendor } from "@/app/admin/[slug]/page";

export default function Page({ slug }: { slug: string }) {
  const [search, setSearch] = useState<string>("");
  return (
    <div className="p-4 w-full flex mx-auto flex-col items-start justify-center">
      {/* Breadcrumbs */}
      <div className="w-full flex items-center justify-start">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/admin/${slug}`}>ภาพรวมงาน</BreadcrumbLink>
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
          {/* หัวเรื่อง */}
          <div className="flex flex-col items-start justify-center">
            <div className="text-[16px] font-semibold text-black">
              ร้านค้าทั้งหมด
            </div>
          </div>

          {/* form */}
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
                    placeholder="ค้นหาชื่อร้าน"
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
                  ></InputGroupAddon>
                </InputGroup>
              </Field>
            </FieldGroup>
            {/* show users */}
            {/* mobile */}
            <div className="mt-2 w-full flex flex-col items-start justify-start gap-1.5 md:hidden">
              {vendors
                .filter((vendor) => {
                  const modSearch = search.toLocaleLowerCase();
                  return vendor.name.startsWith(modSearch.trim());
                })
                .map((vendor) => {
                  return (
                    <div
                      key={vendor.id}
                      className="w-full flex flex-col items-start justify-center gap-2.5"
                    >
                      <div className="text-sm font-semibold">{vendor.name}</div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {vendor.food}
                      </div>
                      <div className="w-full flex items-center justify-between">
                        <div className="text-sm font-medium text-muted-foreground">
                          ราคา / หน่วย
                        </div>
                        <div className="text-sm font-medium text-black">
                          {vendor.price} Token
                        </div>
                      </div>
                      <div className="w-full flex items-center justify-around">
                        <Badge
                          variant={"outline"}
                          className="p-3 rounded-[10px] text-[16px] font-medium flex items-center justify-center gap-2 [&>svg]:size-3.5!"
                        >
                          <UserRoundPlus />
                          เพิ่มแอดมินประจำร้าน
                        </Badge>
                        <Badge
                          variant={"outline"}
                          className="p-3 rounded-[10px] text-[16px] text-brand border border-brand font-medium flex items-center justify-center gap-2"
                        >
                          <Trash2 />
                          ลบ
                        </Badge>
                      </div>
                      <div className="w-full border bg-muted-foreground"></div>
                    </div>
                  );
                })}
            </div>
            {/* desktop */}
            <div className="hidden mt-2 w-full flex-col items-start justify-start gap-1.5 md:flex">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ร้านค้า</TableHead>
                    <TableHead>ราคา</TableHead>
                    <TableHead>ผู้ดูแลร้าน</TableHead>
                    <TableHead className="text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors
                    .filter((vendor) => {
                      const modSearch = search.toLocaleLowerCase();
                      return vendor.name.startsWith(modSearch.trim());
                    })
                    .map((vendor) => {
                      return (
                        <TableRow key={vendor.id}>
                          <TableCell>{vendor.name}</TableCell>
                          <TableCell>{vendor.price}</TableCell>
                          <TableCell>Mr.oo7X</TableCell>
                          <TableCell>
                            <div className="w-full flex items-center justify-end gap-2">
                              <Badge
                                variant={"outline"}
                                className="p-3 rounded-[10px] text-[16px] font-medium flex items-center justify-center gap-2 [&>svg]:size-4! hover:bg-brand hover:text-on-brand transition ease-in cursor-pointer"
                              >
                                <UserRoundPlus />
                                เพิ่มแอดมินประจำร้าน
                              </Badge>
                              <Badge
                                variant={"outline"}
                                className="p-3 rounded-[10px] text-[16px] text-brand border border-brand font-medium flex items-center justify-center gap-2 hover:bg-brand hover:text-on-brand transition ease-in cursor-pointer"
                              >
                                <Trash2 />
                                ลบ
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </div>
        </Badge>
      </div>
    </div>
  );
}
