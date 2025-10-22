// app/items/[id]/page.tsx
import { notFound } from "next/navigation";

async function getItem(id: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/items`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "failed");
  return (json.items as any[]).find(x => x.id === id);
}

export default async function EditItem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  return (
    <main className="p-6 max-w-xl space-y-3">
      <h1 className="text-xl font-semibold">Edit Item</h1>
      <form method="post" className="grid gap-3">
        <input name="sku" defaultValue={item.sku} className="border p-2 rounded"/>
        <input name="name" defaultValue={item.name} className="border p-2 rounded"/>
        <input name="category" defaultValue={item.category || ""} className="border p-2 rounded"/>
        <input name="unit" defaultValue={item.unit || "ea"} className="border p-2 rounded"/>
        <div className="flex gap-2">
          <button formAction={`/items/${item.id}/patch`} className="px-3 py-2 rounded bg-black text-white">Save</button>
          <button formAction={`/items/${item.id}/delete`} className="px-3 py-2 rounded bg-red-600 text-white">Delete</button>
        </div>
      </form>
    </main>
  );
}
