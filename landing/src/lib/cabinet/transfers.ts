import "server-only";

import { asReader } from "@/lib/backend/reader";
import type { components } from "@/lib/backend/schema";
import { normalize } from "./handles";

export type Transfer = components["schemas"]["Transfer"];

export async function listTransfersForHandle(
  raw: string,
): Promise<Transfer[]> {
  const raqam = normalize(raw);
  if (!raqam) return [];

  const { api } = await asReader();
  const { data, error } = await api.GET("/raqamlar/{raqam}/otkazishlar", {
    params: { path: { raqam } },
  });

  if (error || !data) return [];
  return data.otkazishlar ?? [];
}

export async function listIncomingTransfers(): Promise<Transfer[]> {
  const { api } = await asReader();
  const { data, error } = await api.GET("/men/otkazishlar", {});
  if (error || !data) return [];
  return data.otkazishlar ?? [];
}

export async function offerTransfer(
  raw: string,
  targetPhoneOrEmail: string,
): Promise<{ ok: boolean; error?: string }> {
  const raqam = normalize(raw);
  const kimga = targetPhoneOrEmail.trim();
  if (!raqam || !kimga) {
    return { ok: false, error: "Qabul qiluvchini kiriting." };
  }

  const { api } = await asReader();
  const { error } = await api.POST("/raqamlar/{raqam}/otkazishlar", {
    params: { path: { raqam } },
    body: { kimga },
  });

  if (error) {
    return {
      ok: false,
      error: "O'tkazish taklifini yaratib bo'lmadi. Ma'lumotlarni tekshiring.",
    };
  }

  return { ok: true };
}

export async function cancelTransfer(id: string): Promise<boolean> {
  if (!id) return false;
  const { api } = await asReader();
  const { error } = await api.DELETE("/otkazishlar/{id}", {
    params: { path: { id } },
  });
  return !error;
}

export async function acceptTransfer(id: string): Promise<boolean> {
  if (!id) return false;
  const { api } = await asReader();
  const { error } = await api.POST("/otkazishlar/{id}/qabul", {
    params: { path: { id } },
  });
  return !error;
}
