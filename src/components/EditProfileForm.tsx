"use client";

import { useActionState } from "react";
import { updateProfile, type UpdateResult } from "@/app/kabinet/[handle]/actions";
import DevicePicker from "@/components/DevicePicker";
import type { CardDesignId } from "@/lib/card-designs";
import type { DeviceTypeId } from "@/lib/devices";

const initialState: UpdateResult = { ok: false };

export default function EditProfileForm({
  handle,
  defaults,
}: {
  handle: string;
  defaults: {
    name: string;
    bio: string;
    telegram: string;
    instagram: string;
    linkedin: string;
    website: string;
    city: string;
    contactEmail: string;
    phone: string;
    position: string;
    company: string;
    tags: string;
    cardDesign: CardDesignId;
    customDesignUrl?: string | null;
    deviceType: DeviceTypeId;
  };
}) {
  const boundAction = updateProfile.bind(null, handle);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  const inputClass =
    "w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 py-2.5 text-sm outline-none transition-colors focus:border-flex-black/30 focus:bg-white";
  const labelClass = "mb-1.5 block text-xs font-medium tracking-wide text-flex-black/50 uppercase";

  return (
    <form action={formAction} className="space-y-4 text-left">
      <div>
        <span className={labelClass}>Profil rasmi</span>
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-4 py-2.5 text-sm text-flex-black/50">
          <span>Yangi rasm tanlang</span>
          <input
            type="file"
            name="avatar"
            accept="image/jpeg,image/png,image/webp"
            className="max-w-[45%] text-xs"
          />
        </label>
        <p className="mt-1 text-xs text-flex-black/35">
          Bo&apos;sh qoldirsangiz hozirgi rasm saqlanadi. JPG, PNG yoki WEBP, 2 MB gacha.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="name">
          Ism
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={80}
          defaultValue={defaults.name}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="bio">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={280}
          defaultValue={defaults.bio}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="telegram">
            Telegram
          </label>
          <input
            id="telegram"
            name="telegram"
            placeholder="@username"
            defaultValue={defaults.telegram}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="instagram">
            Instagram
          </label>
          <input
            id="instagram"
            name="instagram"
            placeholder="@username"
            defaultValue={defaults.instagram}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="linkedin">
            LinkedIn
          </label>
          <input
            id="linkedin"
            name="linkedin"
            placeholder="aziz-karimov"
            defaultValue={defaults.linkedin}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="website">
          Veb-sayt
        </label>
        <input
          id="website"
          name="website"
          placeholder="flex.com.uz"
          defaultValue={defaults.website}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="tags">
          Yo&apos;nalishlar
        </label>
        <input
          id="tags"
          name="tags"
          placeholder="Startup, dizayn, IT"
          defaultValue={defaults.tags}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-flex-black/35">
          Vergul bilan ajrating, 5 tagacha. Profilda #teg ko&apos;rinishida chiqadi.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="position">
            Lavozim
          </label>
          <input
            id="position"
            name="position"
            placeholder="Direktor"
            maxLength={80}
            defaultValue={defaults.position}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="company">
            Kompaniya
          </label>
          <input
            id="company"
            name="company"
            placeholder="MC LEGAL"
            maxLength={80}
            defaultValue={defaults.company}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="phone">
          Telefon
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="+998 90 123 45 67"
          defaultValue={defaults.phone}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-flex-black/35">
          Profilda &laquo;Qo&apos;ng&apos;iroq&raquo; tugmasi chiqadi &mdash; bosilsa telefon o&apos;zi teradi.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="city">
            Shahar
          </label>
          <input
            id="city"
            name="city"
            placeholder="Toshkent"
            defaultValue={defaults.city}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="contactEmail">
            Email
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            placeholder="siz@email.com"
            defaultValue={defaults.contactEmail}
            className={inputClass}
          />
        </div>
      </div>
      <p className="text-xs text-flex-black/35">
        Shahar va email profilda ochiq ko&apos;rinadi.
      </p>

      <DevicePicker
        handle={handle}
        device={defaults.deviceType}
        design={defaults.cardDesign}
        customImage={defaults.customDesignUrl ?? null}
      />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.saved && <p className="text-sm text-flex-black/60">Saqlandi.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-lime px-6 py-3 font-medium text-flex-black shadow-[0_12px_30px_-10px_rgba(171,255,9,0.65)] transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {isPending ? "Saqlanmoqda..." : "Saqlash"}
      </button>
    </form>
  );
}
