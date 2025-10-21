"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewLocationPage() {
  const r = useRouter();
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(form: FormData) {
    setErr(null);
    const payload = {
      name: String(form.get("name")),
      type: String(form.get("type")),
      code: String(form.get("code") || ""),
    };

    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      setErr(json.error || "failed");
      return;
    }
    r.push("/locations");
  }

  return (
    <main className="p-6 max-w-xl space-y-3">
      <h1 className="text-xl font-semibold">New Location</h1>
      {err && <p className="text-red-600">{err}</p>}
      <form action={onSubmit} className="grid gap-3">
        <input
          name="name"
          placeholder="Name (예: 본사 창고)"
          required
          className="border p-2 rounded"
        />

        <select name="type" required className="border p-2 rounded">
          <option value="">-- Select Type --</option>
          <option value="warehouse">창고 (warehouse)</option>
          <option value="department">부서 (department)</option>
        </select>

        <input
          name="code"
          placeholder="Code (예: WH-001)"
          className="border p-2 rounded"
        />

        <button className="px-3 py-2 rounded bg-black text-white">
          Create
        </button>
      </form>
    </main>
  );
}
