import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await db.$runCommandRaw({ ping: 1 });

        return NextResponse.json(
            { status: "ok", database: "connected" },
            { status: 200 }
        );
    } catch {
        return NextResponse.json(
            { status: "error", database: "disconnected" },
            { status: 503 }
        );
    }
}
