import { CircleHelp, type LucideIcon } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";

function isIconName(name: string): name is keyof typeof dynamicIconImports {
    return Object.hasOwn(dynamicIconImports, name);
}

export default async function FaqCategoryIcon({ name }: { name: string }) {
    let Icon: LucideIcon = CircleHelp;
    if (isIconName(name)) {
        try {
            Icon = (await dynamicIconImports[name]()).default;
        } catch {
            // Keep the category usable if its icon is unavailable.
        }
    }
    return <Icon aria-hidden="true" className="size-4 shrink-0" />;
}
