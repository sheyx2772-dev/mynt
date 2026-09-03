import "server-only";

import { askJson, isAiConfigured } from "@/lib/ai/gemini";
import { redact } from "@/lib/ai/redact";
import { byAttention, shapeOf, type Contact } from "@/lib/crm";

// The assistant's read of somebody's network.
//
// What it is for: an owner opens the app with forty contacts and no idea which
// four matter this morning. The list already answers "who is waiting" — that is
// crm.ts and it needs no model. What a model adds is the sentence underneath:
// that three of the people waiting are all at one firm, that a note from two
// weeks ago said a price was sent and nothing came back, that the week's taps
// were mostly from one event.
//
// It is deliberately an extra opinion rather than the interface. The list is
// rendered first and is correct on its own; this sits above it and is allowed
// to be missing.

export type Suggestion = {
  /** K1, K2 — mapped back to a real contact before this reaches a screen. */
  ref: string;
  /** One line on why them, now. */
  why: string;
  /** Something to actually send, in the owner's language. */
  draft: string;
};

export type Brief = {
  /** Two or three sentences on the shape of the week. */
  summary: string;
  suggestions: Suggestion[];
};

/** Resolved against the owner's own rows, which the model never saw. */
export type ResolvedSuggestion = Suggestion & { contact: Contact };

export type ResolvedBrief = {
  summary: string;
  suggestions: ResolvedSuggestion[];
};

const SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ref: { type: "string" },
          why: { type: "string" },
          draft: { type: "string" },
        },
        required: ["ref", "why", "draft"],
      },
    },
  },
  required: ["summary", "suggestions"],
} as const;

const SYSTEM = `Sen tadbirkorning kontaktlar ro'yxatini o'qiydigan yordamchisan.

Qoidalar:
- Faqat o'zbek tilida yoz.
- Sen odamlarning ismini ko'rmaysan. Ular K1, K2 kabi belgilar bilan beriladi;
  javobda ham faqat shu belgilarni ishlat.
- Ko'pi bilan uchta odamni tavsiya qil. Uchtadan ko'p tavsiya — hech qanday
  tavsiya emas, chunki hech biri bajarilmaydi.
- "why" — bir jumla, nega aynan bugun. Ma'lumotdagi faktga tayan: necha kun
  kutgani, muddat o'tgani, izohda nima yozilgani.
- "draft" — yuborish mumkin bo'lgan qisqa xabar, ikki-uch jumla. Ismsiz boshla,
  chunki ismni bilmaysan. Muloyim va aniq bo'lsin.
- Ma'lumotda yo'q narsani o'ylab topma. Kompaniya nomi berilmagan bo'lsa,
  uni taxmin qilma.
- "summary" — ikki-uch jumla. Raqamlar bilan: nechta yangi kontakt, nechta
  javobsiz, qaysi kompaniyalar takrorlanadi.`;

/**
 * The assistant's note for one owner's list.
 *
 * Returns null when there is nothing worth saying or nothing able to say it —
 * no key, no contacts, a vendor that did not answer. The caller renders the
 * list regardless.
 */
export async function briefFor(
  contacts: readonly Contact[],
  today: Date = new Date(),
): Promise<ResolvedBrief | null> {
  if (!isAiConfigured()) return null;

  // Below a handful of contacts the list is the whole answer and a paragraph
  // summarising four rows is worse than silence.
  if (contacts.length < 4) return null;

  // The most urgent first and a ceiling on how many go: a hundred rows is a
  // long prompt, a slow answer and a worse one. The ordering is ours, so the
  // cut keeps the people who matter.
  const ordered = byAttention(contacts, today).slice(0, 40);
  const { brief, back } = redact(ordered, today);
  const shape = shapeOf(contacts);

  const prompt = [
    "Kontaktlar ro'yxati (JSON):",
    JSON.stringify(brief),
    "",
    "Umumiy holat:",
    JSON.stringify({
      jami: shape.total,
      bosqichlar: shape.byStage,
      kompaniyalar: shape.companies.slice(0, 8),
    }),
    "",
    "Maydonlar: stage — bosqich, reason — nega e'tibor kerak, age — necha kun",
    "oldin qo'shilgan, quiet — oxirgi aloqadan necha kun o'tgan, due — muddatga",
    "necha kun qolgan (manfiy bo'lsa o'tib ketgan), said — odamning o'zi yozgani,",
    "noted — egasining izohi.",
  ].join("\n");

  const answer = await askJson<Brief>(prompt, SCHEMA, SYSTEM);
  if (!answer?.summary) return null;

  // A reference the model invented points at nobody, and is dropped rather than
  // shown as an empty row. Everything that reaches the screen is a real person
  // from the owner's own list.
  const byId = new Map(contacts.map((c) => [c.id, c]));
  const suggestions: ResolvedSuggestion[] = [];

  for (const suggestion of answer.suggestions ?? []) {
    const id = back.get(suggestion.ref);
    const contact = id === undefined ? undefined : byId.get(id);
    if (!contact) continue;
    suggestions.push({ ...suggestion, contact });
    if (suggestions.length >= 3) break;
  }

  return { summary: answer.summary, suggestions };
}
