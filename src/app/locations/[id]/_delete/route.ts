import { NextRequest, NextResponse } from "next/server";
export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/locations/${params.id}`, { method: "DELETE" });
  if (!res.ok) return NextResponse.json(await res.json(), { status: res.status });
  return NextResponse.redirect(new URL("/locations", "http://localhost"));
}
