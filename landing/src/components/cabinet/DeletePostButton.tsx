"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { remove } from "@/app/(cabinet)/[locale]/cabinet/[handle]/posts/actions";

// Taking a post down, with one question in between.
//
// A dialog rather than a bare button because a delete on a phone is one
// thumb-slip from the date beside it, and a post is the one thing here that
// cannot be put back.
export default function DeletePostButton({ id }: { id: string }) {
  const t = useTranslations("cabinet.posts");
  const [pending, start] = useTransition();

  const confirm = () =>
    start(async () => {
      const done = await remove(id);
      if (done) toast.success(t("deleted"));
      else toast.error(t("notDeleted"));
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          className="h-9 rounded-plate text-muted-foreground"
        >
          <Trash2 data-icon="inline-start" strokeWidth={2} />
          {t("delete")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-tile">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteBody")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 rounded-input">
            {t("keep")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            className="h-11 rounded-input bg-destructive/15 text-destructive hover:bg-destructive/25"
          >
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
