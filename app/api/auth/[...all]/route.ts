import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        return await toNextJsHandler(getAuth()).GET(request);
    } catch {
        return Response.json(null, { status: 200 });
    }
}

export async function POST(request: Request) {
    try {
        return await toNextJsHandler(getAuth()).POST(request);
    } catch {
        return Response.json({ error: "Auth is not configured." }, { status: 503 });
    }
}
