"use client";

import Image from "next/image";
import { Gift } from "lucide-react";
import { useState } from "react";
import { isSouvenirImageUrl } from "@/lib/souvenirs";
import { cn } from "@/lib/utils";

export function SouvenirPhoto({ image, sizes, className }: {
    image: string | null;
    sizes: string;
    className?: string;
}) {
    const [failedImage, setFailedImage] = useState<string | null>(null);
    return (
        <div className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground", className)}>
            {image && image !== failedImage && isSouvenirImageUrl(image) ? (
                <Image src={image} alt="" fill sizes={sizes} unoptimized className="object-contain" onError={() => setFailedImage(image)} />
            ) : (
                <Gift aria-hidden="true" className="size-5" />
            )}
        </div>
    );
}
