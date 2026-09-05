"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePost } from "@/app/kabinet/[handle]/actions";

export default function DeletePostButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => void deletePost(postId))}
      disabled={pending}
      aria-label="Postni o'chirish"
      className="text-paper-3 transition-colors hover:text-danger-ink disabled:opacity-40"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
