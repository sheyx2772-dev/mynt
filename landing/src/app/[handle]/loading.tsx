// What a stranger sees between the tap and the profile.
//
// This is the one screen in the product reached by touching a card, which
// means it is reached outdoors, one-handed, on whatever connection the street
// has. The page awaits the profile, then the venue, then the menu or the
// comments before it can send a byte; without this file that wait was a blank
// white screen, and a blank screen after a tap reads as a card that did not
// work.
//
// The shapes are the real ones — a band, the portrait that laps over it, the
// name, and two rows of round actions — so the layout does not jump when the
// content lands.
export default function Loading() {
  return (
    <div className="mx-auto min-h-full w-full max-w-[400px] animate-pulse">
      <div className="h-[180px] w-full bg-fill" />

      <div className="-mt-10 flex justify-center">
        <div className="h-20 w-20 rounded-full border-4 border-page bg-fill" />
      </div>

      <div className="flex flex-col items-center gap-2 px-5 pt-4">
        <div className="h-6 w-44 rounded-plate bg-fill" />
        <div className="h-4 w-28 rounded-plate bg-fill" />
      </div>

      <div className="grid grid-cols-4 gap-3 px-5 pt-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="size-[52px] rounded-full bg-fill" />
            <div className="h-2.5 w-10 rounded-plate bg-fill" />
          </div>
        ))}
      </div>

      <div className="space-y-3 px-5 pt-8">
        <div className="h-12 w-full rounded-input bg-fill" />
        <div className="h-12 w-full rounded-input bg-fill" />
      </div>
    </div>
  );
}
