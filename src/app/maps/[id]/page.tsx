// 지도 뷰어 페이지

"use client";

import { useEffect, useState, useMemo} from "react";
import { useRouter, useParams} from "next/navigation";

type MapMeta = { id: string, name: string, width: number, height:number};
type Location = {id: string, name: string};
type Cell = {x: number, y: number, location_id: string | null};

export default function MapViewerPage() {
    const { id}  = useParams<{id: string}> ();
    const router = useRouter();
    const [meta, setMeta] = useState<MapMeta | null> (null);
    const [cells, setCells] = useState<Record<string, string | null>>({});
    const [locations, setLocations] = useState<Location[]>([]);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const [m, c, l] = await Promise.all([
                    fetch(`/api/maps/${id}`).then(r=>r.json()),
                    fetch(`/api/maps/${id}/cells`).then(r=>r.json()),
                    fetch("/api/locations").then(r=>r.json())
                ]);
                setMeta(m.map || null);
                const map: Record<string, string | null> = {};
                (c.cells || []).forEach((cc: any) => {
                    map[`${cc.x},${cc.y}`] = cc.location_id;
                });
                setCells(map);
                setLocations(l.locations || []);
            } catch(error: any) {
                setMsg(`❌ ${error.message || "failed"}`);
            }
        })();
    }, [id]);

     // 동일한 색 변환(에디터와 동일 규칙)
  const colorOf = (locId: string) => `hsl(${Math.abs(hash(locId)) % 360}deg 70% 70%)`;
  function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

  const legend = useMemo(() => {
    const used = new Set<string>();
    Object.values(cells).forEach(v => v && used.add(v));
    return locations.filter(l => used.has(l.id));
  }, [cells, locations]);

  if (!meta) return <main className="p-6">로딩중… {msg && <span className="text-red-600">{msg}</span>}</main>;

  return (
    <main className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{meta.name} (보기)</h1>
        <a href="/maps/editor" className="text-sm underline">편집으로 이동</a>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-600">범례:</span>
        {legend.map(l => (
          <span key={l.id} className="px-2 py-1 rounded text-sm border" style={{ background: colorOf(l.id) }}>
            {l.name}
          </span>
        ))}
      </div>

      {/* 그리드 (클릭 → /stock?location=...) */}
      <div className="inline-block select-none">
        {Array.from({ length: meta.height }).map((_, y) => (
          <div key={y} className="flex">
            {Array.from({ length: meta.width }).map((__, x) => {
              const key = `${x},${y}`;
              const locId = cells[key] || null;
              const color = locId ? colorOf(locId) : "transparent";
              const title = locId ? locations.find(l => l.id === locId)?.name : "";
              return (
                <div
                  key={key}
                  className={`border border-gray-300 ${locId ? "cursor-pointer hover:opacity-80" : "opacity-40"}`}
                  title={title}
                  style={{ width: 28, height: 28, background: color }}
                  onClick={() => locId && router.push(`/stock?location=${locId}`)}
                />
              );
            })}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        칸을 누르면 해당 위치로 필터된 재고 페이지로 이동합니다.
      </p>
    </main>
  );
}
