"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// 폼 스키마 (유효성 검사)
const TxSchema = z.object({
  type: z.enum(["in", "out", "transfer", "adjust"]),
  item_id: z.string().min(1, "품목 선택은 필수"),
  from_location_id: z.string().optional(),
  to_location_id: z.string().optional(),
  qty: z
    .number({ message: "수량은 숫자" })
    .positive("수량은 0보다 커야 함"),
  note: z.string().optional(),
});

type TxForm = z.infer<typeof TxSchema>;

type Item = { id: string; sku: string; name: string };
type Location = { id: string; name: string };

export default function TxPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch("/api/items", { cache: "no-store" }).then(r => r.json()),
      fetch("/api/locations", { cache: "no-store" }).then(r => r.json()),
    ]).then(([i, l]) => {
      setItems(i.items || []);
      setLocations(l.locations || []);
    }).catch(e => setMsg(String(e)));
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<TxForm>({
    resolver: zodResolver(TxSchema),
    defaultValues: { type: "in", qty: 1 },
  });

  const type = watch("type");

  // 선택 타입에 따라 from/to 필드 활성화/비활성
  const showFrom = type === "out" || type === "transfer" || type === "adjust";
  const showTo   = type === "in"  || type === "transfer" || type === "adjust";

  // adjust(-/+) 동작 보조 버튼
  const isAdjust = type === "adjust";

  const onSubmit = async (data: TxForm) => {
    setMsg("");
    // 빈 문자열을 null로 정리
    const payload = {
      ...data,
      from_location_id: data.from_location_id ? data.from_location_id : null,
      to_location_id: data.to_location_id ? data.to_location_id : null,
    };
    const res = await fetch("/api/tx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      setMsg(`❌ ${res.status}: ${text}`);
      return;
    }
    setMsg("✅ 처리되었습니다.");
    reset({ type, qty: 1 }); // 같은 타입 유지
  };

  // 빠른 +1/-1 (현재 폼의 item/location을 재사용)
  async function quick(type: "in" | "out") {
    const f = watch();
    if (!f.item_id) return setMsg("품목을 먼저 선택하세요.");
    const payload = {
      type,
      item_id: f.item_id,
      from_location_id: type === "out" ? f.from_location_id ?? null : null,
      to_location_id:   type === "in"  ? f.to_location_id   ?? null : null,
      qty: 1,
      note: `${type} quick`,
    };
    setMsg("");
    const res = await fetch("/api/tx", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    const text = await res.text();
    setMsg(res.ok ? "✅ +1/-1 반영됨" : `❌ ${res.status}: ${text}`);
  }

  // UX: 타입 변경 시 from/to 초기화
  useEffect(() => {
    setValue("from_location_id", undefined);
    setValue("to_location_id", undefined);
  }, [type, setValue]);

  return (
    <main className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">입·출고·이동</h1>

      {process.env.NODE_ENV === "development" && (
        <p className="text-xs text-gray-500">
          items:{items.length} / locations:{locations.length}
        </p>
      )}

      {msg && (
        <div className={`p-2 rounded text-sm ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 border rounded p-4 bg-white">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-1">유형</label>
          <select {...register("type")} className="border rounded px-3 py-2">
            <option value="in">입고</option>
            <option value="out">출고</option>
            <option value="transfer">이동</option>
            <option value="adjust">조정</option>
          </select>
        </div>

        {/* Item */}
        <div>
          <label className="block text-sm font-medium mb-1">품목</label>
          <select {...register("item_id")} className="border rounded px-3 py-2">
            <option value="">품목 선택</option>
            {items.map(it => (
              <option key={it.id} value={it.id}>
                {it.sku} — {it.name}
              </option>
            ))}
          </select>
          {errors.item_id && <p className="text-red-600 text-sm mt-1">{errors.item_id.message}</p>}
        </div>

        {/* From/To (type에 따라 표시) */}
        {showFrom && (
          <div>
            <label className="block text-sm font-medium mb-1">From (출고 위치)</label>
            <select {...register("from_location_id")} className="border rounded px-3 py-2">
              <option value="">(없음)</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        )}

        {showTo && (
          <div>
            <label className="block text-sm font-medium mb-1">To (입고 위치)</label>
            <select {...register("to_location_id")} className="border rounded px-3 py-2">
              <option value="">(없음)</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* qty / note */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">수량</label>
            <input
              type="number"
              step="1"
              min={isAdjust ? "0.0001" : "1"}
              defaultValue={1}
              {...register("qty", { valueAsNumber: true })}
              className="border rounded px-3 py-2 w-full"
            />
            {errors.qty && <p className="text-red-600 text-sm mt-1">{errors.qty.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">비고(선택)</label>
            <input {...register("note")} className="border rounded px-3 py-2 w-full" placeholder="메모" />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-2">
          <button
            disabled={isSubmitting}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-60"
            type="submit"
          >
            {isSubmitting ? "처리중…" : "실행"}
          </button>

          {/* 빠른 +1/-1 */}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => quick("in")} className="px-3 py-2 border rounded">+1</button>
            <button type="button" onClick={() => quick("out")} className="px-3 py-2 border rounded">-1</button>
          </div>
        </div>
      </form>

      {/* 설명 */}
      <ul className="text-xs text-gray-500 list-disc pl-5">
        <li><b>입고</b>: To만 사용</li>
        <li><b>출고</b>: From만 사용 (해당 위치에 재고가 있어야 함)</li>
        <li><b>이동</b>: From → To 둘 다 선택</li>
        <li><b>조정</b>: From/To 중 하나 선택 후 실제 수량 맞춰 잡기(증가/감소)</li>
      </ul>
    </main>
  );
}
