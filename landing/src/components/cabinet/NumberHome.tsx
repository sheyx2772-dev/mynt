import { getTranslations } from "next-intl/server";

import Attention from "./Attention";
import HomeStats from "./HomeStats";
import NumberCard from "./NumberCard";
import SectionTiles from "./SectionTiles";
import { followers } from "@/lib/cabinet/followers";
import type { OwnedHandle } from "@/lib/cabinet/handles";
import { listLeads } from "@/lib/cabinet/leads";
import { planState } from "@/lib/cabinet/plan";
import { pendingRequests } from "@/lib/cabinet/requests";
import { report } from "@/lib/cabinet/stats";

// One number's home screen — what somebody opens the cabinet for most days.
//
// The order is the order of the questions an owner actually has, from the
// data on the old site's cabinet: did anyone tap it (the seven-day figures);
// is anyone waiting on me (requests at a closed door, leads left, a plan about to lapse);
// and then, only then, the screens where things are changed.
export default async function NumberHome({ handle }: { handle: OwnedHandle }) {
  const t = await getTranslations("cabinet");
  const plan = planState(handle.tarif, handle.tarif_tugashi);

  const [week, inbox, following, leads] = await Promise.all([
    report(handle.raqam, 7),
    // Nobody waits at an open door, and the endpoint answers zero anyway;
    // the call is skipped so an open profile costs one round trip fewer.
    handle.yopiq ? pendingRequests(handle.raqam) : { list: [], count: 0 },
    followers(handle.raqam),
    listLeads(handle.raqam),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <NumberCard handle={handle} plan={plan} followers={following} />
      <HomeStats
        views={week.jami_korishlar}
        visitors={week.jami_tashrifchilar_kunlik}
        taps={week.jami_bosishlar}
        caption={t("home.week")}
      />
      <Attention handle={handle} plan={plan} waiting={inbox.count} />
      <SectionTiles
        handle={handle}
        waiting={inbox.count}
        leadsCount={leads.length}
      />
    </div>
  );
}
