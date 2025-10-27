// app/maps/editor/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type MapMeta = { id: string; name: string; width: number; height: number };
type Location = { id: string; name: string };
type Item = { id: string; sku: string; name: string };
type StockLot = { item_id: string; location_id: string; qty: number };

export default function MapEditorPage() {
  const [maps, setMaps] = useState<MapMeta[]>([]);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [meta, setMeta] = useState<MapMeta | null>(null);
  const [cells, setCells] = useState<Record<string, string | null>>({}); // key "x,y" -> item_id
  
  // 위치 관련
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  
  // 아이템 관련
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [stock, setStock] = useState<StockLot[]>([]);
  const [availableItems, setAvailableItems] = useState<Item[]>([]); // 선택된 위치의 아이템들
  
  const [paint, setPaint] = useState<string | null>(null); // item_id
  const [tool, setTool] = useState<"paint" | "erase">("paint");
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [msg, setMsg] = useState("");

  function applyRect(x1: number, y1: number, x2: number, y2: number) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    const newCells = { ...cells };
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const key = `${x},${y}`;
        newCells[key] = tool === "erase" ? null : paint;
      }
    }
    setCells(newCells);
  }

  // 초기 로드: 맵, 위치, 아이템, 재고
  useEffect(() => {
    (async () => {
      const [m, l, i, s] = await Promise.all([
        fetch("/api/maps").then((r) => r.json()),
        fetch("/api/locations").then((r) => r.json()),
        fetch("/api/items").then((r) => r.json()),
        fetch("/api/stock").then((r) => r.json()),
      ]);
      setMaps(m.maps || []);
      setLocations(l.locations || []);
      setAllItems(i.items || []);
      setStock(s.stock || []);
    })();
  }, []);

  // 위치 선택 시 → 해당 위치의 아이템들 필터링
  useEffect(() => {
    if (!selectedLocation) {
      setAvailableItems([]);
      return;
    }
    
    // 선택된 위치의 재고에서 item_id 목록 추출
    const itemIdsInLocation = stock
      .filter((s) => s.location_id === selectedLocation)
      .map((s) => s.item_id);
    
    // 해당 아이템들의 상세 정보 가져오기
    const itemsInLocation = allItems.filter((item) =>
      itemIdsInLocation.includes(item.id)
    );
    
    setAvailableItems(itemsInLocation);
  }, [selectedLocation, stock, allItems]);

  // 맵 선택 시 아이템 셀 로드
  useEffect(() => {
    setCells({});
    setMeta(null);
    if (!selectedMap) return;
    (async () => {
      const m = maps.find((x) => x.id === selectedMap);
      if (m) setMeta(m);

      const res = await fetch(`/api/maps/${selectedMap}/item-cells`);
      const j = await res.json();
      const map: Record<string, string | null> = {};
      (j.cells || []).forEach((c: any) => {
        const key = `${c.x},${c.y}`;
        map[key] = c.item_id;
      });
      setCells(map);
    })();
  }, [selectedMap, maps]);

  async function save() {
    if (!meta) return;
    setMsg("");
    const out: any[] = [];
    for (let y = 0; y < meta.height; y++) {
      for (let x = 0; x < meta.width; x++) {
        const key = `${x},${y}`;
        out.push({ x, y, item_id: cells[key] || null });
      }
    }

    const res = await fetch(`/api/maps/${meta.id}/item-cells`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cells: out }),
    });
    const j = await res.json();
    setMsg(res.ok ? "✅ 저장됨" : `❌ ${j.error || "fail"}`);
  }

  // 새 맵 만들기
  async function createMap(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || "새 맵"),
      width: Number(fd.get("width") || 20),
      height: Number(fd.get("height") || 12),
    };
    const res = await fetch("/api/maps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    if (!res.ok) return setMsg(`❌ ${j.error || "fail"}`);
    setMaps((m) => [j.map, ...m]);
    setSelectedMap(j.map.id);
    setMsg("✅ 맵 생성");
  }

  const legend = useMemo(() => {
    const colorOf = (id: string) =>
      `hsl(${Math.abs(hash(id)) % 360}deg 70% 70%)`;
    function hash(s: string) {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
      return h;
    }
    return { colorOf };
  }, []);

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">맵 에디터</h1>
      {msg && (
        <div
          className={`text-sm ${
            msg.startsWith("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {msg}
        </div>
      )}

      {/* 맵 선택 / 생성 */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">맵 선택</label>
          <select
            value={selectedMap || ""}
            onChange={(e) => setSelectedMap(e.target.value || null)}
            className="border rounded px-3 py-2"
          >
            <option value="">(없음)</option>
            {maps.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.width}×{m.height})
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={createMap} className="flex items-end gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">이름</label>
            <input
              name="name"
              placeholder="사무실 1층"
              className="border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">가로</label>
            <input
              name="width"
              type="number"
              defaultValue={20}
              min={1}
              max={200}
              className="border rounded px-2 py-2 w-24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">세로</label>
            <input
              name="height"
              type="number"
              defaultValue={12}
              min={1}
              max={200}
              className="border rounded px-2 py-2 w-24"
            />
          </div>
          <button className="px-3 py-2 border rounded">맵 만들기</button>
        </form>
      </div>

      {/* 위치 선택 */}
      <div className="flex items-center gap-2 p-3 bg-gray-100 rounded">
        <label className="text-sm font-semibold">위치 선택:</label>
        <select
          value={selectedLocation || ""}
          onChange={(e) => setSelectedLocation(e.target.value || null)}
          className="border rounded px-3 py-2"
        >
          <option value="">(위치를 선택하세요)</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
        {selectedLocation && (
          <span className="text-sm text-gray-600">
            → {availableItems.length}개 아이템 사용 가능
          </span>
        )}
      </div>

      {/* 아이템 팔레트 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm text-gray-600 mr-2">아이템:</div>
        <button
          onClick={() => setTool("paint")}
          className={`px-2 py-1 border rounded text-sm ${
            tool === "paint" ? "bg-black text-white" : ""
          }`}
        >
          배치
        </button>
        <button
          onClick={() => setTool("erase")}
          className={`px-2 py-1 border rounded text-sm ${
            tool === "erase" ? "bg-black text-white" : ""
          }`}
        >
          지우기
        </button>

        {availableItems.length > 0 ? (
          availableItems.map((item) => {
            const active = paint === item.id && tool === "paint";
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTool("paint");
                  setPaint(item.id);
                }}
                className={`px-2 py-1 rounded text-sm border ${
                  active ? "ring-2 ring-black" : ""
                }`}
                style={{ background: legend.colorOf(item.id) }}
              >
                {item.name} ({item.sku})
              </button>
            );
          })
        ) : (
          <span className="text-sm text-gray-400 italic">
            위치를 먼저 선택하세요
          </span>
        )}

        <div className="ml-auto">
          <button onClick={save} className="px-3 py-2 border rounded">
            저장
          </button>
        </div>
      </div>

      {/* 그리드 */}
      {meta ? (
        <div
          className="inline-block select-none relative"
          onMouseLeave={() => {
            setDragging(false);
            setDragStart(null);
            setDragEnd(null);
          }}
          onMouseUp={() => {
            if (dragging && dragStart && dragEnd) {
              applyRect(dragStart.x, dragStart.y, dragEnd.x, dragEnd.y);
            }
            setDragging(false);
            setDragStart(null);
            setDragEnd(null);
          }}
        >
          {Array.from({ length: meta.height }).map((_, y) => (
            <div key={y} className="flex">
              {Array.from({ length: meta.width }).map((__, x) => {
                const key = `${x},${y}`;
                const cellId = cells[key] || null;
                const color = cellId ? legend.colorOf(cellId) : "transparent";
                const itemName = cellId
                  ? allItems.find((i) => i.id === cellId)?.name
                  : "";
                return (
                  <div
                    key={key}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setDragging(true);
                      setDragStart({ x, y });
                      setDragEnd({ x, y });
                    }}
                    onMouseEnter={() => {
                      if (dragging) {
                        setDragEnd({ x, y });
                      }
                    }}
                    className="border border-gray-300"
                    style={{ width: 24, height: 24, background: color }}
                    title={itemName || ""}
                  />
                );
              })}
            </div>
          ))}

          {/* 드래그 프리뷰 */}
          {dragging && dragStart && dragEnd && (
            <div
              className="absolute pointer-events-none border-2 border-blue-500 bg-blue-200 bg-opacity-30"
              style={{
                left: Math.min(dragStart.x, dragEnd.x) * 24,
                top: Math.min(dragStart.y, dragEnd.y) * 24,
                width: (Math.abs(dragEnd.x - dragStart.x) + 1) * 24,
                height: (Math.abs(dragEnd.y - dragStart.y) + 1) * 24,
              }}
            />
          )}
        </div>
      ) : (
        <p className="text-gray-500">왼쪽에서 맵을 선택하거나 새로 만들기</p>
      )}
    </main>
  );
}