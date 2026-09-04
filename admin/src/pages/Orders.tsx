import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import { som, when } from "../ui/format";
import { Empty, Failed, Waiting } from "../ui/parts";

type Status = "" | "pending" | "paid" | "cancelled" | "failed";

const FILTERS: { value: Status; label: string }[] = [
  { value: "", label: "Hammasi" },
  { value: "pending", label: "To'lanmagan" },
  { value: "paid", label: "To'langan" },
  { value: "cancelled", label: "Bekor qilingan" },
];

const LABEL: Record<string, string> = {
  pending: "kutilmoqda",
  paid: "to'langan",
  cancelled: "bekor",
  failed: "xato",
};

export default function Orders() {
  const [status, setStatus] = useState<Status>("");

  const orders = useQuery({
    queryKey: ["buyurtmalar", status],
    queryFn: async () => {
      const { data, error } = await api.GET("/boshqaruv/buyurtmalar", {
        params: { query: status ? { holat: status } : {} },
      });
      if (error || !data) throw new Error("O'qilmadi");
      return data.buyurtmalar;
    },
  });

  return (
    <div>
      <div className="mb-5 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatus(f.value)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              status === f.value
                ? "bg-lime text-flex-black"
                : "border border-flex-black/10 text-flex-black/60 hover:text-flex-black"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {orders.isPending && <Waiting />}
      {orders.isError && <Failed>Buyurtmalar o'qilmadi.</Failed>}
      {orders.data?.length === 0 && <Empty>Bu holatda buyurtma yo'q.</Empty>}

      {orders.data && orders.data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-flex-black/45 text-xs">
              <tr>
                <th className="pb-2 font-medium">Raqam</th>
                <th className="pb-2 font-medium">Xaridor</th>
                <th className="pb-2 font-medium">Summa</th>
                <th className="pb-2 font-medium">Holat</th>
                <th className="pb-2 font-medium">Ochilgan</th>
              </tr>
            </thead>
            <tbody>
              {orders.data.map((o) => (
                <tr key={o.id} className="border-flex-black/5 border-t">
                  <td className="py-2.5 font-medium">{o.raqam}</td>
                  <td className="py-2.5 text-flex-black/60">{o.xaridor || "—"}</td>
                  <td className="py-2.5 tabular-nums">{som(o.summa)}</td>
                  <td className="py-2.5">
                    <span
                      className={
                        o.holat === "paid"
                          ? "text-lime-ink"
                          : o.holat === "pending"
                            ? "text-amber-700"
                            : "text-flex-black/40"
                      }
                    >
                      {LABEL[o.holat] ?? o.holat}
                    </span>
                    {o.tolov && <span className="ml-1 text-flex-black/35">· {o.tolov}</span>}
                  </td>
                  <td className="py-2.5 text-flex-black/45">{when(o.ochilgan)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
