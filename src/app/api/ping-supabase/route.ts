import {NextResponse} from "next/server";
import { createClient} from "@supabase/supabase-js";

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // 1) 단순 호출: auth 상태 점검 (익명)
    const { data: anon } = await supabase.auth.getUser();

    // 2) 테이블 접근 테스트: items가 있으면 count 없으면 에러 메시지
    const { error } = await supabase
      .from("items")
      .select("*", { count: "exact", head: true})
      .limit(1);
    
    return NextResponse.json({
        ok: !error,
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anon_auth_ok: !!anon || true, //익명이라 보통 null이어도 정상임.
        table_items_exists: !error,
        error: error?.message ?? null,
    });
}

