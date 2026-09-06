import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import DeletePostButton from "@/components/cabinet/DeletePostButton";
import PostComposer from "@/components/cabinet/PostComposer";
import SubScreen from "@/components/cabinet/SubScreen";
import { day } from "@/lib/cabinet/format";
import { ownPosts } from "@/lib/cabinet/posts";
import { openScreen } from "@/lib/cabinet/screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cabinet.sections");
  return { title: t("posts.title") };
}

// Write, and see what was written.
//
// The composer is at the top because that is what this screen is opened for;
// the list under it is newest first, each with its date and a way to take it
// down. Reactions and comments per post are not drawn because the backend
// does not count them yet — a row of zeros would be a promise the product has
// not made.
export default async function PostsPage({
  params,
}: PageProps<"/[locale]/cabinet/[handle]/posts">) {
  const handle = await openScreen(params);
  const [t, locale, posts] = await Promise.all([
    getTranslations("cabinet"),
    getLocale(),
    ownPosts(handle.raqam),
  ]);

  return (
    <SubScreen
      raqam={handle.raqam}
      screen="posts"
      title={t("sections.posts.title")}
      hint={t("sections.posts.hint")}
    >
      {handle.holat === "claimed" ? (
        <PostComposer raqam={handle.raqam} />
      ) : (
        <p className="rounded-card border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {t("posts.afterPayment")}
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-2">
        {posts.length === 0 && (
          <li className="px-1 text-sm text-muted-foreground">
            {t("posts.none")}
          </li>
        )}
        {posts.map((p) => (
          <li key={p.id} className="rounded-card bg-card p-4">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
              {p.matn}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <time dateTime={p.vaqt} className="text-xs text-muted-foreground">
                {day(p.vaqt, locale)}
              </time>
              <DeletePostButton id={p.id} />
            </div>
          </li>
        ))}
      </ul>
    </SubScreen>
  );
}
