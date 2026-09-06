"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { inputClass } from "./Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// The price list: what a salon or a lawyer sells from.
//
// Rows are added and removed in the browser and sent as two parallel arrays;
// the action pairs them by position. The limit shown is the plan's, read from
// the stored row by the page — and applied again on the server, which trims
// to its own count whatever this form sends.
type Row = { key: number; name: string; price: string };

export default function ServiceFields({
  initial,
  limit,
}: {
  initial: { name: string; price: string }[];
  limit: number;
}) {
  const t = useTranslations("cabinet.profile");
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map((s, i) => ({ key: i, ...s })),
  );

  const add = () =>
    setRows((r) => [...r, { key: Date.now(), name: "", price: "" }]);
  const remove = (key: number) =>
    setRows((r) => r.filter((x) => x.key !== key));

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={row.key} className="grid grid-cols-[1fr_auto_auto] gap-2">
          <Input
            name="service_name"
            aria-label={t("serviceName")}
            placeholder={t("serviceName")}
            maxLength={60}
            defaultValue={row.name}
            className={inputClass}
          />
          <Input
            name="service_price"
            aria-label={t("servicePrice")}
            placeholder={t("servicePrice")}
            maxLength={40}
            defaultValue={row.price}
            className={`${inputClass} w-28 font-mono`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label={`${t("removeService")} ${i + 1}`}
            onClick={() => remove(row.key)}
            className="size-11 rounded-input"
          >
            <X strokeWidth={2} />
          </Button>
        </div>
      ))}

      {rows.length < limit ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={add}
          className="h-11 rounded-input"
        >
          <Plus data-icon="inline-start" strokeWidth={2} />
          {t("addService")}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("serviceLimit", { limit })}
        </p>
      )}
    </div>
  );
}
