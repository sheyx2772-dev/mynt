import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import OrderRow from "@/components/cabinet/OrderRow";
import { Link } from "@/i18n/navigation";
import { myOrders } from "@/lib/cabinet/orders";
import { requireAccount } from "@/lib/cabinet/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cabinet.orders");
  return { title: t("title") };
}

// The objects on order, newest first.
//
// One list for the account: the backend filters by who is asking, and the
// page draws what comes back. There is nothing to press on a row yet — an
// order's address is written at checkout and the rest is ours to do.
export default async function OrdersPage({
  params,
}: PageProps<"/[locale]/cabinet/orders">) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAccount();

  const [t, lang, orders] = await Promise.all([
    getTranslations("cabinet"),
    getLocale(),
    myOrders(),
  ]);

  return (
    <div>
      <Link
        href="/cabinet"
        className="inline-flex min-h-10 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={2} />
        {t("title")}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {t("orders.title")}
      </h1>

      {orders.length === 0 ? (
        <p className="mt-6 rounded-card border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t("orders.none")}
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} locale={lang} />
          ))}
        </ul>
      )}
    </div>
  );
}
