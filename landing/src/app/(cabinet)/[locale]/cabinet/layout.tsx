import CabinetBar from "@/components/cabinet/CabinetBar";
import { Toaster } from "@/components/ui/sonner";

// The owner's room, and the one bar it wears.
//
// A compact top bar rather than a bottom bar, and that was a real choice. On a
// phone the thumb lives at the bottom, which argues for tabs down there — but
// a bottom bar wants three to five destinations of equal rank, and the cabinet
// is not shaped like that: it is one hub per number with six screens behind
// it. Two of those screens (the profile form, the theme picker) already pin a
// save button to the bottom of the phone, and a tab bar under a save button is
// two things fighting for the same thumb.
//
// What a signed-in person needs from the chrome is smaller than a nav: to know
// WHICH number they are looking at, a way back to that number's home, a way
// to their other numbers, and — rarely — the account: orders and sign-out. The
// bar holds exactly those, left to right: the mark is the way home, the plate
// in the middle names the number and opens the others, and the account sits
// behind one menu on the right because sign-out is the one thing on a screen
// that should take a moment to find. Each screen's own back link stays at the
// top of its content, under the thumb of a right hand.
//
// No language switch and no link to pricing: the language was chosen at
// sign-in and travels in the path, and the person here has already bought.
//
// One column the width of a phone held in one hand, centred on a wide
// monitor. A cabinet stretched to 1400px is a form with its label a metre
// from its field.
export default function CabinetLayout({
  children,
}: LayoutProps<"/[locale]/cabinet">) {
  return (
    <>
      <CabinetBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:px-6 sm:py-8">
        {children}
      </main>
      <Toaster theme="dark" />
    </>
  );
}
