import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Stepper, StepperContent, StepperDescription, StepperIndicator, StepperItem, StepperList, StepperSeparator, StepperTitle, StepperTrigger } from "@/components/ui/stepper";
import { Calendar, ChevronRight, House, MapPinned, Minus, PencilLine, Plus, Ticket, Tickets } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// MOCK รอของจริง
const steps = [
    { value: "tickets", title: "เลือกบัตร", description: "ระบุโซนและจำนวนบัตร" },
    { value: "buyer", title: "ข้อมูลผู้ซื้อ", description: "กรอกชื่อและช่องทางติดต่อ" },
    { value: "shirt", title: "เลือกเสื้อ", description: "เลือกรับเสื้อที่ระลึก" },
    { value: "summary", title: "สรุปคำสั่งซื้อ", description: "ตรวจสอบคำสั่งซื้อ" },
    { value: "payment", title: "ชำระเงิน", description: "ตรวจสอบยอดและชำระเงิน" },
]

export default function page() {
    return (
        <div className="my-5 mx-5 xl:mx-0">
            <div className="mx-auto max-w-7xl container outline outline-red-500 flex flex-col gap-5">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/">หน้าหลัก</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/">รอใส่งานจริงตรงนี้</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>ซื้อบัตร</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <h1 className="text-5xl font-semibold">ซื้อบัตร</h1>

                <Stepper defaultValue="tickets" orientation="horizontal">
                    <StepperList>
                        {steps.map((s, i) => (
                            <StepperItem key={i} value={s.value}>
                                <StepperTrigger>
                                    <StepperIndicator className="data-[state=active]:border-brand data-[state=active]:bg-brand data-[state=active]:text-on-brand data-[state=completed]:border-brand data-[state=completed]:bg-brand data-[state=completed]:text-on-brand" />
                                    <div className="hidden flex-col text-left sm:flex">
                                        <StepperTitle>{s.title}</StepperTitle>
                                        <StepperDescription>{s.description}</StepperDescription>
                                    </div>
                                </StepperTrigger>
                                <StepperSeparator className="mx-4 data-[state=active]:bg-brand data-[state=completed]:bg-brand" />
                            </StepperItem>
                        ))}
                    </StepperList>
                    <StepperContent value="tickets">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                            <div className="w-full lg:w-2/3 flex flex-col gap-5">
                                <div className="border border-brand rounded-md p-4 flex gap-5">
                                    <div className="w-48">
                                        <AspectRatio ratio={4 / 3}>
                                            <Image
                                                src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&q=80"
                                                alt="Event"
                                                fill
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                loading="eager"
                                                className="object-cover rounded-md"
                                            />
                                        </AspectRatio>
                                    </div>

                                    <div className="self-center">
                                        <h5 className="text-lg">งานเลี้ยงรุ่น TUATUA 2026</h5>
                                        <div className="flex gap-5 text-sm text-muted-foreground">
                                            <div className="flex gap-2 items-center">
                                                <Calendar size={14} />
                                                ส. 20 ธ.ค. 2569 · 18:00 น.
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                <MapPinned size={14} />
                                                หอประชุมใหญ่ (สถานที่จัดงาน)
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-brand rounded-md p-4 space-y-3">
                                    <div className="border flex items-center gap-2">
                                        <Ticket size={18} /> เลือกประเภทบัตร
                                    </div>
                                    <div className="border rounded-md p-4 flex justify-between">
                                        <div className="self-center">
                                            บัตร VIP
                                        </div>
                                        <div className="flex gap-3 items-center text-sm">
                                            <div>
                                                {Intl.NumberFormat("th-TH", {
                                                    style: "currency",
                                                    currency: "THB",
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0,
                                                }).format(1500)}
                                                <p className="text-end">ต่อใบ</p>
                                            </div>
                                            <ButtonGroup>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                >
                                                    <Minus />
                                                </Button>

                                                <Input
                                                    type="number"
                                                    min={1}
                                                    defaultValue={1}
                                                    className="focus-visible:ring-2 focus-visible:border-input w-14 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                />

                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                >
                                                    <Plus />
                                                </Button>
                                            </ButtonGroup>
                                        </div>
                                    </div>
                                    <div className="border rounded-md p-4 flex justify-between">
                                        <div className="self-center">
                                            บัตรยืน
                                        </div>
                                        <div className="flex gap-3 items-center text-sm">
                                            <div>
                                                {Intl.NumberFormat("th-TH", {
                                                    style: "currency",
                                                    currency: "THB",
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0,
                                                }).format(200)}
                                                <p className="text-end">ต่อใบ</p>
                                            </div>
                                            <ButtonGroup>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                >
                                                    <Minus />
                                                </Button>

                                                <Input
                                                    type="number"
                                                    min={1}
                                                    defaultValue={1}
                                                    className="focus-visible:ring-2 focus-visible:border-input w-14 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                />

                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                >
                                                    <Plus />
                                                </Button>
                                            </ButtonGroup>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <aside className="flex-1 outline outline-green-500 lg:sticky lg:top-[calc(var(--navbar-height)+1.25rem)]">
                                <div className="rounded-xl border p-5 text-card-foreground space-y-4">
                                    <h2 className="text-lg font-semibold">สรุปรายการ</h2>
                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                            <Tickets className="size-5" strokeWidth={1.75} />
                                        </div>
                                        <p className="text-sm font-medium text-foreground">ยังไม่ได้เลือกบัตร</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            เลือกประเภทและจำนวนบัตรทางด้านซ้ายเพื่อดูยอดรวม
                                        </p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <Button className="w-full h-10">ถัดไป <ChevronRight /></Button>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </StepperContent>

                    <StepperContent value="buyer">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                            <div className="w-full lg:w-2/3 space-y-5 outline outline-red-500">
                                <div className="space-y-3 outline outline-blue-500 p-4 border rounded-md">
                                    <div className="flex justify-between">
                                        <div className="flex gap-2 items-center">
                                            <h2 className="text-lg font-semibold">ใบที่ 1</h2>
                                            <Badge variant={"outline"}>บัตร VIP</Badge>
                                        </div>
                                        <div className="my-auto">
                                            <Badge variant={"outline"} className="border-dashed border-2 items-center"><PencilLine />ยังไม่ครบ</Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox /> ใช้ที่อยู่ของฉัน
                                    </div>
                                </div>

                            </div>

                            <div className="flex-1 outline outline-green-500">
                                ww
                            </div>
                        </div>
                    </StepperContent>
                </Stepper>
            </div>
        </div >
    );
}