"use client";
import { useEffect, useState } from "react";

export default function TestSupabasePage(){ 
    const [res, setRes] = useState<any>(null);
    useEffect(() => {
        fetch("/api/ping-supabase")
        .then ((r)=> r.json())
        .then (setRes)
        .catch ((e)=> setRes({ok: false, error: String(e)}));
    },[]);

    return (
        <div style={{ padding: 20 }}>
          <h1>Supabase 연결 테스트</h1>
          <pre>{JSON.stringify(res, null, 2)}</pre>
          <p>※ items 테이블이 없으면 <code>table_items_exists=false</code> 로 나옵니다.</p>
        </div>
    );
}
