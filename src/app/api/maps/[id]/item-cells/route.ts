// app/api/maps/[id]/item-cells/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin} from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/isAdmin";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sb = supabaseAdmin();
    const {data, error} = await sb.from("item_cells").select("x,y,item_id").eq("map_id", id);
    if(error) return NextResponse.json({error: error.message}, {status: 400});
    return NextResponse.json({cells:data});
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const body = await req.json();
        const { id } = await params;
        const sb = supabaseAdmin();

        // 기존 셀 삭제
        const del = await sb.from("item_cells").delete().eq("map_id", id);
        if(del.error) return NextResponse.json({error: del.error.message}, {status:400});

        // 새 셀 삽입
        const rows = (body.cells || []).map((c:any) => ({
            map_id: id, x: c.x, y: c.y, item_id: c.item_id
        }));
        if(rows.length){
            const ins = await sb.from("item_cells").insert(rows);
            if (ins.error) return NextResponse.json({error: ins.error.message}, {status:400});
        }
        return NextResponse.json({ok: true});
    } catch(error: any) {
        return NextResponse.json({error:error.message || "unknown"}, {status: 500});
    }
}