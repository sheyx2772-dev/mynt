import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import HandleField from "@/components/HandleField";
import HandleResult from "@/components/HandleResult";
import { getPathname } from "@/i18n/navigation";

// Ask whether a number is free, and answer on the same page.
//
// It is drawn as the address it becomes. The first version had two boxes of
// tracked monospace and a dark button beside them, which is what a one-time
// code screen looks like — and what is sold here is not a code, it is
// `arend.uz/AAA777`. So the domain sits in the field, the number continues it,
// and the whole thing is one plate.
//
// One field, not two. Two produced `?harflar=sdf&raqamlar=423`: one number
// wearing three addresses once case is counted, which is exactly what the
// locale routing refuses to do for pages.
//
// The form submits to this page rather than away from it. Somebody asking "is
// AAA777 free" should not be moved somewhere to find out — and because it is a
// GET, the answer has an address they can send to somebody.
//
// The field owns the space beneath it and is handed the server\'s answer as
// children: only one of the answer and the live price is ever true, and a
// component that does not know about the other draws on top of it.
export default async function HandleForm({ asked }: { asked?: string }) {
  const t = await getTranslations("hero");
  const locale = await getLocale();

  // Written out rather than left to a redirect: a path with no locale on it
  // takes a detour through the proxy before it reaches the page.
  const action = getPathname({ href: "/", locale });

  return (
    <form action={action} className="mt-4">
      <label htmlFor="raqam" className="sr-only">
        {t("numberLabel")}
      </label>

      <HandleField
        id="raqam"
        name="number"
        asked={asked}
        title={t("numberTitle")}
        placeholder="ABC123"
        checkLabel={t("check")}
      >
        {asked ? (
          // Suspended so the wait lands here and nowhere else. Without it the
          // lookup suspends the whole route, `loading.tsx` takes the screen,
          // and somebody who pressed a button watched the page they were
          // reading disappear — the answer to a small question should not
          // cost the page it was asked on.
          //
          // The shell flushes first and this streams in behind it, so the
          // header, the hero and the number they typed are all still there
          // while the server is asked.
          <Suspense fallback={<Pending />}>
            <HandleResult asked={asked} />
          </Suspense>
        ) : (
          <p className="mt-3 text-[13px] text-ink-3">{t("hint")}</p>
        )}
      </HandleField>
    </form>
  );
}

// The shape of the answer, holding its own space.
//
// Not a spinner: the card that arrives is this tall, so drawing its outline
// means nothing below it moves when the real one lands.
function Pending() {
  return (
    <div
      className="mt-4 h-[86px] max-w-xl animate-pulse rounded-card border border-line bg-white motion-reduce:animate-none"
      aria-hidden="true"
    />
  );
}
