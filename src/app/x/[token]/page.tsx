import type { Metadata } from "next";
import { notFound } from "next/navigation";

import TagMessageForm from "@/components/TagMessageForm";
import { getTagByToken } from "@/lib/object-tags";
import { tagWords } from "@/lib/tags";
import { getLang } from "@/lib/lang";
import { sendFromTag } from "./actions";

// Never indexed and never named. The title would otherwise put somebody's car
// in a browser history, and the address is printed on a sticker anybody can
// photograph.
export const metadata: Metadata = {
  title: "Xabar",
  robots: { index: false, follow: false },
};

// The screen a stranger sees when they touch somebody else's thing.
//
// The only screen in this product whose reader owns nothing, bought nothing and
// will never sign in. They are standing next to a car in the rain, or holding a
// dog by its collar, and they will give this about fifteen seconds.
//
// So it is white, it is one column, and it has no navigation, no branding above
// the fold, no profile and no prices. Everything the rest of the product does —
// ink surfaces, lime accents, a dense cabinet — belongs to somebody who chose
// to be here. This reader did not.
export default async function TagPage({
  params,
  searchParams,
}: PageProps<"/x/[token]">) {
  const { token } = await params;
  const { til } = await searchParams;
  const lang = await getLang(til);

  // A retired tag and a made-up one get the same answer. A sticker outlives the
  // car it was stuck to, and the person who sold that car is owed silence.
  const tag = await getTagByToken(token);
  if (!tag) notFound();

  const words = tagWords(tag.kind, lang);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-10">
      {/* Not one of our screens. The reader owns nothing here and has nowhere
          to go; four tabs along the bottom are four things to press by
          accident on the way out. */}
      <span data-no-app-bar hidden />

      <h1 className="font-display text-[26px] leading-tight font-semibold tracking-tight">
        {words.heading}
      </h1>
      <p className="mt-2.5 text-[15px] leading-relaxed text-flex-black/55">
        {words.lead}
      </p>

      <div className="mt-7">
        <TagMessageForm
          token={token}
          kind={tag.kind}
          lang={lang}
          action={sendFromTag}
        />
      </div>

      {/* The only mark on the page, and it is at the bottom where somebody who
          has finished can notice it. The point of this screen is the errand,
          not the introduction — but the stranger who used it is the person
          most likely to want one of these themselves tomorrow. */}
      <p className="mt-auto pt-10 text-center text-[12px] text-flex-black/30">
        flex.com.uz
      </p>
    </main>
  );
}
