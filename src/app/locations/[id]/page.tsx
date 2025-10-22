// src/app/locations/[id]/page.tsx
import { notFound } from "next/navigation";

async function getLocation(id: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/locations`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "failed");
  return (json.locations as any[]).find(x => x.id === id);
}

export default async function EditLocation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const location = await getLocation(id);
  if (!location) notFound();

  return (
    <main className="p-6 max-w-xl space-y-3">
      <h1 className="text-xl font-semibold">Edit Location</h1>
      <form method="post" className="grid gap-3">
        <input name="name" defaultValue={location.name} className="border p-2 rounded" placeholder="Location Name"/>
        <select name="type" defaultValue={location.type} className="border p-2 rounded">
          <option value="warehouse">Warehouse</option>
          <option value="department">Department</option>
        </select>
        <input name="code" defaultValue={location.code || ""} className="border p-2 rounded" placeholder="Code (optional)"/>
        <div className="flex gap-2">
          <button formAction={`/locations/${location.id}/patch`} className="px-3 py-2 rounded bg-black text-white">Save</button>
          <button formAction={`/locations/${location.id}/delete`} className="px-3 py-2 rounded bg-red-600 text-white">Delete</button>
        </div>
      </form>
    </main>
  );
}