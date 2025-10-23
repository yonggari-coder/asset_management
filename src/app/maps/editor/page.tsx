// app/maps/editor/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type MapMeta = { id: string; name: string; width: number; height: number };
type Location = { id: string; name: string };

export default function MapEditorPage() {
  const [maps, setMaps] = useState<MapMeta[]>([]);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [meta, setMeta] = useState<MapMeta | null>(null);
  const [cells, setCells] = useState<Record<string, string|null>>({}); // key "x,y" -> location_id|null
  const [locations, setLocations] = useState<Location[]>([]);
  const [paint, setPaint] = useState<string | null>(null); // location_id
  const [tool, setTool] = useState<"paint"|"erase">("paint");
  const [dragging, setDragging] = useState(false);
  const [msg, setMsg] = useState("");

  // 초기 로드: 맵 목록 + 위치 목록
  useEffect(() => {
    (async () => {
      const [m, l] = await Promise.all([
        fetch("/api/maps").then(r=>r.json()),
        fetch("/api/locations").then(r=>r.json())
      ]);
      setMaps(m.maps||[]);
      setLocations(l.locations||[]);
    })();
  }, []);

  // 맵 선택 시 셀 로드
  useEffect(() => {
    setCells({});
    setMeta(null);
    if (!selectedMap) return;
    (async () => {
      const m = maps.find(x => x.id === selectedMap);
      if (m) setMeta(m);
      const res = await fetch(`/api/maps/${selectedMap}/cells`);
      const j = await res.json();
      const map: Record<string,string|null> = {};
      (j.cells||[]).forEach((c:any)=>{
        map[`${c.x},${c.y}`] = c.location_id;
      });
      setCells(map);
    })();
  }, [selectedMap, maps]);

  // 새 맵 만들기
  async function createMap(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")||"새 맵"),
      width: Number(fd.get("width")||20),
      height: Number(fd.get("height")||12),
    };
    const res = await fetch("/api/maps", {
      method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload)
    });
    const j = await res.json();
    if (!res.ok) return setMsg(`❌ ${j.error||"fail"}`);
    setMaps(m=>[j.map, ...m]);
    setSelectedMap(j.map.id);
    setMsg("✅ 맵 생성");
  }

  // 칠하기
  function applyAt(x:number, y:number) {
    const key = `${x},${y}`;
    setCells(prev => ({ ...prev, [key]: tool==="erase" ? null : paint }));
  }

  async function save() {
    if (!meta) return;
    setMsg("");
    const out: any[] = [];
    for (let y=0; y<meta.height; y++) {
      for (let x=0; x<meta.width; x++) {
        const key = `${x},${y}`;
        out.push({ x, y, location_id: cells[key] || null });
      }
    }
    const res = await fetch(`/api/maps/${meta.id}/cells`, {
      method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ cells: out })
    });
    const j = await res.json();
    setMsg(res.ok ? "✅ 저장됨" : `❌ ${j.error||"fail"}`);
  }

  const legend = useMemo(()=> {
    // 색상은 간단히 HSL 로케이션별 일정하게
    const colorOf = (id:string)=> `hsl(${Math.abs(hash(id))%360}deg 70% 70%)`;
    function hash(s:string){ let h=0; for (let i=0;i<s.length;i++) h=(h*31 + s.charCodeAt(i))|0; return h; }
    return { colorOf };
  }, []);

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">맵 에디터</h1>
      {msg && <div className={`text-sm ${msg.startsWith("✅")?"text-green-600":"text-red-600"}`}>{msg}</div>}

      {/* 맵 선택 / 생성 */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">맵 선택</label>
          <select value={selectedMap || ""} onChange={e=>setSelectedMap(e.target.value||null)} className="border rounded px-3 py-2">
            <option value="">(없음)</option>
            {maps.map(m=> <option key={m.id} value={m.id}>{m.name} ({m.width}×{m.height})</option>)}
          </select>
        </div>

        <form onSubmit={createMap} className="flex items-end gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">이름</label>
            <input name="name" placeholder="사무실 1층" className="border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">가로</label>
            <input name="width" type="number" defaultValue={20} min={1} max={200} className="border rounded px-2 py-2 w-24" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">세로</label>
            <input name="height" type="number" defaultValue={12} min={1} max={200} className="border rounded px-2 py-2 w-24" />
          </div>
          <button className="px-3 py-2 border rounded">맵 만들기</button>
        </form>
      </div>

      {/* 팔레트 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm text-gray-600 mr-2">팔레트(위치):</div>
        <button onClick={()=>setTool("paint")} className={`px-2 py-1 border rounded text-sm ${tool==="paint"?"bg-black text-white":""}`}>칠하기</button>
        <button onClick={()=>setTool("erase")} className={`px-2 py-1 border rounded text-sm ${tool==="erase"?"bg-black text-white":""}`}>지우기</button>
        {locations.map(l=>{
          const active = paint===l.id && tool==="paint";
          return (
            <button key={l.id} onClick={()=>{ setTool("paint"); setPaint(l.id); }}
              className={`px-2 py-1 rounded text-sm border ${active?"ring-2 ring-black":""}`}
              style={{ background: legend.colorOf(l.id) }}>
              {l.name}
            </button>
          );
        })}
        <div className="ml-auto">
          <button onClick={save} className="px-3 py-2 border rounded">저장</button>
        </div>
      </div>

      {/* 그리드 */}
      {meta ? (
        <div
          className="inline-block select-none"
          onMouseLeave={()=>setDragging(false)}
          onMouseUp={()=>setDragging(false)}
        >
          {Array.from({ length: meta.height }).map((_, y) => (
            <div key={y} className="flex">
              {Array.from({ length: meta.width }).map((__, x) => {
                const key = `${x},${y}`;
                const locId = cells[key] || null;
                const color = locId ? legend.colorOf(locId) : "transparent";
                return (
                  <div
                    key={key}
                    onMouseDown={(e)=>{ e.preventDefault(); setDragging(true); applyAt(x,y); }}
                    onMouseEnter={()=> dragging && applyAt(x,y)}
                    onClick={()=> applyAt(x,y)}
                    className="border border-gray-300"
                    style={{ width: 24, height: 24, background: color }}
                    title={locId ? locations.find(l=>l.id===locId)?.name : ""}
                  />
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">왼쪽에서 맵을 선택하거나 새로 만들기</p>
      )}
    </main>
  );
}
