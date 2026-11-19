"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function Error({ message }: { message: string }) {
    useEffect(() => {
        toast.error(message);
    }, [message]);

    return <p role="alert">{message}</p>;
}