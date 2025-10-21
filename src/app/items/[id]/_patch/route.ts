import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const form = await req.formData();
  const payload = {
    sku: String(form.get("sku") || ""),
    name: String(form.get("name") || ""),
    category: String(form.get("category") || ""),
    unit: String(form.get("unit") || "ea"),
  };
  const { id } = await params;
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) return NextResponse.json(json, { status: res.status });
  return NextResponse.redirect(new URL("/items", req.url));
}

