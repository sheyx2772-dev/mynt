import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../api/client";
import { Card, Failed } from "../ui/parts";

const KINDS = [
  { value: "percent", label: "Foiz" },
  { value: "amount", label: "So'm" },
  { value: "months", label: "Bepul oy" },
] as const;

const SCOPES = [
  { value: "handle", label: "Raqam" },
  { value: "subscription", label: "Obuna" },
  { value: "device", label: "Qurilma" },
  { value: "venue", label: "Obyekt" },
] as const;

// Making a code.
//
// Everything but the code and the value is optional, and empty means no limit —
// which is what somebody making a code without thinking about it means.
export default function PromoForm({ onCreated }: { onCreated: () => void }) {
  const [kod, setKod] = useState("");
  const [turi, setTuri] = useState<string>("percent");
  const [qiymati, setQiymati] = useState("");
  const [chegara, setChegara] = useState("");
  const [nechaMarta, setNechaMarta] = useState("");
  const [engKam, setEngKam] = useState("");
  const [tugashi, setTugashi] = useState("");
  const [birMarta, setBirMarta] = useState(true);
  const [nimaga, setNimaga] = useState<string[]>([...SCOPES.map((s) => s.value)]);
  const [izoh, setIzoh] = useState("");

  const client = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST("/boshqaruv/promokodlar", {
        body: {
          kod: kod.trim(),
          turi: turi as "percent" | "amount" | "months",
          qiymati: Number(qiymati),
          // Zero is how the API spells "no limit", and an empty box means the
          // same thing.
          eng_kop_chegirma: Number(chegara) || 0,
          necha_marta: Number(nechaMarta) || 0,
          eng_kam_summa: Number(engKam) || 0,
          bir_hisob_bir_marta: birMarta,
          nimaga,
          tugashi,
          izoh: izoh.trim(),
        },
      });
      if (error || !data) {
        throw new Error((error as { detail?: string })?.detail ?? "Yaratilmadi.");
      }
      return data.kod;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["promokodlar"] });
      onCreated();
    },
  });

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kod" value={kod} onChange={setKod} placeholder="YOZ2026" />
          <label className="block">
            <span className="text-flex-black/60 text-xs">Turi</span>
            <select
              value={turi}
              onChange={(e) => setTuri(e.target.value)}
              className="mt-1 w-full rounded-lg bg-flex-black/4 px-3 py-2.5 text-sm outline-none"
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label={turi === "percent" ? "Necha foiz" : turi === "months" ? "Necha oy" : "Necha so'm"}
            value={qiymati}
            onChange={setQiymati}
          />
          {turi === "percent" && (
            <Field
              label="Eng ko'p chegirma"
              value={chegara}
              onChange={setChegara}
              help="Bo'sh — chegarasiz"
            />
          )}
        </div>

        <fieldset>
          <span className="text-flex-black/60 text-xs">Nimaga ishlaydi</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {SCOPES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() =>
                  setNimaga(
                    nimaga.includes(s.value)
                      ? nimaga.filter((v) => v !== s.value)
                      : [...nimaga, s.value],
                  )
                }
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  nimaga.includes(s.value)
                    ? "bg-lime text-flex-black"
                    : "border border-flex-black/10 text-flex-black/50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Necha marta" value={nechaMarta} onChange={setNechaMarta} help="Bo'sh — cheksiz" />
          <Field label="Eng kam summa" value={engKam} onChange={setEngKam} help="Bo'sh — yo'q" />
          <Field label="Tugashi" value={tugashi} onChange={setTugashi} placeholder="2026-12-31" />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={birMarta} onChange={(e) => setBirMarta(e.target.checked)} />
          Bitta hisob faqat bir marta
        </label>

        <Field label="Izoh" value={izoh} onChange={setIzoh} placeholder="Yozgi aksiya" />

        <button
          type="submit"
          disabled={create.isPending}
          className="w-full rounded-lg bg-lime py-2.5 font-medium text-flex-black text-sm disabled:opacity-50"
        >
          {create.isPending ? "Yaratilmoqda…" : "Yaratish"}
        </button>

        {create.isError && <Failed>{create.error.message}</Failed>}
      </form>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="text-flex-black/60 text-xs">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg bg-flex-black/4 px-3 py-2.5 text-sm outline-none"
      />
      {help && <span className="mt-1 block text-flex-black/40 text-xs">{help}</span>}
    </label>
  );
}
