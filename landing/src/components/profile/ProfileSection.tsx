import type { ReactNode } from "react";

// A titled block. One file so the rule, the tracking and the gap above a
// heading are decided once — three sections each drawing their own is how a
// page ends up with three sizes of the same label.

export default function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="cap mb-3 border-b border-[var(--p-line)] pb-2.5 text-[var(--p-text-3)]">
        {title}
      </h2>
      {children}
    </section>
  );
}
