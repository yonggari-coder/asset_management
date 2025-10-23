"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import Papa from "papaparse";
import { useSearchParams } from "next/navigation";

type Item = { id: string; sku: string; name: string };
type Location = { id: string; name: string };
type StockRow = {
  itemId: string;
  sku: string;
  name: string;
  // 동적: loc:<locationId> 형식으로 수량 보관
  [dyn: `loc:${string}`]: number;
  total: number;
};

export default function StockPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stock, setStock] = useState<{ item_id: string; location_id: string; qty: number }[]>([]);
  const [q, setQ] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "sku", desc: false }]);

  useEffect(() => {
    (async () => {
      const [i, l, s] = await Promise.all([
        fetch("/api/items", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/locations", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/stock", { cache: "no-store" }).then(r => r.json()),
      ]);
      setItems(i.items || []);
      setLocations(l.locations || []);
      setStock(s.stock || []);
    })();
  }, []);

  // stock pivot → 행: item, 열: location
  const rows: StockRow[] = useMemo(() => {
    const qtyMap = new Map<string, number>(); // key: `${itemId}:${locId}`
    stock.forEach(s => {
      qtyMap.set(`${s.item_id}:${s.location_id}`, Number(s.qty) || 0);
    });

    return items
      .filter(x =>
        q
          ? [x.sku, x.name].join(" ").toLowerCase().includes(q.toLowerCase())
          : true
      )
      .map<StockRow>(it => {
        const r: StockRow = {
          itemId: it.id,
          sku: it.sku,
          name: it.name,
          total: 0,
        };
        let sum = 0;
        locations.forEach(loc => {
          const k = `loc:${loc.id}` as const;
          const v = qtyMap.get(`${it.id}:${loc.id}`) || 0;
          r[k] = v;
          sum += v;
        });
        r.total = sum;
        return r;
      });
  }, [items, locations, stock, q]);

  // 동적 컬럼 정의
  const columns = useMemo<ColumnDef<StockRow>[]>(() => {
    const base: ColumnDef<StockRow>[] = [
      {
        id: "sku",
        header: "SKU",
        accessorKey: "sku",
        cell: ({ getValue }) => <span className="font-medium">{String(getValue())}</span>,
      },
      {
        id: "name",
        header: "Name",
        accessorKey: "name",
        cell: ({ getValue }) => <span>{String(getValue())}</span>,
      },
    ];

    const locCols: ColumnDef<StockRow>[] = locations.map(loc => ({
      id: `loc:${loc.id}`,
      header: loc.name,
      accessorKey: `loc:${loc.id}`,
      cell: ({ getValue }) => <div className="text-left tabular-nums">{Number(getValue() || 0)}</div>,
      sortingFn: "alphanumeric",
    }));
    
    const actionCol: ColumnDef<StockRow>[] = [
    {
        id:"action",
        header:"Action",
        cell:({row}) => <RowActions row={row.original} />
    }];

    //합계행
    const tail: ColumnDef<StockRow>[] = [
      {
        id: "total",
        header: "합계",
        accessorKey: "total",
        cell: ({ getValue }) => (
          <div className="text-left font-semibold tabular-nums">{Number(getValue() || 0)}</div>
        ),
        sortingFn: "alphanumeric",
      },
    ];

    return [...base, ...locCols, ...tail];
  }, [locations]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // enableSortingRemoval: false,
  });

  //기존
  // const totals: Record<string, number> = {};
  // const key = `Loc:$

  // 테이블 풋터(합계행)
  const footerTotals = useMemo(() => {
    const totals: Record<`loc:${string}` | "total", number> = { total: 0 };
    locations.forEach(loc => {
      const key: `loc:${string}` = `loc:${loc.id}`;
      totals[key] = rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
    });
    totals["total"] = rows.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
    return totals;
  }, [rows, locations]);

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">재고 현황</h1>
        <div className="flex gap-2">
          <input
            placeholder="검색: SKU, Name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />

        </div>
      </div>

      <div className="overflow-auto rounded border">
        <table className="min-w-[800px] w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className="p-2 border-b text-left font-medium select-none cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      <SortIcon dir={h.column.getIsSorted()} />
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(r => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                {r.getVisibleCells().map(c => (
                  <td key={c.id} className="p-2 align-middle whitespace-nowrap text-left">
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={table.getAllLeafColumns().length} className="p-6 text-center text-gray-500">
                  데이터 없음
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-gray-50 font-medium">
              <tr>
                {/* SKU, Name는 공란 */}
                <td className="p-2">합계</td>
                <td className="p-2"></td>
                {locations.map(loc => (
                  <td key={`f-${loc.id}`} className="p-2 text-left tabular-nums">
                    {footerTotals[`loc:${loc.id}`] || 0}
                  </td>
                ))}
                <td className="p-2 text-left tabular-nums">{footerTotals["total"] || 0}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <style jsx>{`
        /* 첫 두 컬럼 고정(수평 스크롤 시 가독성↑) */
        thead th:nth-child(1),
        tbody td:nth-child(1),
        tfoot td:nth-child(1) {
          position: sticky; left: 0; background: white; z-index: 11;
        }
        thead th:nth-child(2),
        tbody td:nth-child(2),
        tfoot td:nth-child(2) {
          position: sticky; left: 160px; background: white; z-index: 11;
        }
        thead th:nth-child(1), thead th:nth-child(2) { background: #f9fafb; }
      `}</style>
    </main>
  );
}

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  if (dir === "asc") return <span>▲</span>;
  if (dir === "desc") return <span>▼</span>;
  return <span className="opacity-20">↕</span>;
}

function RowActions({ row }: { row: StockRow }) {
    async function postTx(type: "in"|"out") {
      const payload = { type, item_id: row.itemId, qty: 1 };
      const res = await fetch("/api/tx", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) alert((await res.json()).error || "fail");
      else location.reload(); // 간단 갱신(원하면 SWR로 대체)
    }
    return (
      <div className="flex gap-1">
        <button onClick={()=>postTx("in")} className="px-2 py-1 border rounded text-xs">+1</button>
        <button onClick={()=>postTx("out")} className="px-2 py-1 border rounded text-xs">-1</button>
      </div>
    );
  }