import Logo from "@/public/logo.png";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface Props {
    title?: string;
    className?: string;
    priority?: boolean;
    onlyLogo?: boolean;
    onClick?: () => void;
}

export default function Brand({ title = "TUATUA", className, priority, onlyLogo, onClick }: Props) {
    return (
        <>
            {onlyLogo ? (
                <Image
                    src={Logo}
                    alt="logo"
                    className={cn("size-9 sm:size-10 object-contain", className)}
                    sizes="(min-width: 640px) 40px, 36px"
                    priority={priority}
                />
            ) : (
                <Link
                    href="/"
                    onClick={onClick}
                    className={cn("inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2", className)}
                >
                    <Image
                        src={Logo}
                        alt=""
                        className="size-9 sm:size-10 object-contain"
                        sizes="(min-width: 640px) 40px, 36px"
                        priority={priority}
                    />
                    <span className="font-audiowide text-lg tracking-[0.06em] text-foreground sm:text-xl">
                        {title}
                    </span>
                </Link>
            )}
        </>
    );
}