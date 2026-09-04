import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import { som, when } from "../ui/format";
import { Empty, Failed, Waiting } from "../ui/parts";

// Searching for a number — by the number, by the name on it, or by who owns it.
//
// This screen exists because the answer to "who has AAA777" has been a psql
// session, and a question that needs a psql session is a question nobody asks.
export default function Handles() {
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState("");

  const handles = useQuery({
    queryKey: ["raqamlar", search],
    queryFn: async () => {
      const { data, error } = await api.GET("/boshqaruv/raqamlar", {
        params: { query: search ? { qidiruv: search } : {} },
      });
      if (error || !data) throw new Error("O'qilmadi");
      return data.raqamlar;
    },
  });

  return (
    <div>
      <form
        className="mb-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(term.trim());
        }}
      >
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Raqam, ism yoki email"
          className="flex-1 rounded-lg bg-flex-black/4 px-4 py-2.5 text-sm outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-lime px-4 py-2.5 font-medium text-flex-black text-sm"
        >
          Qidirish
        </button>
      </form>

      {handles.isPending && <Waiting />}
      {handles.isError && <Failed>Raqamlar o'qilmadi.</Failed>}
      {handles.data?.length === 0 && <Empty>Hech nima topilmadi.</Empty>}

      {handles.data && handles.data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-flex-black/45 text-xs">
              <tr>
                <th className="pb-2 font-medium">Raqam</th>
                <th className="pb-2 font-medium">Egasi</th>
                <th className="pb-2 font-medium">Tarif</th>
                <th className="pb-2 font-medium">To'langan</th>
                <th className="pb-2 font-medium">Olingan</th>
              </tr>
            </thead>
            <tbody>
              {handles.data.map((h) => (
                <tr key={h.raqam} className="border-flex-black/5 border-t">
                  <td className="py-2.5 font-medium">
                    {h.raqam}
                    {h.holat !== "claimed" && (
                      <span className="ml-2 text-amber-700 text-xs">{h.holat}</span>
                    )}
                  </td>
                  <td className="py-2.5 text-flex-black/60">
                    {h.ism || "—"}
                    {h.egasi && <span className="block text-flex-black/35 text-xs">{h.egasi}</span>}
                  </td>
                  <td className="py-2.5">
                    {h.tarif === "premium" ? (
                      <span className="text-[#a1802f]">premium</span>
                    ) : (
                      <span className="text-flex-black/40">bepul</span>
                    )}
                  </td>
                  <td className="py-2.5 tabular-nums">
                    {/* A gift and a sale of zero are different things, and the
                        reason is what tells them apart in a month's figures. */}
                    {h.tolangan ? (
                      som(h.tolangan)
                    ) : (
                      <span className="text-flex-black/40">
                        {h.sovga_sababi ? `sovg'a — ${h.sovga_sababi}` : "—"}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-flex-black/45">{when(h.olingan)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
