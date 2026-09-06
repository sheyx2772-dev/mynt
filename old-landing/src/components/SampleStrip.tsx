import { LAYOUTS } from "@/components/ui/LayoutSamples";
import { SampleShelf, SampleTile } from "@/components/SampleShelf";
import ProfileCard from "@/components/figma/ProfileCard";
import ProfileCardV2 from "@/components/figma/ProfileCardV2";
import { profiles } from "@/components/figma/profiles";
import { orgSamples, hasOwnLogo } from "@/lib/org-samples";
import { LAYOUT_ORDER, ORG_ORDER, V2_ORDER, bySampleOrder } from "@/lib/sample-order";
import "@/components/figma/katalog.css";

/**
 * One shelf of samples, on the same rail as the devices and the verticals.
 *
 * Two kinds sit on it, in one row rather than two: the seven layouts — the
 * shape a profile can take — and then the fourteen organisations, which answer
 * the same question from the other side, what it looks like when the card
 * belongs to a body the visitor already recognises. They are the same question
 * to whoever is scrolling, so they are the same shelf.
 *
 * Each tile shows the thing itself rather than a picture of it — the same
 * components the bench and the catalogue draw, clipped to the tile's height. A
 * screenshot would be lighter and would go stale the first time one of them
 * changed; this cannot.
 *
 * Both are ordered strongest first — see sample-order.ts. The file order was
 * the order they happened to be written in, which put the quietest layout of
 * the seven in the second slot.
 *
 * The organisation card is the catalogue's own component, so it needs the
 * catalogue's tokens: they are scoped to `.figma-katalog`, which is why each
 * preview is wrapped rather than the stylesheet being made global. `theme` is
 * fixed dark because the frame is a black screen and the card has no light
 * state that would sit on one.
 */
export default function SampleStrip({
  label,
  note,
  open,
  lang,
}: {
  label: string;
  note: string;
  open: string;
  lang: "uz" | "ru" | "en";
}) {
  return (
    <SampleShelf label={label} note={note}>
      {bySampleOrder(LAYOUTS, (l) => l.name, LAYOUT_ORDER).map((l) => (
        <SampleTile
          key={l.name}
          href="/katalog?bolim=layouts"
          name={l.name}
          who={l.who}
          open={open}
        >
          {l.render()}
        </SampleTile>
      ))}

      {/* The seventeen designs, between the layouts and the organisations.
          They answer the same question those two do — what the page behind the
          number looks like — so they belong on the same rail rather than on a
          shelf of their own. They sit after the seven because those were
          ordered by hand and lead with the best thing here; they sit before the
          fourteen because a row of one template wearing different brands is
          the weakest stretch of the shelf and should not come first. */}
      {bySampleOrder(
        // One tile per design, not one per record. Four of the twenty-five are
        // the `brand` template wearing different names, and they sorted to the
        // same rank — four near-identical cards in a row, which is the thing
        // this shelf's order exists to prevent. The rest stay in /katalog.
        Object.values(
          Object.fromEntries(
            profiles.filter((p) => p.template).map((p) => [p.template!, p]),
          ),
        ),
        (p) => p.template!,
        V2_ORDER,
      ).map((p) => (
        <SampleTile
          key={p.id}
          href="/katalog?bolim=dizayn"
          name={p.orgShort}
          who={p.categoryLabel}
          open={open}
        >
          <ProfileCardV2 profile={p} />
        </SampleTile>
      ))}

      {bySampleOrder(orgSamples(), (p) => p.id, ORG_ORDER).map((p) => (
        <SampleTile
          key={p.id}
          href="/katalog?bolim=org"
          name={p.orgShort}
          who={p.categoryLabel}
          open={open}
        >
          <div className="figma-katalog" data-figma-theme="dark">
            <ProfileCard
              profile={p}
              lang={lang === "ru" ? "ru" : "uz"}
              theme="dark"
              banner={hasOwnLogo(p.id) ? undefined : null}
            />
          </div>
        </SampleTile>
      ))}
    </SampleShelf>
  );
}
