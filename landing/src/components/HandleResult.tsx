import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { ownerOf } from "@/lib/backend/profile";
import {
  digitRarity,
  letterRarity,
  parseHandle,
  priceForHandle,
} from "@/lib/pricing";

// The answer, under the field that asked.
//
// Two answers, and they are not two shades of one. A number that is taken has
// somebody behind it, and showing them — their face, their name, what they do
// — is the strongest thing on this page: it is the only proof a visitor gets
// that anybody else bought this. A number that is free has a price, and the
// price is the product's story, because rarity is what it costs.
//
// Rendered on the server. The competitor's calculator prices in the browser
// and cannot say who holds a number; this asks, which is the half that needs a
// server and the half that sells.

function Initials({ name }: { name: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  return (
    <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-fill font-semibold text-ink-2">
      {initials}
    </span>
  );
}

export default async function HandleResult({ asked }: { asked: string }) {
  const t = await getTranslations("rarity");
  const format = await getFormatter();

  const parsed = parseHandle(asked);
  if (!parsed) {
    return <p className="mt-3 text-[13px] text-danger">{t("blocked")}</p>;
  }

  const handle = parsed.letters + parsed.digits;

  let owner;
  try {
    owner = await ownerOf(handle);
  } catch {
    // Not an answer. Saying "free" because the backend did not reply is how a
    // visitor is told to buy something somebody already owns.
    return <p className="mt-3 text-[13px] text-danger">{t("checkFailed")}</p>;
  }

  if (owner) {
    return (
      <div className="mt-4 flex max-w-xl items-center gap-4 rounded-card border border-line bg-white p-4">
        {owner.rasm ? (
          // Not next/image: the avatars are on our own object store behind the
          // site's own hostname, already sized, and one of them is not worth a
          // loader.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={owner.rasm}
            alt=""
            className="size-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <Initials name={owner.ism} />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold tracking-[0.14em] text-ink">
              {handle}
            </span>
            <span className="cap rounded-plate bg-fill px-1.5 py-0.5 text-ink-3">
              {t("taken")}
            </span>
          </div>
          <p className="mt-1 truncate font-semibold text-ink">{owner.ism}</p>
          {(owner.lavozim || owner.kompaniya) && (
            <p className="truncate text-[13px] text-ink-3">
              {[owner.lavozim, owner.kompaniya].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        <Link
          href={`/${handle}`}
          className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink sm:flex"
        >
          {t("seeProfile")}
          <ArrowRight className="size-4" strokeWidth={2} />
        </Link>
      </div>
    );
  }

  const price = priceForHandle(parsed.letters, parsed.digits);

  return (
    <div className="mt-4 flex max-w-xl flex-wrap items-center gap-x-4 gap-y-3 rounded-card border border-line bg-white p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime text-ink">
        <Check className="size-5" strokeWidth={2.5} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold tracking-[0.14em] text-ink">
            {handle}
          </span>
          <span className="cap text-lime-ink">{t("free")}</span>
        </div>
        <p className="mt-0.5 text-[13px] text-ink-3">
          {t(`letters${letterRarity(parsed.letters).multiplier}`)} ·{" "}
          {t(`digits${digitRarity(parsed.digits).multiplier}`)}
        </p>
      </div>

      <div className="text-right">
        <div className="font-mono text-lg font-semibold tracking-[0.04em] text-ink">
          {format.number(price)}
        </div>
        <div className="text-[13px] text-ink-3">{t("soum")}</div>
      </div>

      <Link
        // Straight to the step that takes the order, not the top of the page
        // that contains it. Pressing "reserve" and arriving at a headline is
        // the reader doing the site's scrolling for it — and the number they
        // just checked is already in the query, so the step they land on is
        // filled in.
        href={{
          pathname: "/personal",
          query: { number: handle },
          hash: "order",
        }}
        className="flex h-11 shrink-0 items-center gap-2 rounded-input bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-s2"
      >
        {t("takeIt")}
        <ArrowRight className="size-4" strokeWidth={2} />
      </Link>
    </div>
  );
}
