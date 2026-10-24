import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  return (
    <div className="p-4 w-full">
      <div className="grid grid-cols-2 gap-4 justify-center lg:grid-cols-4 lg:gap-2">
        <Badge variant={"outline"} className="p-4 rounded-[10px] flex flex-col  w-43 h-33.5 gap-2 lg:p-5  lg:w-57 lg:h-37">
          <div className="text-muted-foreground text-[14px] font-light">ผู้ลงทะเบียน</div>
          <div className="text-3xl lg:text-[32px] text-black font-bold">1,248</div>
          <div className="text-muted-foreground text-[12px] font-light">
            คน · ลงทะเบียนสำเร็จ
          </div>
        </Badge>
        <Badge variant={"outline"} className="p-4 rounded-[10px] flex flex-col  w-43 h-33.5 gap-2 lg:p-5  lg:w-57 lg:h-37">
          <div className="text-muted-foreground text-[14px] font-light">ผู้เข้างาน</div>
          <div className="text-2xl text-black font-bold">936</div>
          <div className="text-muted-foreground text-[12px] font-light">
            คน · 75% ของผู้ลงทะเบียน
          </div>
        </Badge>
        <Badge variant={"outline"} className="p-4 rounded-[10px] flex flex-col  w-43 h-33.5 gap-2 lg:p-5  lg:w-57 lg:h-37">
          <div className="text-muted-foreground text-[14px] font-light">ยอด Token รวม</div>
          <div className="text-2xl text-black font-bold">147,840</div>
          <div className="text-muted-foreground text-[12px] font-light">
            Token · รวมที่ได้รับและเติม
          </div>
        </Badge>
        <Badge variant={"outline"} className="p-4 rounded-[10px] flex flex-col  w-43 h-33.5 gap-2 lg:p-5  lg:w-57 lg:h-37">
          <div className="text-muted-foreground text-[14px] font-light">จำนวนร้าน</div>
          <div className="text-2xl text-black font-bold">6</div>
          <div className="text-muted-foreground text-[12px] font-light">
            ร้าน · ในงานนี้
          </div>
        </Badge>
      </div>
    </div>
  );
}
