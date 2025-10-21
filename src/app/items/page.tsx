// app/items/page.tsx
import Link from "next/link";

async function getItems() {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/items`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "failed");
  return json.items as any[];
}

export default async function ItemsPage() {
  const items = await getItems();

  return (
    <main className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Items</h1>
        <Link href="/items/new" className="px-3 py-2 rounded bg-black text-white">+ New</Link>
      </div>

      <table className="min-w-full border">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 border">SKU</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Category</th>
            <th className="p-2 border">Unit</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b">
              <td className="p-2 border">{it.sku}</td>
              <td className="p-2 border">{it.name}</td>
              <td className="p-2 border">{it.category || "-"}</td>
              <td className="p-2 border">{it.unit || "ea"}</td>
              <td className="p-2 border">
                <Link href={`/items/${it.id}`} className="underline">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
