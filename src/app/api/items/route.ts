import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin} from "@/lib/supabaseAdmin";
import { requireAdmin} from "@/lib/isAdmin";

export async function GET() {
    const sb = supabaseAdmin();
    const {data, error } = await sb.from("items").select("*").order("created_at", {ascending: false});
    if (error) return NextResponse.json({error: error.message}, {status: 400});
    return NextResponse.json({items: data});
}

export async function POST(req: NextRequest) {
    try{
        await requireAdmin();   // 관리자만 생성 가능.
        const body = await req.json(); // {sku, name, category? , unit? , photo_url? }
        if( !body?.sku || !body?.name) return NextResponse.json({error: "SKU와 이름은 필수입니다."}, {status: 400});

        const sb = supabaseAdmin();
        const {data, error } = await sb.from("items").insert({
            sku: body.sku, name: body.name, category: body.category ?? null, 
            unit: body.unit ?? "ea", photo_url: body.photo_url ?? null, spec: body.spec ?? null
        }).select("*").single();

        if (error) return NextResponse.json({error: error.message}, {status: 400});
        return NextResponse.json({item:data});
    } catch (error : any ) {
        const msg = error?.message || "unknown";
        const code = msg.includes("forbidden") ? 403: 500;
        return NextResponse.json({error:msg}, {status:code})
    }
}