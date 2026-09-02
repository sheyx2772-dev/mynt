import { permanentRedirect } from "next/navigation";

// The plans moved onto the personal page, beside the thing they apply to.
//
// The address stays: it is in the footer of every printed thing, in the
// cabinet, and in the reminder we send when a subscription is about to lapse.
// A page that used to answer a question should not start answering 404.
export default async function TarifPage({ searchParams }: PageProps<"/tarif">) {
  const { til } = await searchParams;
  const suffix = typeof til === "string" ? `?til=${encodeURIComponent(til)}` : "";
  permanentRedirect(`/shaxsiy${suffix}#tarif`);
}
