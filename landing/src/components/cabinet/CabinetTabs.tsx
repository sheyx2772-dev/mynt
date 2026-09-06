import {
  ArrowRightLeft,
  BarChart3,
  CreditCard,
  Lock,
  MessageSquare,
  Palette,
  QrCode,
  UserRound,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export type CabinetScreen =
  | "profile"
  | "theme"
  | "qr"
  | "leads"
  | "posts"
  | "stats"
  | "privacy"
  | "transfer"
  | "plan";

type ClusterKey = "card" | "activity" | "settings";

const CLUSTERS: Record<
  ClusterKey,
  Array<{
    id: CabinetScreen;
    Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }>
> = {
  card: [
    { id: "profile", Icon: UserRound },
    { id: "theme", Icon: Palette },
    { id: "qr", Icon: QrCode },
  ],
  activity: [
    { id: "leads", Icon: Users },
    { id: "posts", Icon: MessageSquare },
    { id: "stats", Icon: BarChart3 },
  ],
  settings: [
    { id: "privacy", Icon: Lock },
    { id: "transfer", Icon: ArrowRightLeft },
    { id: "plan", Icon: CreditCard },
  ],
};

function clusterOf(screen: CabinetScreen): ClusterKey {
  if (screen === "profile" || screen === "theme" || screen === "qr") {
    return "card";
  }
  if (screen === "leads" || screen === "posts" || screen === "stats") {
    return "activity";
  }
  return "settings";
}

// Fast cluster-aware tab bar inside Cabinet SubScreens.
//
// Shows related sibling screens as a segmented tab control so the owner can
// switch between e.g. Profile, Theme, and QR-code instantly without having
// to navigate back and forth to the home hub.
export default async function CabinetTabs({
  raqam,
  active,
  waiting = 0,
  leadsCount = 0,
}: {
  raqam: string;
  active: CabinetScreen;
  waiting?: number;
  leadsCount?: number;
}) {
  const t = await getTranslations("cabinet");
  const currentCluster = clusterOf(active);
  const siblings = CLUSTERS[currentCluster];

  const clusterDefaults: Record<ClusterKey, CabinetScreen> = {
    card: "profile",
    activity: "leads",
    settings: "privacy",
  };

  const clusterKeys: ClusterKey[] = ["card", "activity", "settings"];

  return (
    <div className="mb-6 flex flex-col gap-2.5">
      {/* Category switcher */}
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {clusterKeys.map((cluster) => {
          const isCurrentCluster = cluster === currentCluster;
          return (
            <Link
              key={cluster}
              href={`/cabinet/${raqam}/${clusterDefaults[cluster]}`}
              className={`rounded-md px-2 py-1 transition-colors ${
                isCurrentCluster
                  ? "bg-secondary text-foreground font-semibold"
                  : "hover:bg-muted hover:text-foreground"
              }`}
            >
              {t(`groups.${cluster}`)}
            </Link>
          );
        })}
      </div>

      {/* Sibling segmented tabs */}
      <nav className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/70 p-1">
        {siblings.map(({ id, Icon }) => {
          const isActive = id === active;
          const badge =
            id === "privacy" ? waiting : id === "leads" ? leadsCount : 0;

          return (
            <Link
              key={id}
              href={`/cabinet/${raqam}/${id}`}
              className={`relative flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${
                isActive
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                className="size-3.5 shrink-0"
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              <span className="truncate">{t(`sections.${id}.title`)}</span>
              {badge > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.2 font-mono text-[10px] font-semibold text-primary-foreground">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
