import type { Lang } from "@/lib/i18n";

// What a stranger sees when they touch somebody else's thing.
//
// This is the only screen in the product whose reader owns nothing, bought
// nothing and will not sign in. They are standing next to a car in the rain, or
// holding a dog by the collar, and they will give this maybe fifteen seconds.
// So: no profile, no prices, no navigation, and a first line that says whose
// thing this is and what they can do about it.
//
// The words differ by what the tag is on, because "you have blocked me in" and
// "I have found your dog" are not the same errand and a screen that serves both
// with one wording serves neither.

export type TagKind = "car" | "pet" | "thing";

export const TAG_KINDS: readonly TagKind[] = ["car", "pet", "thing"];

export function isTagKind(value: unknown): value is TagKind {
  return typeof value === "string" && (TAG_KINDS as readonly string[]).includes(value);
}

export type MessageKind = "blocking" | "lights" | "damage" | "found" | "other";

export const MESSAGE_KINDS: readonly MessageKind[] = [
  "blocking",
  "lights",
  "damage",
  "found",
  "other",
];

export function isMessageKind(value: unknown): value is MessageKind {
  return (
    typeof value === "string" && (MESSAGE_KINDS as readonly string[]).includes(value)
  );
}

/**
 * Which buttons this kind of thing gets.
 *
 * Ordered by how often somebody actually presses them. A stranger at a car is
 * nearly always there because they cannot get out; a stranger with a pet has
 * found it. `other` is last everywhere and is the only one that needs typing.
 */
const OFFERED: Record<TagKind, readonly MessageKind[]> = {
  car: ["blocking", "lights", "damage", "other"],
  pet: ["found", "other"],
  thing: ["found", "other"],
};

export function offeredFor(kind: TagKind): readonly MessageKind[] {
  return OFFERED[kind];
}

/** Whether pressing this needs a way back, or the owner just has to come. */
export function needsReply(kind: MessageKind): boolean {
  // "You are blocking me" is answered by the owner arriving, not by a message.
  // "I have found your dog" is not answered at all unless they can be reached.
  return kind === "found";
}

type Words = {
  /** Whose thing this is. The first line, and often the only one read. */
  heading: string;
  /** What this screen is for, in one sentence. */
  lead: string;
  /** The label on each button. */
  actions: Record<MessageKind, string>;
  /** What to call the optional free text. */
  notePlaceholder: string;
  /** The optional way back. */
  replyLabel: string;
  replyHint: string;
  placeLabel: string;
  placePlaceholder: string;
  send: string;
  sent: string;
  sentLead: string;
};

