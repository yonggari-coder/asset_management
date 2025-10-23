// app/api/maps/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin} from "@/lib/isAdmin";

export async function GET() {
    const sb = supabaseAdmin();
    const {data, error } = await sb.from("floor_maps").select("*").order("created_at", {ascending: false});
    if(error ) return NextResponse.json({error:error.message}, {status: 400});

    return NextResponse.json({maps:data});
}

export async function POST(req: NextRequest) {
    try {
        await requireAdmin();
        const b = await req.json();
        const sb = supabaseAdmin();
        const { data, error } = await sb.from("floor_maps").insert(b).select("*").single();
        if(error) return NextResponse.json({error: error.message}, {status: 400});
        
        return NextResponse.json({map: data});
    } catch(error: any) {
        return NextResponse.json({error:error.message || "unknown"}, {status: 500});
    }
}