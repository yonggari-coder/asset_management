// 단일 맵 조회 api
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin} from "@/lib/supabaseAdmin";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sb = supabaseAdmin();
    const { data, error } = await sb.from("floor_maps").select("*").eq("id", id).single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ map: data });
}

