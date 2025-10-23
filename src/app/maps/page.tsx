// app/maps/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type MapMeta = { id: string; name: string; width: number; height: number };

export default function MapsIndexPage() {
  const [maps, setMaps] = useState<MapMeta[]>([]);
  useEffect(() => {
    fetch("/api/maps", { cache: "no-store" })
      .then(r => r.json())
      .then(j => setMaps(j.maps || []));
  }, []);

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Maps</h1>
      <div className="flex gap-2">
        <Link href="/maps/editor" className="px-3 py-2 border rounded">+ Create map</Link>
      </div>
      <ul className="grid gap-2">
        {maps.map(m => (
          <li key={m.id} className="border rounded p-3 flex justify-between">
            <div>
              <div className="font-medium">{m.name}</div>
              <div className="text-xs text-gray-500">{m.width}×{m.height}</div>
            </div>
            <Link href={`/maps/${m.id}`} className="underline">Open</Link>
          </li>
        ))}
        {maps.length === 0 && <li className="text-gray-500">아직 맵이 없습니다.</li>}
      </ul>
    </main>
  );
}