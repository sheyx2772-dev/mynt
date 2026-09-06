import { notFound } from "next/navigation";

// The address a path with no owner is rewritten to by the proxy.
//
// It exists because `notFound()` only sets a status if it runs before the
// response is flushed, and /[handle] streams a skeleton first. This route has
// no loading.tsx and nothing to await, so the call lands on an unopened
// response and the visitor gets a real 404 — rendered by app/not-found.tsx,
// under the address they actually typed.
export default function NotFoundRoute(): never {
  notFound();
}