const WORDS: Record<Lang, Record<TagKind, Words>> = {
  uz: {
    car: {
      heading: "Mashina egasiga xabar",
      lead: "Egasiga darhol xabar boradi. Telefon raqamlar ikki tomonga ham ko'rinmaydi.",
      actions: {
        blocking: "Yo'lni to'sib qo'ygan",
        lights: "Chiroq yoqilgan qolgan",
        damage: "Mashinaga zarar yetgan",
        found: "Topib oldim",
        other: "Boshqa sabab",
      },
      notePlaceholder: "Qisqacha yozing — shart emas",
      replyLabel: "Sizga qanday javob bersin",
      replyHint: "Faqat siz yozsangiz ko'rsatiladi",
      placeLabel: "Qayerda",
      placePlaceholder: "Chilonzor, 12-kvartal",
      send: "Xabar yuborish",
      sent: "Xabar yuborildi",
      sentLead: "Egasi hozir xabardor bo'ldi. Bu sahifani yopsangiz bo'ladi.",
    },
    pet: {
      heading: "Hayvon egasiga xabar",
      lead: "Egasiga darhol xabar boradi. Raqamingizni yozsangiz, u siz bilan bog'lanadi.",
      actions: {
        blocking: "Yo'lni to'sib qo'ygan",
        lights: "Chiroq yoqilgan qolgan",
        damage: "Yordam kerak",
        found: "Topib oldim",
        other: "Boshqa sabab",
      },
      notePlaceholder: "Qayerda va qanday holatda topdingiz",
      replyLabel: "Egasi sizga qanday bog'lansin",
      replyHint: "Telefon yoki Telegram — busiz u siz bilan bog'lana olmaydi",
      placeLabel: "Qayerda topdingiz",
      placePlaceholder: "Yunusobod, 4-mavze",
      send: "Egasiga xabar berish",
      sent: "Rahmat, xabar yuborildi",
      sentLead: "Egasi hozir xabardor bo'ldi va siz bilan bog'lanadi.",
    },
    thing: {
      heading: "Buyum egasiga xabar",
      lead: "Egasiga darhol xabar boradi. Raqamingizni yozsangiz, u siz bilan bog'lanadi.",
      actions: {
        blocking: "Yo'lni to'sib qo'ygan",
        lights: "Chiroq yoqilgan qolgan",
        damage: "Shikastlangan",
        found: "Topib oldim",
        other: "Boshqa sabab",
      },
      notePlaceholder: "Qayerda topdingiz",
      replyLabel: "Egasi sizga qanday bog'lansin",
      replyHint: "Telefon yoki Telegram — busiz u siz bilan bog'lana olmaydi",
      placeLabel: "Qayerda topdingiz",
      placePlaceholder: "Metro, Bunyodkor bekati",
      send: "Egasiga xabar berish",
      sent: "Rahmat, xabar yuborildi",
      sentLead: "Egasi hozir xabardor bo'ldi va siz bilan bog'lanadi.",
    },
  },
  ru: {
    car: {
      heading: "Сообщение владельцу",
      lead: "Владелец получит сообщение сразу. Номера телефонов не видны ни одной из сторон.",
      actions: {
        blocking: "Перекрыл проезд",
        lights: "Горят фары",
        damage: "Повреждение",
        found: "Нашёл",
        other: "Другое",
      },
      notePlaceholder: "Кратко — необязательно",
      replyLabel: "Как с вами связаться",
      replyHint: "Показывается только если вы напишете",
      placeLabel: "Где",
      placePlaceholder: "Чиланзар, 12-квартал",
      send: "Отправить",
      sent: "Сообщение отправлено",
      sentLead: "Владелец уже уведомлён. Страницу можно закрыть.",
    },
    pet: {
      heading: "Сообщение владельцу",
      lead: "Владелец получит сообщение сразу. Оставьте номер — он свяжется с вами.",
      actions: {
        blocking: "Перекрыл проезд",
        lights: "Горят фары",
        damage: "Нужна помощь",
        found: "Нашёл",
        other: "Другое",
      },
      notePlaceholder: "Где и в каком состоянии нашли",
      replyLabel: "Как с вами связаться",
      replyHint: "Телефон или Telegram — иначе он не сможет ответить",
      placeLabel: "Где нашли",
      placePlaceholder: "Юнусабад, 4-квартал",
      send: "Сообщить владельцу",
      sent: "Спасибо, сообщение отправлено",
      sentLead: "Владелец уведомлён и свяжется с вами.",
    },
    thing: {
      heading: "Сообщение владельцу",
      lead: "Владелец получит сообщение сразу. Оставьте номер — он свяжется с вами.",
      actions: {
        blocking: "Перекрыл проезд",
        lights: "Горят фары",
        damage: "Повреждено",
        found: "Нашёл",
        other: "Другое",
      },
      notePlaceholder: "Где нашли",
      replyLabel: "Как с вами связаться",
      replyHint: "Телефон или Telegram — иначе он не сможет ответить",
      placeLabel: "Где нашли",
      placePlaceholder: "Метро, станция Бунёдкор",
      send: "Сообщить владельцу",
      sent: "Спасибо, сообщение отправлено",
      sentLead: "Владелец уведомлён и свяжется с вами.",
    },
  },
  en: {
    car: {
      heading: "Message the owner",
      lead: "They are told straight away. Neither side sees the other's number.",
      actions: {
        blocking: "You are blocking me in",
        lights: "Your lights are on",
        damage: "Your car has been damaged",
        found: "I found it",
        other: "Something else",
      },
      notePlaceholder: "A line, if you like",
      replyLabel: "How they can reach you",
      replyHint: "Shown only if you write it",
      placeLabel: "Where",
      placePlaceholder: "Chilonzor, block 12",
      send: "Send",
      sent: "Sent",
      sentLead: "The owner has been told. You can close this page.",
    },
    pet: {
      heading: "Message the owner",
      lead: "They are told straight away. Leave a number and they will contact you.",
      actions: {
        blocking: "You are blocking me in",
        lights: "Your lights are on",
        damage: "Needs help",
        found: "I found them",
        other: "Something else",
      },
      notePlaceholder: "Where and how you found them",
      replyLabel: "How the owner can reach you",
      replyHint: "Phone or Telegram — without it they cannot answer",
      placeLabel: "Where you found them",
      placePlaceholder: "Yunusobod, block 4",
      send: "Tell the owner",
      sent: "Thank you, it has been sent",
      sentLead: "The owner has been told and will contact you.",
    },
    thing: {
      heading: "Message the owner",
      lead: "They are told straight away. Leave a number and they will contact you.",
      actions: {
        blocking: "You are blocking me in",
        lights: "Your lights are on",
        damage: "It is damaged",
        found: "I found it",
        other: "Something else",
      },
      notePlaceholder: "Where you found it",
      replyLabel: "How the owner can reach you",
      replyHint: "Phone or Telegram — without it they cannot answer",
      placeLabel: "Where you found it",
      placePlaceholder: "Bunyodkor metro station",
      send: "Tell the owner",
      sent: "Thank you, it has been sent",
      sentLead: "The owner has been told and will contact you.",
    },
  },
};

export function tagWords(kind: TagKind, lang: Lang): Words {
  return WORDS[lang][kind];
}

/**
 * What the owner is told, in one line.
 *
 * This is a notification title on a phone, so it has to survive being read at
 * arm's length on a lock screen: what happened first, which thing second.
 */
export function noticeTitle(
  kind: TagKind,
  message: MessageKind,
  label: string | null,
  lang: Lang,
): string {
  const what = WORDS[lang][kind].actions[message];
  return label ? `${what} — ${label}` : what;
}
