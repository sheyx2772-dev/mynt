"use client";

import Link from "next/link";

import { serviceLimit, type PlanId } from "@/lib/plans";
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
    booking: string;
    telegram: string;
    whatsapp: string;
    instagram: string;
    linkedin: string;
    facebook: string;
    youtube: string;
    website: string;
    city: string;
    contactEmail: string;
    phone: string;
    position: string;
    company: string;
    services: { name: string; price: string | null }[];
    plan: PlanId;
    bannerUrl: string | null;
    teamName: string | null;
    commentsOpen: boolean;
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

      {defaults.plan === "premium" ? (
        <div>
          <span className={labelClass}>Fon rasmi</span>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-4 py-2.5 text-sm text-flex-black/50">
            <span>Yangi fon tanlang</span>
            <input
              type="file"
              name="banner"
              accept="image/jpeg,image/png,image/webp"
              className="max-w-[45%] text-xs"
            />
          </label>
          <p className="mt-1 text-xs text-flex-black/35">
            Kartaning tepasidagi keng rasm. JPG, PNG yoki WEBP, 4 MB gacha.
          </p>
          {defaults.bannerUrl && (
            <label className="mt-2 flex items-center gap-2 text-xs text-flex-black/45">
              <input type="checkbox" name="bannerClear" value="1" />
              Fon rasmini olib tashlash — kartangiz dizayni qaytadi
            </label>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3">
          <p className="text-xs text-flex-black/50">
            <span className="font-medium text-flex-black/70">Fon rasmi</span> — premium
            rejada o&apos;z rasmingizni qo&apos;yish mumkin. Hozir kartangiz dizayni
            ko&apos;rinadi.{" "}
            <Link href="/tarif" className="underline underline-offset-2">
              Tariflar
            </Link>
          </p>
        </div>
      )}

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
        <div>
          <label className={labelClass} htmlFor="whatsapp">
            WhatsApp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            placeholder="+998 90 123 45 67"
            defaultValue={defaults.whatsapp}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="facebook">
            Facebook
          </label>
          <input
            id="facebook"
            name="facebook"
            placeholder="username"
            defaultValue={defaults.facebook}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="youtube">
            YouTube
          </label>
          <input
            id="youtube"
            name="youtube"
            placeholder="kanal"
            defaultValue={defaults.youtube}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="booking">
          Uchrashuv belgilash havolasi
        </label>
        <input
          id="booking"
          name="booking"
          placeholder="calendly.com/ismingiz"
          defaultValue={defaults.booking}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-flex-black/35">
          Calendly, Google Calendar yoki bot &mdash; qaysi biridan foydalansangiz,
          havolasini qo&apos;ying. Profilda birinchi bo&apos;lib chiqadi.
        </p>
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
            defaultValue={defaults.teamName ?? defaults.company}
            disabled={defaults.teamName !== null}
            className={
              defaults.teamName !== null ? `${inputClass} opacity-60` : inputClass
            }
          />
          {defaults.teamName !== null && (
            <p className="mt-1 text-xs text-flex-black/35">
              Firma tomonidan belgilangan.
            </p>
          )}
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

      <div>
        <label className={labelClass}>Xizmatlar va narxlar</label>
        <p className="mb-2 text-xs text-flex-black/35">
          Nima taklif qilasiz va qanchaga. Narxni bo&apos;sh qoldirsangiz ham bo&apos;ladi,
          yoki &laquo;kelishilgan holda&raquo; deb yozing.
          {defaults.plan === "free" && (
            <>
              {" "}
              Oddiy rejada {serviceLimit("free")} tagacha, premiumda{" "}
              {serviceLimit("premium")} tagacha.
            </>
          )}
        </p>
        <div className="space-y-2">
          {Array.from({ length: serviceLimit(defaults.plan) }, (_, i) => (
            <div key={i} className="grid grid-cols-[1fr_9rem] gap-2">
              <input
                name={`service${i}Name`}
                placeholder={i === 0 ? "Shartnoma tuzish" : "Xizmat nomi"}
                maxLength={60}
                defaultValue={defaults.services[i]?.name ?? ""}
                className={inputClass}
              />
              <input
                name={`service${i}Price`}
                placeholder={i === 0 ? "500 000 so'm" : "Narx"}
                maxLength={40}
                defaultValue={defaults.services[i]?.price ?? ""}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3">
        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            name="commentsOpen"
            value="1"
            defaultChecked={defaults.commentsOpen}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">Izohlarni ochish</span>
            <span className="mt-0.5 block text-xs text-flex-black/45">
              Profilingizga kirgan odamlar izoh yoza oladi. Har kim bittadan, va
              istalganini o&apos;zingiz o&apos;chira olasiz. Yopiq bo&apos;lsa
              izohlar umuman ko&apos;rinmaydi.
            </span>
          </span>
        </label>
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
      {/* Saved and not saved are not the only two outcomes: the text can land
          while the picture does not, and "Saqlandi." on its own is how somebody
          concludes the upload worked and stops trying. */}
      {state.saved && state.imageFailed && (
        <p className="text-sm text-amber-700">
          Ma&apos;lumotlar saqlandi, lekin rasm yuklanmadi. Birozdan keyin
          qaytadan urinib ko&apos;ring — muammo davom etsa bizga yozing.
        </p>
      )}
      {state.saved && !state.imageFailed && (
        <p className="text-sm text-flex-black/60">Saqlandi.</p>
      )}

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
