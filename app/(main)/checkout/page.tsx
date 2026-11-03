import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Stepper, StepperContent, StepperDescription, StepperIndicator, StepperItem, StepperList, StepperSeparator, StepperTitle, StepperTrigger } from "@/components/ui/stepper";
import { Calendar, House, MapPinned, Minus, Plus, Ticket } from "lucide-react";
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
        <div className="my-5">
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
                        <div className="flex gap-5">
                            <div className="w-2/3 flex flex-col gap-5">
                                <div className="border border-brand rounded-md p-4 flex gap-5">
                                    <div className="w-48">
                                        <AspectRatio ratio={4 / 3}>
                                            <Image alt="งานทดสอบ" src={"https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&q=80"} fill className="rounded-md object-cover" />
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
                                        <div>
                                            w
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
                                                    value={1}
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
                            <div className="flex-1 outline outline-green-500">
                                wไไไไ
                            </div>
                        </div>
                    </StepperContent>
                </Stepper>


            </div>
        </div>
    );
}