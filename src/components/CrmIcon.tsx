import {
  AlarmClock,
  Hammer,
  ListChecks,
  MapPin,
  PackageCheck,
  Truck,
  Undo2,
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
import { FULFILMENT_ICON, type Fulfilment } from "@/lib/fulfilment";

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

const PARCEL: Record<string, LucideIcon> = {
  "map-pin": MapPin,
  "list-checks": ListChecks,
  hammer: Hammer,
  truck: Truck,
  "package-check": PackageCheck,
  "undo-2": Undo2,
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

/** The same lookup for a parcel's state. Named in fulfilment.ts. */
export function FulfilmentIcon({
  state,
  className,
}: {
  state: Fulfilment;
  className?: string;
}) {
  const Icon = PARCEL[FULFILMENT_ICON[state]] ?? ListChecks;
  return <Icon className={className} />;
}
