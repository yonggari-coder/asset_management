// app/locations/page.tsx
import Link from "next/link";

async function getlocations() {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/locations`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "failed");
  return json.locations as any[];
}

export default async function LocationsPage() {
  const locations = await getlocations();

  return (
    <main className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">location</h1>
        <Link href="/locations/new" className="px-3 py-2 rounded bg-black text-white">+ New</Link>
      </div>

      <table className="min-w-full border">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Code</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((it) => (
            <tr key={it.id} className="border-b">
              <td className="p-2 border">{it.name}</td>
              <td className="p-2 border">{it.type || "-"}</td>
              <td className="p-2 border">{it.code || "ea"}</td>
              <td className="p-2 border">
                <Link href={`/locations/${it.id}`} className="underline">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
