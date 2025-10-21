import { NextRequest, NextResponse } from "next/server";
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/items/${id}`, { method: "DELETE" });
  if (!res.ok) return NextResponse.json(await res.json(), { status: res.status });
  return NextResponse.redirect(new URL("/locations", "http://localhost"));
}
