import {
  AlarmClock,
  CircleCheckBig,
  Clock,
  MailQuestionMark,
  MessagesSquare,
  Moon,
  Snowflake,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { REASON_ICON, STAGE_ICON, type Reason, type Stage } from "@/lib/crm";

// The mark each stage and each reason wears.
//
// The choice is made in crm.ts, where both screens can see it; this is only the
// lookup from that name to the drawing. Two screens showing a stage as a
// handshake in one place and a tick in another are showing two different
// stages as far as anybody reading is concerned.

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  "messages-square": MessagesSquare,
  "circle-check-big": CircleCheckBig,
  snowflake: Snowflake,
  "alarm-clock": AlarmClock,
  clock: Clock,
  "mail-question-mark": MailQuestionMark,
  moon: Moon,
};

export function StageIcon({ stage, className }: { stage: Stage; className?: string }) {
  const Icon = ICONS[STAGE_ICON[stage]] ?? Sparkles;
  return <Icon className={className} />;
}

export function ReasonIcon({
  reason,
  className,
}: {
  reason: Exclude<Reason, null>;
  className?: string;
}) {
  const Icon = ICONS[REASON_ICON[reason]] ?? Clock;
  return <Icon className={className} />;
}
