import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../api/client";
import { som } from "../ui/format";
import { Card, Empty, Failed, Waiting } from "../ui/parts";
import PromoForm from "./PromoForm";

const KIND: Record<string, string> = {
  percent: "foiz",
  amount: "so'm",
  months: "oy",
};

// Promo codes: what exists, and a form to make another.
//
// A code is switched off rather than deleted. A spent campaign is the record of
// why a hundred orders were cheaper than the price list, and deleting the code
// deletes the reason.
export default function Promo() {
  const [open, setOpen] = useState(false);
  const client = useQueryClient();

  const codes = useQuery({
    queryKey: ["promokodlar"],
    queryFn: async () => {
      const { data, error } = await api.GET("/boshqaruv/promokodlar", {});
      if (error || !data) throw new Error("O'qilmadi");
      return data.kodlar;
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ kod, faol }: { kod: string; faol: boolean }) => {
      const { error } = await api.PUT("/boshqaruv/promokodlar/{kod}", {
        params: { path: { kod } },
        body: { faol },
      });
      if (error) throw new Error("O'zgarmadi");
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["promokodlar"] }),
  });

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-flex-black/50 text-sm">
          Kod har qanday buyurtmaga ishlaydi — raqam, obuna, qurilma, obyekt.
        </p>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-lg bg-lime px-4 py-2 font-medium text-flex-black text-sm"
        >
          {open ? "Yopish" : "Yangi kod"}
        </button>
      </div>

      {open && (
        <div className="mb-6">
          <PromoForm onCreated={() => setOpen(false)} />
        </div>
      )}

      {codes.isPending && <Waiting />}
      {codes.isError && <Failed>Kodlar o'qilmadi.</Failed>}
      {codes.data?.length === 0 && <Empty>Hali kod yo'q.</Empty>}

      <div className="space-y-2">
        {codes.data?.map((c) => (
          <Card key={c.kod}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`font-semibold ${c.faol ? "" : "text-flex-black/35 line-through"}`}>
                  {c.kod}
                </p>
                <p className="mt-0.5 text-flex-black/60 text-sm">
                  {c.turi === "amount" ? som(c.qiymati) : `${c.qiymati} ${KIND[c.turi]}`}
                  {c.turi === "percent" && c.eng_kop_chegirma
                    ? ` · eng ko'pi ${som(c.eng_kop_chegirma)}`
                    : ""}
                  {c.bir_hisob_bir_marta ? " · bir hisob bir marta" : ""}
                </p>
                {c.izoh && <p className="mt-1 text-flex-black/40 text-xs">{c.izoh}</p>}
              </div>

              <div className="shrink-0 text-right">
                <p className="tabular-nums text-sm">
                  {c.ishlatilgan}
                  <span className="text-flex-black/35">/{c.necha_marta ?? "∞"}</span>
                </p>
                <button
                  type="button"
                  onClick={() => toggle.mutate({ kod: c.kod, faol: !c.faol })}
                  className="mt-1 text-flex-black/45 text-xs transition-colors hover:text-flex-black"
                >
                  {c.faol ? "o'chirish" : "yoqish"}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
