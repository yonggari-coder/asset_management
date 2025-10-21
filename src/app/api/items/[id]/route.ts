// app/api/items/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/isAdmin";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();
    const sb = supabaseAdmin();
    const { data, error } = await sb.from("items").update({
      sku: body.sku, name: body.name, category: body.category ?? null,
      unit: body.unit ?? "ea", photo_url: body.photo_url ?? null, spec: body.spec ?? null
    }).eq("id", params.id).select("*").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ item: data });
  } catch (e:any) {
    const msg = e?.message || "unknown";
    const code = msg.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const sb = supabaseAdmin();
    const { error } = await sb.from("items").delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    const msg = e?.message || "unknown";
    const code = msg.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}