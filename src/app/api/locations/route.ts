// app/api/locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/isAdmin";

export async function GET() {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("locations").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ locations: data });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json(); // {name,type,code?}
    if (!body?.name || !body?.type) return NextResponse.json({ error: "name/type required" }, { status: 400 });

    const sb = supabaseAdmin();
    const { data, error } = await sb.from("locations").insert({
      name: body.name, type: body.type, code: body.code ?? null
    }).select("*").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ location: data });
  } catch (e:any) {
    const msg = e?.message || "unknown";
    const code = msg.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}
