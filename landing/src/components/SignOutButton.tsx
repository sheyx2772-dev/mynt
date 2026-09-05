// Sign-out is a POST so a prefetch or link preview cannot end the session.
export default function SignOutButton() {
  return (
    <form action="/chiqish" method="post">
      <button
        type="submit"
        className="rounded-full border border-ink-line px-4 py-2 text-sm font-medium text-paper-2 transition-colors hover:bg-ink-s2"
      >
        Chiqish
      </button>
    </form>
  );
}
