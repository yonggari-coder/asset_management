import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const apiUrl = new URL(`/api/items/${id}`, req.url);
  const res = await fetch(apiUrl.toString(), { method: "DELETE",
    headers: {
      cookie: req.headers.get("cookie") || "",
    },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json(await res.json(), { status: res.status });
  return NextResponse.redirect(new URL("/items", req.url));
}
