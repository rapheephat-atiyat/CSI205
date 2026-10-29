import { cn } from "cn";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  const styles = {
    btn: "p-4 bg-on-brand rounded-[10px] flex flex-col  w-43 h-33.5 gap-2 lg:p-5  lg:w-57 lg:h-37",
    text: "text-muted-foreground text-[14px] font-light",
  };
  return (
    <div className="p-4 mt-4 flex flex-col justify-start lg:scrollbar-none">
      {/* header */}
      <div className={cn(styles.text, "text-black text-2xl font-semibold")}>
        ภาพรวมงาน
        <div className={cn(styles.text)}>
          ติดตามการลงทะเบียน การเข้างาน และยอดขายของ
          {/* event title */}
          <span>คืนสู่เหย้า 2569</span>
        </div>
      </div>

      {/* detail */}
      <div className="p-4 grid grid-cols-2 gap-2 md:flex md:justify-around">
        {/* register */}
        <Badge
          variant={"outline"}
          className="p-4 lg:py-6 lg:pr-55 w-40 flex flex-col gap-2 justify-between rounded-[10px]"
        >
          <div className={cn(styles.text, "text-sm")}>ลงทะเบียน</div>
          <div
            className={cn(
              styles.text,
              "font-semibold text-2xl md:text-4xl text-black",
            )}
          >
            1,248
          </div>
          <div className={cn(styles.text, "text-sm text-black")}>คน</div>
        </Badge>
        {/* check-in */}
        <Badge
          variant={"outline"}
          className="p-4 lg:py-6 lg:pr-55 w-40 flex flex-col gap-2 justify-between rounded-[10px]"
        >
          <div className={cn(styles.text, "text-sm")}>ลงทะเบียน</div>
          <div
            className={cn(
              styles.text,
              "font-semibold text-2xl md:text-4xl text-black",
            )}
          >
            1,248
          </div>
          <div className={cn(styles.text, "text-sm text-black")}>คน</div>
        </Badge>
        {/* ticket */}
        <Badge
          variant={"outline"}
          className="p-4 lg:py-6 lg:pr-55 w-40 flex flex-col gap-2 justify-between rounded-[10px]"
        >
          <div className={cn(styles.text, "text-sm")}>
            ยอดบัตรที่อนุมัติแล้ว
          </div>
          <div
            className={cn(
              styles.text,
              "font-semibold text-2xl md:text-4xl text-black",
            )}
          >
            1,248
          </div>
          <div className={cn(styles.text, "text-sm text-black")}>คน</div>
        </Badge>
        {/* token */}
        <Badge
          variant={"outline"}
          className="p-4 lg:py-6 lg:pr-55 w-40 flex flex-col gap-2 justify-between rounded-[10px]"
        >
          <div className={cn(styles.text, "text-sm")}>เติม Token หน้างาน</div>
          <div
            className={cn(
              styles.text,
              "font-semibold text-2xl md:text-4xl text-black",
            )}
          >
            1,248
          </div>
          <div className={cn(styles.text, "text-sm text-black")}>คน</div>
        </Badge>
      </div>
    </div>
  );
}
