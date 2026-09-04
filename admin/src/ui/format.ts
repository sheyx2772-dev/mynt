// How numbers and dates are written here.
//
// Their own file because they are not components: keeping them beside the
// components breaks Vite's fast refresh, which reloads a whole module when it
// exports anything that is not one.

/** Prices as they are written in Uzbekistan: grouped by three with a space. */
export function som(amount: number): string {
  return `${amount.toLocaleString("uz-UZ").replace(/,/g, " ")} so'm`;
}

/** A date somebody reads, not an ISO string. */
export function when(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
