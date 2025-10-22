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

  const apiUrl = new URL(`/api/items/${id}`, req.url);
  const res = await fetch(apiUrl.toString(), {
    method: "PATCH",
    headers: { "Content-Type": "application/json",
      cookie: req.headers.get("cookie") || "",
    },
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) return NextResponse.json(await res.json(), { status: res.status });
  return NextResponse.redirect(new URL("/items", req.url));
}

