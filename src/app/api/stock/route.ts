import { NextResponse } from "next/server";
import { supabaseAdmin} from "@/lib/supabaseAdmin";

export async function GET() {
    const sb = supabaseAdmin();
    const {data, error} = await sb.from("stock_lots").select("item_id, location_id,qty");
    if (error) return NextResponse.json({error: error.message}, {status: 400});
    return NextResponse.json({stock:data});
}