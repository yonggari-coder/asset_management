// 지도 뷰어 페이지

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";

type MapMeta = { id: string; name: string; width: number; height: number };
type Item = { id: string; sku: string; name: string };
type StockLot = { item_id: string; location_id: string; qty: number };

export default function MapViewerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [meta, setMeta] = useState<MapMeta | null>(null);
  const [cells, setCells] = useState<Record<string, string | null>>({});
  const [items, setItems] = useState<Item[]>([]);
  const [stock, setStock] = useState<StockLot[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [m, c, i, s] = await Promise.all([
          fetch(`/api/maps/${id}`).then((r) => r.json()),
          fetch(`/api/maps/${id}/item-cells`).then((r) => r.json()),
          fetch("/api/items").then((r) => r.json()),
          fetch("/api/stock").then((r) => r.json()),
        ]);
        
        setMeta(m.map || null);
        
        const map: Record<string, string | null> = {};
        (c.cells || []).forEach((cc: any) => {
          map[`${cc.x},${cc.y}`] = cc.item_id;
        });
        setCells(map);
        setItems(i.items || []);
        setStock(s.stock || []);
      } catch (error: any) {
        setMsg(`❌ ${error.message || "failed"}`);
      }
    })();
  }, [id]);

  const getItemQty = (itemId: string): number => {
    return stock
      .filter((s) => s.item_id === itemId)
      .reduce((sum, s) => sum + s.qty, 0);
  };

  const getItemBorders = (x: number, y: number) => {
    const currentItem = cells[`${x},${y}`];
    if (!currentItem) return "";
    
    const borders = [];
    
    if (cells[`${x},${y - 1}`] !== currentItem) {
      borders.push("border-t-2 border-t-black");
    }
    if (cells[`${x},${y + 1}`] !== currentItem) {
      borders.push("border-b-2 border-b-black");
    }
    if (cells[`${x - 1},${y}`] !== currentItem) {
      borders.push("border-l-2 border-l-black");
    }
    if (cells[`${x + 1},${y}`] !== currentItem) {
      borders.push("border-r-2 border-r-black");
    }
    
    return borders.join(" ");
  };

  // 같은 아이템 그룹의 맨 위 왼쪽 칸인지 확인
  const isTopLeftOfGroup = (x: number, y: number, itemId: string): boolean => {
    if (cells[`${x},${y - 1}`] === itemId) return false; // 위에 같은 아이템
    if (cells[`${x - 1},${y}`] === itemId) return false; // 왼쪽에 같은 아이템
    return true;
  };

  const colorOf = (id: string) =>
    `hsl(${Math.abs(hash(id)) % 360}deg 70% 70%)`;
  function hash(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
  }

  const legend = useMemo(() => {
    const used = new Set<string>();
    Object.values(cells).forEach((v) => v && used.add(v));
    return items.filter((i) => used.has(i.id));
  }, [cells, items]);

  if (!meta)
    return (
      <main className="p-6">
        로딩중… {msg && <span className="text-red-600">{msg}</span>}
      </main>
    );

  return (
    <main className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{meta.name} (보기)</h1>
        <a href="/maps/editor" className="text-sm underline">
          편집으로 이동
        </a>
      </div>

      {/* 아이템 범례 */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-600">아이템:</span>
        {legend.map((item) => {
          const qty = getItemQty(item.id);
          return (
            <span
              key={item.id}
              className="px-2 py-1 rounded text-sm border"
              style={{ background: colorOf(item.id) }}
            >
              {item.name} ({item.sku}) - 재고: {qty}개
            </span>
          );
        })}
      </div>

      {/* 그리드 */}
      <div className="inline-block select-none">
        {Array.from({ length: meta.height }).map((_, y) => (
          <div key={y} className="flex">
            {Array.from({ length: meta.width }).map((__, x) => {
              const key = `${x},${y}`;
              const itemId = cells[key] || null;
              const color = itemId ? colorOf(itemId) : "transparent";
              const itemBorders = getItemBorders(x, y);

              const item = itemId ? items.find((i) => i.id === itemId) : null;
              const qty = itemId ? getItemQty(itemId) : 0;
              const title = item 
                ? `${item.name} (${item.sku})\n재고: ${qty}개` 
                : "";

              const showQty = itemId && isTopLeftOfGroup(x, y, itemId);

              return (
                <div
                  key={key}
                  className={`border border-gray-300 relative ${itemBorders} ${
                    itemId ? "cursor-pointer hover:opacity-80" : "opacity-40"
                  }`}
                  title={title}
                  style={{ width: 28, height: 28, background: color }}
                  onClick={() => itemId && router.push(`/items/${itemId}`)}
                >
                  {showQty && qty > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-800 pointer-events-none">
                      {qty}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        • 같은 아이템끼리는 굵은 선으로 구분됩니다.
        <br />• 숫자는 각 아이템 그룹의 총 재고 수량입니다.
        <br />• 칸을 누르면 해당 아이템 상세 페이지로 이동합니다.
      </p>
    </main>
  );
}