// Sign-out is a POST so a prefetch or link preview cannot end the session.
export default function SignOutButton() {
  return (
    <form action="/chiqish" method="post">
      <button
        type="submit"
        className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-mynt-black/60 transition-colors hover:bg-black/[0.03]"
      >
        Chiqish
      </button>
    </form>
  );
}
