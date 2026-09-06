"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import Field, { Group, inputClass } from "./Field";
import LinkFields from "./LinkFields";
import ServiceFields from "./ServiceFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  updateProfile,
  type ProfileState,
} from "@/app/(cabinet)/[locale]/cabinet/[handle]/profile/actions";
import type { ProfileInput } from "@/lib/cabinet/profile";

// The edit form. Plain inputs with the stored values as defaults: no state
// per keystroke, because nothing here needs to react to typing except the
// bio's counter, and the browser already keeps what was typed.
//
// The picture fields take an address, not a file. The backend stores an
// address that is already on the object store and nothing here uploads;
// that step arrives with the upload endpoint.
export default function ProfileForm({
  raqam,
  defaults,
  serviceLimit,
}: {
  raqam: string;
  defaults: ProfileInput;
  serviceLimit: number;
}) {
  const t = useTranslations("cabinet.profile");
  const router = useRouter();
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    updateProfile.bind(null, raqam),
    {},
  );

  useEffect(() => {
    if (!state.result) return;
    if (state.result === "ok") {
      toast.success(t("saved"));
      // The home card and the public page read the stored row; make sure the
      // next screen shows what was just saved rather than what was cached.
      router.refresh();
    } else {
      toast.error(t(`error.${state.result}`));
    }
  }, [state, t, router]);

  return (
    <form action={action} className="flex flex-col gap-4 pb-24">
      <Group title={t("who")}>
        <Field id="name" label={t("name")}>
          <Input
            id="name"
            name="name"
            required
            maxLength={80}
            defaultValue={defaults.name}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="position" label={t("position")}>
            <Input
              id="position"
              name="position"
              maxLength={80}
              defaultValue={defaults.position}
              className={inputClass}
            />
          </Field>
          <Field id="company" label={t("company")}>
            <Input
              id="company"
              name="company"
              maxLength={80}
              defaultValue={defaults.company}
              className={inputClass}
            />
          </Field>
        </div>
        <Field id="city" label={t("city")}>
          <Input
            id="city"
            name="city"
            maxLength={60}
            defaultValue={defaults.city}
            className={inputClass}
          />
        </Field>
        <Field id="bio" label={t("bio")} hint={t("bioHint")}>
          <Textarea
            id="bio"
            name="bio"
            maxLength={280}
            rows={3}
            defaultValue={defaults.bio}
            className="rounded-input px-3 py-2.5 text-base"
          />
        </Field>
        <Field id="tags" label={t("tags")} hint={t("tagsHint")}>
          <Input
            id="tags"
            name="tags"
            maxLength={200}
            defaultValue={defaults.tags}
            className={inputClass}
          />
        </Field>
      </Group>

      <Group title={t("pictures")}>
        <Field id="avatarUrl" label={t("avatar")} hint={t("pictureHint")}>
          <Input
            id="avatarUrl"
            name="avatarUrl"
            type="url"
            inputMode="url"
            maxLength={500}
            defaultValue={defaults.avatarUrl}
            className={inputClass}
          />
        </Field>
        <Field id="bannerUrl" label={t("banner")}>
          <Input
            id="bannerUrl"
            name="bannerUrl"
            type="url"
            inputMode="url"
            maxLength={500}
            defaultValue={defaults.bannerUrl}
            className={inputClass}
          />
        </Field>
      </Group>

      <Group title={t("contacts")}>
        <Field id="phone" label={t("phone")}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            maxLength={30}
            defaultValue={defaults.phone}
            className={inputClass}
          />
        </Field>
        <Field id="contactEmail" label={t("email")}>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            inputMode="email"
            maxLength={120}
            defaultValue={defaults.contactEmail}
            className={inputClass}
          />
        </Field>
      </Group>

      <Group title={t("links")}>
        <LinkFields defaults={defaults.links ?? {}} />
      </Group>

      <Group title={t("services")}>
        <ServiceFields initial={defaults.services ?? []} limit={serviceLimit} />
      </Group>

      {/* Pinned, so a form this long can be saved from wherever the thumb is.
          The sheet shadow says it is lying over the page rather than in it. */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 p-4 shadow-sheet backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-2xl">
          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="h-12 w-full text-base"
          >
            {pending ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </form>
  );
}
