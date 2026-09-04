import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../api/client";
import { Card, Failed } from "../ui/parts";

// Handing a number to somebody without a sale.
//
// Replaces `scripts/handles.py give`, which needed a terminal and a service
// role key. The reason is required and is written to the row: a gift that looks
// like a sale in the numbers makes the first month's figures a lie, and the
// first month's figures are the ones that decide what to do next.
export default function Give() {
  const [raqam, setRaqam] = useState("");
  const [email, setEmail] = useState("");
  const [ism, setIsm] = useState("");
  const [sababi, setSababi] = useState("");
  const [done, setDone] = useState("");

  const client = useQueryClient();

  const give = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST("/boshqaruv/sovga", {
        body: { raqam: raqam.trim().toUpperCase(), email: email.trim(), ism: ism.trim(), sababi: sababi.trim() },
      });
      if (error || !data) {
        // The server's own sentence, which says which of the three things was
        // wrong — no such account, number taken, or a bad format.
        throw new Error((error as { detail?: string })?.detail ?? "Berilmadi.");
      }
      return data.raqam;
    },
    onSuccess: (number) => {
      setDone(number);
      setRaqam("");
      setIsm("");
      setSababi("");
      client.invalidateQueries({ queryKey: ["umumiy"] });
      client.invalidateQueries({ queryKey: ["raqamlar"] });
    },
  });

  return (
    <div className="max-w-md">
      <Card>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setDone("");
            give.mutate();
          }}
        >
          <Field label="Raqam" value={raqam} onChange={setRaqam} placeholder="AAA777" />
          <Field
            label="Kimga"
            value={email}
            onChange={setEmail}
            placeholder="odam@example.com"
            help="Hisob allaqachon bo'lishi kerak — o'zi bir marta kirgan bo'lsin."
          />
          <Field label="Kartadagi ism" value={ism} onChange={setIsm} placeholder="Aziz Karimov" />
          <Field
            label="Nima uchun"
            value={sababi}
            onChange={setSababi}
            placeholder="sartarosh, Chilonzor"
            help="Hisobotda qoladi. Sovg'a sotuvdek ko'rinsa, oylik raqamlar yolg'on bo'ladi."
          />

          <button
            type="submit"
            disabled={give.isPending}
            className="w-full rounded-lg bg-lime py-2.5 font-medium text-flex-black text-sm disabled:opacity-50"
          >
            {give.isPending ? "Berilmoqda…" : "Berish"}
          </button>

          {give.isError && <Failed>{give.error.message}</Failed>}
          {done && <p className="text-lime-ink text-sm">{done} berildi.</p>}
        </form>
      </Card>
    </div>
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
