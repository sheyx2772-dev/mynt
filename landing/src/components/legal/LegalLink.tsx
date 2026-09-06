import { Link } from "@/i18n/navigation";

// The way out of a clause.
//
// A contract that says "see the pricing page" and does not link to it is a
// contract that expects the reader to go looking, which is where the reading
// stops. One component so the three legal pages point at each other in one
// shape rather than three.
export default function LegalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mt-4 mr-3 inline-flex h-10 items-center rounded-input border border-line-2 px-4 text-sm font-semibold transition-colors hover:border-line-lead"
    >
      {children}
    </Link>
  );
}
