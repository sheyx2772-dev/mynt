import { Eye } from "lucide-react";



// The landing page described the profile in prose while never showing it.
// This is the real thing at a glance — same dark card, same stats row, same
// link buttons a visitor sees after tapping someone's card.
//
// A sample rather than somebody's actual profile, and labelled as one where it
// is shown: the three real residents are people, and putting one of them on the
// front of the shop is a thing you ask permission for, not a thing you do
// because their page happens to be public.
//
// The words were hardcoded Uzbek, which was invisible while this only appeared
// on a page nobody had translated it into. It takes the dictionary now.
export type PreviewLabels = {
  role: string;
  tagOne: string;
  tagTwo: string;
  followers: string;
  views: string;
  saveContact: string;
};

export default function ProfilePreview({ labels }: { labels: PreviewLabels }) {
  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-[1.4rem] bg-flex-black p-5 text-white shadow-[0_35px_70px_-25px_rgba(14,10,27,0.55)]">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-lime font-display text-lg font-semibold text-flex-black shadow-[0_10px_24px_-8px_rgba(171,255,9,0.6)]">
          AR
        </div>
        <p className="relative mt-4 font-display text-xl font-semibold">Aziza Rahimova</p>
        <p className="relative mt-0.5 font-tabular text-xs text-white/45">flex.com.uz/TOS001</p>
        <p className="relative mt-3 text-sm text-white/70">{labels.role}</p>

        <div className="relative mt-4 flex gap-2">
          <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-white/60">
            #{labels.tagOne}
          </span>
          <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-white/60">
            #{labels.tagTwo}
          </span>
        </div>

        <div className="relative mt-5 flex gap-5 border-t border-white/10 pt-4">
          <div>
            <p className="font-display text-base font-semibold tabular-nums">128</p>
            <p className="text-[11px] text-white/40">{labels.followers}</p>
          </div>
          <div>
            <p className="font-display text-base font-semibold tabular-nums">2 481</p>
            <p className="flex items-center gap-1 text-[11px] text-white/40">
              <Eye className="h-2.5 w-2.5" />
              {labels.views}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="rounded-xl bg-lime px-4 py-2.5 text-center text-sm font-medium text-flex-black">
          {labels.saveContact}
        </div>
        <div className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-center text-sm font-medium shadow-sm">
          Telegram
        </div>
        <div className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-center text-sm font-medium shadow-sm">
          Instagram
        </div>
      </div>
    </div>
  );
}
