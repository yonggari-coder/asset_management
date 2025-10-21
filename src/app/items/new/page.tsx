// app/items/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewItemPage() {
  const r = useRouter();
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(form: FormData) {
    setErr(null);
    const payload = {
      sku: String(form.get("sku")),
      name: String(form.get("name")),
      category: String(form.get("category") || ""),
      unit: String(form.get("unit") || "ea"),
    };
    const res = await fetch("/api/items", { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    const json = await res.json();
    if (!res.ok) { setErr(json.error || "failed"); return; }
    r.push("/items");
  }

  return (
    <main className="p-6 max-w-xl space-y-3">
      <h1 className="text-xl font-semibold">New Item</h1>
      {err && <p className="text-red-600">{err}</p>}
      <form action={onSubmit} className="grid gap-3">
        <input name="sku" placeholder="SKU" required className="border p-2 rounded"/>
        <input name="name" placeholder="Name" required className="border p-2 rounded"/>
        <input name="category" placeholder="Category" className="border p-2 rounded"/>
        <input name="unit" placeholder="Unit (ea)" className="border p-2 rounded" defaultValue="ea"/>
        <button className="px-3 py-2 rounded bg-black text-white">Create</button>
      </form>
    </main>
  );
}
