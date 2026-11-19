"use client";

import type { ComponentProps } from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function Select(props: ComponentProps<typeof SelectPrimitive.Root>) {
    return <SelectPrimitive.Root {...props} />;
}

function SelectValue(props: ComponentProps<typeof SelectPrimitive.Value>) {
    return <SelectPrimitive.Value {...props} />;
}

function SelectTrigger({ children, className, ...props }: ComponentProps<typeof SelectPrimitive.Trigger>) {
    return <SelectPrimitive.Trigger data-slot="select-trigger" className={cn("flex min-h-11 w-fit items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground", className)} {...props}>{children}<SelectPrimitive.Icon asChild><ChevronDown aria-hidden="true" className="size-4 shrink-0" /></SelectPrimitive.Icon></SelectPrimitive.Trigger>;
}

function SelectContent({ children, className, position = "popper", ...props }: ComponentProps<typeof SelectPrimitive.Content>) {
    return <SelectPrimitive.Portal><SelectPrimitive.Content data-slot="select-content" position={position} sideOffset={4} className={cn("z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10", className)} {...props}><SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport></SelectPrimitive.Content></SelectPrimitive.Portal>;
}

function SelectItem({ children, className, ...props }: ComponentProps<typeof SelectPrimitive.Item>) {
    return <SelectPrimitive.Item data-slot="select-item" className={cn("relative flex min-h-11 cursor-default select-none items-center rounded-md py-2 pr-9 pl-3 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50", className)} {...props}><SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText><span className="absolute right-3 flex size-4 items-center justify-center"><SelectPrimitive.ItemIndicator><Check aria-hidden="true" className="size-4" /></SelectPrimitive.ItemIndicator></span></SelectPrimitive.Item>;
}

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem };
