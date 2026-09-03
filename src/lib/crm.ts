import type { Lang } from "@/lib/i18n";

// The list of people a card has collected, and the order to read it in.
//
// A CRM is not a table of contacts; it is an answer to one question asked every
// morning: who is waiting on me. Everything here exists to answer that, because
// a list sorted by date is the list somebody scrolls once and never opens again
// — the person who most needs an answer is usually not the newest.
//
// Pure on purpose. The ordering is the product's opinion, the screen and the
// assistant both act on it, and an opinion two places disagree about is two
// opinions.

export type Stage = "new" | "talking" | "client" | "cold";

export const STAGES: readonly Stage[] = ["new", "talking", "client", "cold"];

export function isStage(value: unknown): value is Stage {
  return typeof value === "string" && (STAGES as readonly string[]).includes(value);
}

export type Contact = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  /** What the visitor typed about themselves. Never overwritten. */
  note: string | null;
  /** What the owner wrote about them afterwards. */
  ownerNote: string | null;
  stage: Stage;
  tags: string[];
  followUpOn: string | null;
  lastTouchAt: string | null;
  source: "nfc" | "qr" | "share" | "manual" | "import" | null;
  createdAt: string;
};

/**
 * Why this person is at the top of the list.
 *
 * `overdue` is a promise already broken, so it outranks everything. `today` is
 * a promise about to be. `unanswered` is the one that quietly loses business:
 * somebody handed over their number, nobody replied, and no diary entry was
 * ever made — nothing anywhere is going to raise it again.
 */
export type Reason = "overdue" | "today" | "unanswered" | "quiet" | null;

/** A contact left alone this long has gone cold whether or not it says so. */
export const QUIET_DAYS = 30;

/** A tap that gets no reply for this long has been dropped, not deferred. */
export const UNANSWERED_DAYS = 2;

const DAY = 86_400_000;

function daysBetween(from: string, to: Date): number {
  return Math.floor((to.getTime() - new Date(from).getTime()) / DAY);
}

/** Compares a date column against today without letting a clock time interfere. */
function dayOffset(isoDate: string, today: Date): number {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  const then = Date.UTC(y, (m ?? 1) - 1, d ?? 1);
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((then - now) / DAY);
}

export function reasonFor(contact: Contact, today: Date = new Date()): Reason {
  // A closed relationship is not a task. Somebody who became a customer and
  // somebody who was written off are both dealt with, and a list that keeps
  // proposing them is a list that gets ignored.
  if (contact.stage === "client" || contact.stage === "cold") {
    if (contact.followUpOn && dayOffset(contact.followUpOn, today) <= 0) {
      return dayOffset(contact.followUpOn, today) < 0 ? "overdue" : "today";
    }
    return null;
  }

  if (contact.followUpOn) {
    const offset = dayOffset(contact.followUpOn, today);
    if (offset < 0) return "overdue";
    if (offset === 0) return "today";
    // A diary entry in the future is a decision already taken; nothing below
    // should override it and put them back on today's list.
    return null;
  }

  if (contact.stage === "new" && daysBetween(contact.createdAt, today) >= UNANSWERED_DAYS) {
    return "unanswered";
  }

  const since = contact.lastTouchAt ?? contact.createdAt;
  if (contact.stage === "talking" && daysBetween(since, today) >= QUIET_DAYS) {
    return "quiet";
  }

  return null;
}

const RANK: Record<Exclude<Reason, null>, number> = {
  overdue: 0,
  today: 1,
  unanswered: 2,
  quiet: 3,
};

/**
 * The list, most urgent first, with everything that needs nothing left after.
 *
 * Ties break on who has been waiting longest rather than who is newest: two
 * people equally overdue are not equally patient.
 */
export function byAttention(
  contacts: readonly Contact[],
  today: Date = new Date(),
): Contact[] {
  return [...contacts].sort((a, b) => {
    const ra = reasonFor(a, today);
    const rb = reasonFor(b, today);
    if (ra !== rb) {
      if (ra === null) return 1;
      if (rb === null) return -1;
      return RANK[ra] - RANK[rb];
    }
    const wa = new Date(a.followUpOn ?? a.lastTouchAt ?? a.createdAt).getTime();
    const wb = new Date(b.followUpOn ?? b.lastTouchAt ?? b.createdAt).getTime();
    if (wa !== wb) return wa - wb;
    return a.name.localeCompare(b.name);
  });
}

/** How many need something today. The number that goes on the tile. */
export function waitingCount(
  contacts: readonly Contact[],
  today: Date = new Date(),
): number {
  return contacts.filter((c) => reasonFor(c, today) !== null).length;
}

/**
 * The owner's network, counted.
 *
 * Companies rather than people, because that is the shape of a network somebody
 * can act on: nine contacts at one firm is a relationship, and nine at nine is
 * a list.
 */
export function shapeOf(contacts: readonly Contact[]): {
  total: number;
  byStage: Record<Stage, number>;
  companies: { name: string; count: number }[];
  reachableByPhone: number;
  reachableByEmail: number;
} {
  const byStage: Record<Stage, number> = { new: 0, talking: 0, client: 0, cold: 0 };
  const firms = new Map<string, number>();

  for (const contact of contacts) {
    byStage[contact.stage] += 1;
    const firm = contact.company?.trim();
    if (firm) firms.set(firm, (firms.get(firm) ?? 0) + 1);
  }

  return {
    total: contacts.length,
    byStage,
    companies: [...firms.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    reachableByPhone: contacts.filter((c) => c.phone).length,
    reachableByEmail: contacts.filter((c) => c.email).length,
  };
}

const WORDS: Record<Lang, { stages: Record<Stage, string>; reasons: Record<Exclude<Reason, null>, string> }> = {
  uz: {
    stages: {
      new: "Yangi",
      talking: "Gaplashilyapti",
      client: "Mijoz",
      cold: "Sovuq",
    },
    reasons: {
      overdue: "Muddati o'tdi",
      today: "Bugun",
      unanswered: "Javob berilmagan",
      quiet: "Uzoq vaqt jim",
    },
  },
  ru: {
    stages: {
      new: "Новый",
      talking: "В разговоре",
      client: "Клиент",
      cold: "Холодный",
    },
    reasons: {
      overdue: "Просрочено",
      today: "Сегодня",
      unanswered: "Без ответа",
      quiet: "Давно тишина",
    },
  },
  en: {
    stages: {
      new: "New",
      talking: "Talking",
      client: "Client",
      cold: "Cold",
    },
    reasons: {
      overdue: "Overdue",
      today: "Today",
      unanswered: "Never answered",
      quiet: "Gone quiet",
    },
  },
};

export function stageLabel(stage: Stage, lang: Lang): string {
  return WORDS[lang].stages[stage];
}

export function reasonLabel(reason: Reason, lang: Lang): string | null {
  return reason ? WORDS[lang].reasons[reason] : null;
}
