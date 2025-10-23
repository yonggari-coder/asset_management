// app/api/tx/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin} from "@/lib/supabaseAdmin";
import {requireAdmin} from "@/lib/isAdmin";

export async function POST(req: NextRequest) {
    try{
        await requireAdmin();
        const b = await req.json();
        if (!["in", "out", "transfer", "adjust"].includes(b?.type)) 
            return NextResponse.json({error: "invalid type"}, {status: 400});
        if(!b?.item_id || !b?.qty)
            return NextResponse.json({error: "item_id/qty required"}, {status: 400});

        const sb = supabaseAdmin();
        const {data, error} = await sb.rpc("apply_transaction", {
            p_type: b.type,
            p_item: b.item_id,
            p_from: b.from_location_id ?? null,
            p_to: b.to_location_id ?? null,
            p_qty: b.qty,
            p_note: b.note ?? null,
        });

        if(error) return NextResponse.json({error: error.message}, {status: 400});
        return NextResponse.json({ok: true, id: data});

    } catch (error: any) {
        const msg = error?.message || "unknown";
        return NextResponse.json({ error: msg} , {status: msg.includes("FORBIDDEN") ? 403 : 500});
    }
}

