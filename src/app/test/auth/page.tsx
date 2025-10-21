"use client";

import { useEffect, useState} from "react";
import { signIn, signOut} from "next-auth/react";

export default function TestAuthPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        //클라이언트에서 /api/auth/session을 조회함.
        fetch("/api/auth/session")
        .then((r)=>r.json())
        .then((s)=> setUser(s?.user ?? null))
        .catch(() => setUser(null));
    }, []);

    return (
        <div style={{ padding: 20 }}>
          <h1>NextAuth 세션 테스트</h1>
          <pre>현재 사용자: {user ? JSON.stringify(user, null, 2) : "로그아웃 상태"}</pre>
    
          {!user ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const email = (e.currentTarget as any).email.value;
                const password = (e.currentTarget as any).password.value;
                await signIn("credentials", {
                  redirect: false,
                  email,
                  password,
                });
                location.reload();
              }}
              style={{ display: "grid", gap: 8, maxWidth: 320 }}
            >
              <input name="email" placeholder="email" defaultValue="you@example.com" />
              <input name="password" placeholder="password (test1234)" type="password" defaultValue="test1234" />
              <button type="submit">로그인</button>
            </form>
          ) : (
            <button onClick={() => signOut({ redirect: false }).then(() => location.reload())}>
              로그아웃
            </button>
          )}
        </div>
    );
}